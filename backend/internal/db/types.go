package db

import (
	"time"

	"github.com/lib/pq"
)

// NOTE: Maybe should split transcription and recording in the future
type Transcription struct {
	ID        string                 `json:"id" gorm:"primaryKey"`
	Filename  string                 `json:"filename"`
	Text      string                 `json:"text,omitempty" gorm:"type:text"`
	CreatedAt time.Time              `json:"created_at"`
	Words     int                    `json:"words"`
	Duration  float64                `json:"duration"`
	Tags      pq.StringArray         `json:"tags" gorm:"type:text[]"`
	Segments  []TranscriptionSegment `json:"segments" gorm:"foreignKey:TranscriptionID;constraint:OnDelete:CASCADE"`
}

type TranscriptionSegment struct {
	TranscriptionID string  `json:"transcription_id" gorm:"primaryKey"`
	ID              int     `json:"id" gorm:"primaryKey;autoIncrement:false"`
	Start           float64 `json:"start"`
	End             float64 `json:"end"`
	Text            string  `json:"text" gorm:"type:text"`
}

type Summary struct {
	ID              string    `json:"id" gorm:"primaryKey"`
	TranscriptionID string    `json:"transcription_id"`
	Text            string    `json:"text" gorm:"type:text"`
	CreatedAt       time.Time `json:"created_at"`
}

type ApiKeys struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	CreatedAt time.Time `json:"created_at"`
}

// TODO: make ID a FK of user when system becomes multi-tenant
type Settings struct {
	ID                              string `json:"id" gorm:"primaryKey"`
	EnableTranscriptionSegmentation bool   `json:"enable_transcription_segmentation"`
}
