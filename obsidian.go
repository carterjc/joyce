package main

import (
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/openai/openai-go"
)

// ObsidianFormat represents different output formats for Obsidian
type ObsidianFormat string

const (
	ObsidianFormatMeeting   ObsidianFormat = "meeting"
	ObsidianFormatTimestamp ObsidianFormat = "timestamp"
	ObsidianFormatSpeaker   ObsidianFormat = "speaker"
	ObsidianFormatDefault   ObsidianFormat = "default"
)

// ObsidianResponse represents the response format for Obsidian plugin
type ObsidianResponse struct {
	ID             string    `json:"id"`
	Status         string    `json:"status"`
	Text           string    `json:"text,omitempty"`
	FormattedText  string    `json:"formatted_text,omitempty"`
	Metadata       string    `json:"metadata,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
	ProcessingTime float64   `json:"processing_time,omitempty"`
}

// ObsidianWebhook represents a registered webhook
type ObsidianWebhook struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	ApiKeyID  string    `json:"api_key_id"`
	URL       string    `json:"url"`
	Secret    string    `json:"secret"`
	Events    string    `json:"events"` // comma-separated event types
	Active    bool      `json:"active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func setupObsidianRoutes(r *gin.Engine) {
	// API group with authentication
	api := r.Group("/api/obsidian")
	api.Use(obsidianAuthMiddleware())

	// Transcription endpoints
	api.POST("/transcribe", handleObsidianTranscribe)
	api.GET("/status/:id", handleObsidianStatus)
	api.GET("/format/:id", handleObsidianFormat)

	// Webhook management
	api.POST("/webhooks", handleCreateWebhook)
	api.GET("/webhooks", handleListWebhooks)
	api.DELETE("/webhooks/:id", handleDeleteWebhook)

	// API key management
	api.POST("/keys", handleCreateAPIKey)
	api.GET("/keys", handleListAPIKeys)
	api.DELETE("/keys/:id", handleDeleteAPIKey)
}

func obsidianAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		apiKey := c.GetHeader("X-API-Key")
		if apiKey == "" {
			apiKey = c.Query("api_key")
		}

		if apiKey == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "API key required"})
			c.Abort()
			return
		}

		var key ApiKeys
		if err := db.Where("id = ? AND active = ?", apiKey, true).First(&key).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid API key"})
			c.Abort()
			return
		}

		// Update last used timestamp
		db.Model(&key).Update("last_used", time.Now())
		c.Set("api_key", apiKey)
		c.Next()
	}
}

