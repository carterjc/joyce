package router

import (
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()
	// Add CORS middleware
	corsConfig := cors.Config{
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-API-Key"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}

	if os.Getenv("GIN_MODE") == "release" {
		corsConfig.AllowOrigins = []string{"https://joyce.costic.dev", "http://10.0.0.59:8080"}
	} else {
		// allow all origins for testing purposes
		corsConfig.AllowAllOrigins = true
	}

	r.Use(cors.New(corsConfig))

	r.POST("/transcribe", handleTranscribe)
	r.GET("/transcriptions", handleList)
	r.GET("/transcriptions/:id", handleGet)
	r.GET("/transcriptions/:id/download", handleDownloadAudio)
	r.GET("/summarize/:id", handleSummarize)

	// use basic auth
	adminUsers := gin.Accounts{
		"admin": os.Getenv("ADMIN_PASS"),
	}
	admin := r.Group("/admin", gin.BasicAuth(adminUsers))
	admin.GET("/usage/summary", handleUsageSummary)

	return r
}
