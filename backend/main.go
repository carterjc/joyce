package main

import (
	"log"
	"log/slog"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var (
	db        *gorm.DB
	client    openai.Client
	uploadDir string
	logger    *slog.Logger
)

func init() {
	// Try to load .env from project root first, then current directory
	godotenv.Load("../.env")
	godotenv.Load(".env")
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		log.Fatal("OPENAI_API_KEY not set")
	}
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL not set")
	}
	uploadDir = os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "./uploads"
	}

	//

	h := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level:     slog.LevelInfo, // default level
		AddSource: true,           // include file:line
	})
	logger = slog.New(h)

	var err error
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic(err)
	}
	db.AutoMigrate(&Transcription{}, &Summary{}, &ApiKeys{}, &ObsidianWebhook{})

	client = openai.NewClient(option.WithAPIKey(apiKey))
	os.MkdirAll(uploadDir, 0755)

}

func main() {
	r := gin.Default()

	// Add CORS middleware
	corsConfig := cors.Config{
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-API-Key"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}

	// Configure CORS origins based on environment
	if os.Getenv("GIN_MODE") == "release" {
		corsConfig.AllowOrigins = []string{"http://localhost:3000"}
	} else {
		// Development: allow all origins for easier testing
		corsConfig.AllowAllOrigins = true
	}

	r.Use(cors.New(corsConfig))

	r.POST("/transcribe", handleTranscribe)
	r.GET("/transcriptions", handleList)
	r.GET("/transcriptions/:id", handleGet)
	r.GET("/summarize/:id", handleSummarize)

	// use basic auth
	adminUsers := gin.Accounts{
		"admin": os.Getenv("ADMIN_PASS"),
	}
	admin := r.Group("/admin", gin.BasicAuth(adminUsers))
	admin.GET("/usage/summary", handleUsageSummary)

	// Setup Obsidian API routes
	setupObsidianRoutes(r)

	r.Run(":8080")
}