func handleObsidianTranscribe(c *gin.Context) {
	file, header, err := c.Request.FormFile("audio")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	defer file.Close()

	startTime := time.Now()

	// Process similar to regular transcribe
	id := uuid.New().String()
	filename := id + "_" + header.Filename
	outPath := uploadDir + "/" + filename

	// Save file
	out, _ := os.Create(outPath)
	io.Copy(out, file)
	out.Sync()
	out.Close()

	// Reopen file for OpenAI API
	file, err = os.Open(outPath)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Call OpenAI API directly
	resp, err := client.Audio.Transcriptions.New(
		c.Request.Context(),
		openai.AudioTranscriptionNewParams{
			File:           file,
			Model:          openai.AudioModelWhisper1,
			Language:       openai.String(c.DefaultPostForm("language", "en")),
			ResponseFormat: "json",
		},
	)
	if err != nil {
		logger.Error("Obsidian transcription failed",
			slog.String("error", err.Error()),
			slog.String("file", filename),
			slog.String("api_key", c.GetString("api_key")))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Store transcription
	tx := Transcription{
		ID:        id,
		Filename:  header.Filename,
		Text:      resp.Text,
		CreatedAt: time.Now(),
	}

	db.Create(&tx)

	processingTime := time.Since(startTime).Seconds()

	// Format response
	response := ObsidianResponse{
		ID:             id,
		Status:         "completed",
		Text:           resp.Text,
		CreatedAt:      tx.CreatedAt,
		ProcessingTime: processingTime,
	}

	// Generate formatted text based on requested format
	format := ObsidianFormat(c.DefaultPostForm("format", string(ObsidianFormatDefault)))
	response.FormattedText = formatForObsidian(tx, format)
	response.Metadata = generateObsidianMetadata(tx, header.Filename)

	c.JSON(http.StatusOK, response)

	// Trigger webhooks asynchronously
	go triggerWebhooks("transcription.completed", response)
}

func handleObsidianStatus(c *gin.Context) {
	var tx Transcription
	if err := db.First(&tx, "id = ?", c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	response := ObsidianResponse{
		ID:        tx.ID,
		Status:    "completed",
		CreatedAt: tx.CreatedAt,
	}

	c.JSON(http.StatusOK, response)
}

func handleObsidianFormat(c *gin.Context) {
	var tx Transcription
	if err := db.First(&tx, "id = ?", c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	format := ObsidianFormat(c.DefaultQuery("format", string(ObsidianFormatDefault)))
	formattedText := formatForObsidian(tx, format)
	metadata := generateObsidianMetadata(tx, tx.Filename)

	c.JSON(http.StatusOK, gin.H{
		"id":             tx.ID,
		"formatted_text": formattedText,
		"metadata":       metadata,
		"format":         format,
	})
}

func formatForObsidian(tx Transcription, format ObsidianFormat) string {
	var output strings.Builder

	switch format {
	case ObsidianFormatMeeting:
		output.WriteString(fmt.Sprintf("# Meeting Notes - %s\n\n", tx.CreatedAt.Format("2006-01-02")))
		output.WriteString("## Summary\n\n")
		output.WriteString("*[AI-generated summary pending]*\n\n")
		output.WriteString("## Transcript\n\n")
		output.WriteString(tx.Text)
		output.WriteString("\n\n## Action Items\n\n")
		output.WriteString("- [ ] Review and extract action items\n")

	case ObsidianFormatTimestamp:
		output.WriteString(fmt.Sprintf("# Transcription - %s\n\n", tx.CreatedAt.Format("2006-01-02 15:04")))
		output.WriteString("## Transcript\n\n")
		output.WriteString(tx.Text)

	case ObsidianFormatSpeaker:
		output.WriteString(fmt.Sprintf("# Speaker-Segmented Transcript - %s\n\n", tx.CreatedAt.Format("2006-01-02")))
		output.WriteString("*[Speaker diarization not yet implemented]*\n\n")
		output.WriteString("## Transcript\n\n")
		output.WriteString(tx.Text)

	default:
		output.WriteString(tx.Text)
	}

	return output.String()
}

func generateObsidianMetadata(tx Transcription, filename string) string {
	metadata := fmt.Sprintf(`---
id: %s
type: transcription
created: %s
duration: %.1f
filename: %s
source: obsidian_api
tags: [transcription, audio]
---`,
		tx.ID,
		tx.CreatedAt.Format("2006-01-02T15:04:05"),
		0.0,
		filename,
	)
	return metadata
}

// Webhook handlers
func handleCreateWebhook(c *gin.Context) {
	var webhook ObsidianWebhook
	if err := c.ShouldBindJSON(&webhook); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	webhook.ID = uuid.New().String()
	webhook.ApiKeyID = c.GetString("api_key")
	webhook.Active = true
	webhook.CreatedAt = time.Now()
	webhook.UpdatedAt = time.Now()

	if webhook.Secret == "" {
		webhook.Secret = uuid.New().String()
	}

	db.Create(&webhook)
	c.JSON(http.StatusCreated, webhook)
}

func handleListWebhooks(c *gin.Context) {
	var webhooks []ObsidianWebhook
	db.Where("api_key_id = ?", c.GetString("api_key")).Find(&webhooks)
	c.JSON(http.StatusOK, webhooks)
}

func handleDeleteWebhook(c *gin.Context) {
	result := db.Where("id = ? AND api_key_id = ?", c.Param("id"), c.GetString("api_key")).Delete(&ObsidianWebhook{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "webhook not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "webhook deleted"})
}

// API Key handlers
func handleCreateAPIKey(c *gin.Context) {
	// This should be protected by admin auth
	adminPass := c.GetHeader("X-Admin-Password")
	if adminPass != os.Getenv("ADMIN_PASS") {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "admin password required"})
		return
	}

	var request struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	apiKey := ApiKeys{
		ID:        uuid.New().String(),
		CreatedAt: time.Now(),
	}

	db.Create(&apiKey)
	c.JSON(http.StatusCreated, apiKey)
}

func handleListAPIKeys(c *gin.Context) {
	// Admin only
	adminPass := c.GetHeader("X-Admin-Password")
	if adminPass != os.Getenv("ADMIN_PASS") {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "admin password required"})
		return
	}

	var keys []ApiKeys
	db.Select("id", "name", "description", "active", "created_at", "last_used").Find(&keys)
	c.JSON(http.StatusOK, keys)
}

func handleDeleteAPIKey(c *gin.Context) {
	// Admin only
	adminPass := c.GetHeader("X-Admin-Password")
	if adminPass != os.Getenv("ADMIN_PASS") {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "admin password required"})
		return
	}

	db.Model(&ApiKeys{}).Where("id = ?", c.Param("id")).Update("active", false)
	c.JSON(http.StatusOK, gin.H{"message": "api key deactivated"})
}

func triggerWebhooks(event string, data interface{}) {
	var webhooks []ObsidianWebhook
	db.Where("active = ? AND events LIKE ?", true, "%"+event+"%").Find(&webhooks)

	for _, webhook := range webhooks {
		go sendWebhook(webhook, event, data)
	}
}

func sendWebhook(webhook ObsidianWebhook, event string, data interface{}) {
	// Implementation for sending webhook
	// This would include signing the payload with the secret
	// and retrying on failure
}
