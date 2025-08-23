package processing

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"

	"github.com/openai/openai-go"
)

type Verbose struct {
	Task     string  `json:"task"`
	Language string  `json:"language"`
	Duration float64 `json:"duration"`
	Segments []struct {
		Id               int     `json:"id"`
		Seek             int     `json:"seek"`
		Start            float64 `json:"start"`
		End              float64 `json:"end"`
		Text             string  `json:"text"`
		Tokens           []int   `json:"tokens"`
		AvgLogprob       float64 `json:"avg_logprob"`
		CompressionRatio float64 `json:"compression_ratio"`
		NoSpeechProb     float64 `json:"no_speech_prob"`
	} `json:"segments"`
}

type TranscriptionResult struct {
	Text    string  `json:"text"`
	Verbose Verbose `json:"verbose"`
}

func TranscribeAudio(ctx context.Context, client *openai.Client, file io.Reader) (*TranscriptionResult, error) {
	enableSegmentation := true
	var params openai.AudioTranscriptionNewParams

	// if segmentation is enabled, use whisper1, else 4o
	if enableSegmentation {
		params = openai.AudioTranscriptionNewParams{
			File:                   file,
			Model:                  openai.AudioModelWhisper1,
			Language:               openai.String("en"),
			ResponseFormat:         "verbose_json",
			TimestampGranularities: []string{"segment"},
		}
	} else {
		params = openai.AudioTranscriptionNewParams{
			File:           file,
			Model:          openai.AudioModelGPT4oTranscribe,
			Language:       openai.String("en"),
			ResponseFormat: "json",
		}
	}

	result, err := client.Audio.Transcriptions.New(ctx, params)
	if err != nil {
		slog.Error("error transcribing", slog.Any("error", err))
		return &TranscriptionResult{}, err
	}

	// golang SDK is bad and doesn't map all specified fields, so have to do it on my own
	raw := []byte(result.RawJSON())
	var v Verbose
	if err := json.Unmarshal(raw, &v); err != nil {
		slog.Error("error unmarshaling verbose response", slog.Any("error", err))
		return &TranscriptionResult{}, err
	}

	return &TranscriptionResult{Text: result.Text, Verbose: v}, err
}
