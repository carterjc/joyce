package main

import (
	"io"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/openai/openai-go"
)

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

	tx := Transcription{
		ID:        id,
		Filename:  header.Filename,
		Text:      resp.Text,
		CreatedAt: time.Now(),
	}
	db.Create(&tx)

	c.JSON(http.StatusOK, tx)
}

func handleList(c *gin.Context) {
	var list []Transcription
	db.Select("id", "filename", "created_at").Order("created_at desc").Find(&list)
	c.JSON(http.StatusOK, list)
}

func handleGet(c *gin.Context) {
	var tx Transcription
	if err := db.First(&tx, "id = ?", c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, tx)
}

func handleSummarize(c *gin.Context) {
	var summary Summary
	err := db.First(&summary, "transcription_id = ?", c.Param("id")).Error
	if err == nil {
		c.JSON(http.StatusOK, summary)
		return
	}

	// no cached summary; proceed
	var tx Transcription
	if err := db.First(&tx, "id = ?", c.Param("id")).Error; err != nil {
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
	summary = Summary{
		ID:              uuid.New().String(),
		TranscriptionID: tx.ID,
		Text:            summaryText,
		CreatedAt:       time.Now(),
	}
	db.Create(&summary)

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
	costs, err := fetchCosts(c.Request.Context(), start, end)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err})
		return
	}

	c.JSON(http.StatusOK, costs)
}
