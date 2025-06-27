package main

import "time"

type Transcription struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	Filename  string    `json:"filename"`
	Text      string    `json:"text" gorm:"type:text"`
	CreatedAt time.Time `json:"created_at"`
}

type UsageLog struct {
	ID               uint      `json:"id" gorm:"primaryKey"`
	Timestamp        time.Time `json:"timestamp"`
	Endpoint         string    `json:"endpoint"`         // e.g. "summarize", "transcribe"
	TranscriptionID  string    `json:"transcription_id"` // which record
	PromptTokens     int       `json:"prompt_tokens"`
	CompletionTokens int       `json:"completion_tokens"`
	TotalTokens      int       `json:"total_tokens"`
	Cost             float64   `json:"cost_usd"`
}
