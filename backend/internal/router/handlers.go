package router

import (
	"fmt"
	"io"
	"log/slog"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/carterjc/joyce/internal/db"
	"github.com/carterjc/joyce/internal/processing"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/openai/openai-go"
	"gorm.io/gorm"
)

var (
	database  *gorm.DB
	client    *openai.Client
	uploadDir string
	logger    *slog.Logger
)

func SetGlobals(db *gorm.DB, aiClient *openai.Client, uploadDirectory string, log *slog.Logger) {
	database = db
	client = aiClient
	uploadDir = uploadDirectory
	logger = log
}

func handleTranscribe(c *gin.Context) {
	file, header, err := c.Request.FormFile("audio")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	defer file.Close()

	logger.Info("received file", slog.String("filename", header.Filename), slog.Int("size", int(header.Size)))

	id := uuid.New().String()
	filename := id + "_" + header.Filename
	outPath := uploadDir + "/" + filename
	out, _ := os.Create(outPath)
	io.Copy(out, file)
	out.Sync()
	out.Close()

	// probably can be simplified..
	file, err = os.Open(outPath)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	}

	resp, err := client.Audio.Transcriptions.New(
		c.Request.Context(),
		openai.AudioTranscriptionNewParams{
			File:           file,
			Model:          openai.AudioModelWhisper1,
			Language:       openai.String("en"),
			ResponseFormat: "json",
		},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	tx := db.Transcription{
		ID:        id,
		Filename:  header.Filename,
		Text:      resp.Text,
		Words:     len(strings.Fields(resp.Text)),
		Duration:  -1,
		CreatedAt: time.Now(),
		Tags:      []string{},
	}
	database.Create(&tx)

	c.JSON(http.StatusOK, tx)
}

type EnhancedTranscription struct {
	ID         string    `json:"id"`
	Filename   string    `json:"filename"`
	Text       string    `json:"text,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
	HasSummary bool      `json:"has_summary"`
}

func handleList(c *gin.Context) {
	var list []db.Transcription
	database.Order("created_at desc").Find(&list)
	c.JSON(http.StatusOK, list)
}

func handleGet(c *gin.Context) {
	var tx EnhancedTranscription

	if err := database.
		Table("transcriptions t").
		Select(`t.id, t.filename, t.text, t.created_at,
			EXISTS (
				SELECT 1 FROM summaries s WHERE s.transcription_id = t.id
			) AS has_summary`).
		Where("t.id = ?", c.Param("id")).
		Limit(1).
		Scan(&tx).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	c.JSON(http.StatusOK, tx)
}

func handleDownloadAudio(c *gin.Context) {
	// Get transcription ID from URL parameter
	id := c.Param("id")
	
	// Validate UUID format
	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid transcription ID format"})
		return
	}

	// Fetch transcription from database
	var transcription db.Transcription
	if err := database.First(&transcription, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "transcription not found"})
		return
	}

	// Construct file path
	storedFilename := id + "_" + transcription.Filename
	filePath := filepath.Join(uploadDir, storedFilename)

	// Verify file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		logger.Error("audio file not found on disk", 
			slog.String("transcription_id", id),
			slog.String("file_path", filePath))
		c.JSON(http.StatusNotFound, gin.H{"error": "audio file not found"})
		return
	}

	// Get file info for Content-Length
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		logger.Error("failed to get file info", 
			slog.String("transcription_id", id),
			slog.String("error", err.Error()))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to access file"})
		return
	}

	// Detect MIME type from file extension
	ext := filepath.Ext(transcription.Filename)
	mimeType := mime.TypeByExtension(ext)
	if mimeType == "" {
		// Default to generic audio type for unknown extensions
		mimeType = "application/octet-stream"
	}

	// Set headers for file download
	c.Header("Content-Disposition", "attachment; filename=\""+transcription.Filename+"\"")
	c.Header("Content-Type", mimeType)
	c.Header("Content-Length", fmt.Sprintf("%d", fileInfo.Size()))

	// Serve the file
	c.File(filePath)

	logger.Info("audio file downloaded", 
		slog.String("transcription_id", id),
		slog.String("filename", transcription.Filename),
		slog.Int64("size", fileInfo.Size()))
}

func handleSummarize(c *gin.Context) {
	var summary db.Summary
	err := database.First(&summary, "transcription_id = ?", c.Param("id")).Error
	if err == nil {
		c.JSON(http.StatusOK, summary)
		return
	}

	// no cached summary; proceed
	var tx db.Transcription
	if err := database.First(&tx, "id = ?", c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	params := openai.ChatCompletionNewParams{
		Model: "o4-mini-2025-04-16",
		Messages: []openai.ChatCompletionMessageParamUnion{
			{OfSystem: &openai.ChatCompletionSystemMessageParam{
				Content: openai.ChatCompletionSystemMessageParamContentUnion{
					OfString: openai.String("You summarize transcripts into professional meeting recaps."),
				},
			}},
			{OfUser: &openai.ChatCompletionUserMessageParam{
				Content: openai.ChatCompletionUserMessageParamContentUnion{
					OfString: openai.String(
						"Summarize the following transcript as a meeting recap. Focus on key points discussed, decisions made, and any action items.\n\n" +
							"Format the output as Markdown with section headings (###) and bulleted lists compatible with Obsidian:\n\n" +
							tx.Text,
					),
				},
			}},
		},
	}
	resp, err := client.Chat.Completions.New(c.Request.Context(), params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	summaryText := resp.Choices[0].Message.Content
	summary = db.Summary{
		ID:              uuid.New().String(),
		TranscriptionID: tx.ID,
		Text:            summaryText,
		CreatedAt:       time.Now(),
	}
	database.Create(&summary)

	c.JSON(http.StatusOK, gin.H{
		"id":        tx.ID,
		"summary":   summaryText,
		"generated": time.Now(),
	})
}

// admin routes

func handleUsageSummary(c *gin.Context) {
	end := time.Now()
	start := end.AddDate(0, 0, -7)
	costs, err := processing.FetchCosts(c.Request.Context(), start, end)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err})
		return
	}

	c.JSON(http.StatusOK, costs)
}
