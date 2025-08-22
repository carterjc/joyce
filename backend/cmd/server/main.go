package main

import (
	"log"
	"log/slog"
	"os"

	"github.com/carterjc/joyce/internal/db"
	"github.com/carterjc/joyce/internal/router"
	"github.com/joho/godotenv"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var (
	gdb       *gorm.DB
	client    *openai.Client
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
	gdb, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic(err)
	}
	err = gdb.AutoMigrate(&db.Transcription{}, &db.Summary{}, &db.ApiKeys{})
	if err != nil {
		panic(err)
	}

	clientVal := openai.NewClient(option.WithAPIKey(apiKey))
	client = &clientVal
	os.MkdirAll(uploadDir, 0755)

}

func main() {
	router.SetGlobals(gdb, client, uploadDir, logger)
	r := router.SetupRouter()

	r.Run(":8080")
}
