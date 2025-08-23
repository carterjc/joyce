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
)

func SetGlobals(db *gorm.DB, aiClient *openai.Client, uploadDirectory string) {
	database = db
	client = aiClient
	uploadDir = uploadDirectory
}

func handleTranscribe(c *gin.Context) {
	file, header, err := c.Request.FormFile("audio")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	defer file.Close()

	slog.Info("received file", slog.String("filename", header.Filename), slog.Int("size", int(header.Size)))

	// filename is UUID + uploaded file name
	id := uuid.New().String()
	filename := id + "_" + header.Filename
	outPath := uploadDir + "/" + filename
	out, _ := os.Create(outPath)
	io.Copy(out, file)
	out.Sync()
	out.Close()

	slog.Info("writing file to upload directory", slog.String("outPath", outPath))

	// probably can be simplified..
	file, err = os.Open(outPath)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	}

	result, err := processing.TranscribeAudio(c.Request.Context(), client, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	slog.Info("got transcription", slog.Int("num_segments", len(result.Verbose.Segments)), slog.Float64("duration", result.Verbose.Duration))

	transcription := db.Transcription{
		ID:        id,
		Filename:  header.Filename,
		Text:      result.Text,
		Words:     len(strings.Fields(result.Text)),
		Duration:  result.Verbose.Duration,
		CreatedAt: time.Now(),
		Tags:      []string{},
	}

	segments := make([]db.TranscriptionSegment, len(result.Verbose.Segments))
	if cap(segments) > 0 {
		for idx, segment := range result.Verbose.Segments {
			segments[idx] = db.TranscriptionSegment{
				TranscriptionID: id,
				ID:              segment.Id,
				Start:           segment.Start,
				End:             segment.End,
				Text:            segment.Text,
			}
		}
	}

	err = database.Transaction(func(tx *gorm.DB) error {
		if err = tx.Create(&transcription).Error; err != nil {
			return err
		}
		if len(segments) == 0 {
			return nil // early exit
		}

		// else create segments too
		if err = tx.Create(&segments).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, transcription)
}

func handleList(c *gin.Context) {
	var list []db.Transcription
	if err := database.Order("created_at desc").Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, list)
}

type EnhancedTranscription struct {
	ID         string                    `json:"id"`
	Filename   string                    `json:"filename"`
	Text       string                    `json:"text,omitempty"`
	CreatedAt  time.Time                 `json:"created_at"`
	HasSummary bool                      `json:"has_summary"`
	Words      int                       `json:"words"`
	Duration   float64                   `json:"duration"`
	Tags       []string                  `json:"tags,omitempty"`
	Segments   []db.TranscriptionSegment `json:"segments,omitempty"`
}

func handleGet(c *gin.Context) {
	id := c.Param("id")

	// separate queries suck but idk, gorm is weird

	// get transcription
	var t db.Transcription
	if err := database.
		Model(&db.Transcription{}).
		Preload("Segments").
		First(&t, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	// compute has_summary
	var hasSummary bool
	if err := database.
		Model(&db.Summary{}).
		Select("count(1) > 0").
		Where("transcription_id = ?", id).
		Scan(&hasSummary).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	tx := EnhancedTranscription{
		ID:         t.ID,
		Filename:   t.Filename,
		Text:       t.Text,
		CreatedAt:  t.CreatedAt,
		HasSummary: hasSummary,
		Words:      t.Words,
		Duration:   t.Duration,
		Tags:       t.Tags,
		Segments:   t.Segments,
	}
	c.JSON(http.StatusOK, tx)
}

func handleDownloadAudio(c *gin.Context) {
	id := c.Param("id")

	// validate UUID format
	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid transcription ID format"})
		return
	}

	var transcription db.Transcription
	if err := database.First(&transcription, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "transcription not found"})
		return
	}

	storedFilename := id + "_" + transcription.Filename
	filePath := filepath.Join(uploadDir, storedFilename)

	// file exists?
	var fileInfo os.FileInfo
	var err error
	if fileInfo, err = os.Stat(filePath); os.IsNotExist(err) {
		slog.Error("audio file not found on disk",
			slog.String("transcription_id", id),
			slog.String("file_path", filePath))
		c.JSON(http.StatusNotFound, gin.H{"error": "audio file not found"})
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

	slog.Info("audio file downloaded",
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

	summaryText, err := processing.SummarizeTranscription(c.Request.Context(), client, "", tx.Text)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
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
