package main

import (
	"log/slog"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var (
	db        *gorm.DB
	client    openai.Client
	uploadDir = "./uploads"
	logger    *slog.Logger
)

func init() {
	godotenv.Load()
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		panic("OPENAI_API_KEY not set")
	}

	h := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level:     slog.LevelInfo, // default level
		AddSource: true,           // include file:line
	})
	logger = slog.New(h)

	var err error
	db, err = gorm.Open(sqlite.Open("transcripts.db"), &gorm.Config{})
	if err != nil {
		panic(err)
	}
	db.AutoMigrate(&Transcription{})

	client = openai.NewClient(option.WithAPIKey(apiKey))
	os.MkdirAll(uploadDir, 0755)

}

func main() {
	r := gin.Default()

	r.POST("/transcribe", handleTranscribe)
	r.GET("/transcriptions", handleList)
	r.GET("/transcriptions/:id", handleGet)
	// r.GET("/summarize/:id", handleSummarize)

	r.Run(":8080")
}
