package main

import "time"

type Transcription struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	Filename  string    `json:"filename"`
	Text      string    `json:"text,omitempty" gorm:"type:text"`
	CreatedAt time.Time `json:"created_at"`
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
