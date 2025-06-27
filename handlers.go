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
	db.Order("created_at desc").Find(&list).Select("id", "filename", "created_at")
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

// func handleSummarize(c *gin.Context) {
// 	var tx Transcription
// 	if err := db.First(&tx, "id = ?", c.Param("id")).Error; err != nil {
// 		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
// 		return
// 	}

// 	// 1) Ask OpenAI to summarize
// 	chatReq := openai.ChatCompletionRequest{
// 		Model: openai.GPT3Dot5Turbo,
// 		Messages: []openai.ChatCompletionMessage{
// 			{Role: "system", Content: "You are a helpful summarization assistant."},
// 			{Role: "user", Content: "Summarize this transcript:\n\n" + tx.Text},
// 		},
// 	}
// 	chatResp, err := openaiClient.CreateChatCompletion(c, chatReq)
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
// 		return
// 	}

// 	summary := chatResp.Choices[0].Message.Content
// 	c.JSON(http.StatusOK, gin.H{
// 		"id":        tx.ID,
// 		"summary":   summary,
// 		"generated": time.Now(),
// 	})
// }
