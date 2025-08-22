package processing

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"
)

const baseURL = "https://api.openai.com/v1/organization"

// CompletionsUsageResponse maps the JSON returned by /usage/completions
type CompletionsUsageResponse struct {
	Data     []UsageBucket `json:"data"`
	NextPage string        `json:"next_page,omitempty"`
}

type UsageBucket struct {
	StartTime    int64  `json:"start_time"`
	EndTime      int64  `json:"end_time"`
	BucketWidth  string `json:"bucket_width"`
	InputTokens  int    `json:"input_tokens"`
	OutputTokens int    `json:"output_tokens"`
	TotalTokens  int    `json:"total_tokens"`
	NumRequests  int    `json:"num_model_requests"`
}

// CostsResponse maps the JSON returned by /costs
type CostsResponse struct {
	Data     []CostBucket `json:"data"`
	NextPage string       `json:"next_page,omitempty"`
}

type CostBucket struct {
	StartTime   int64   `json:"start_time"`
	EndTime     int64   `json:"end_time"`
	BucketWidth string  `json:"bucket_width"`
	Amount      float64 `json:"amount.value"`
	Currency    string  `json:"amount.currency"`
}

// helper to build & execute GET requests
func doGet(ctx context.Context, path string, params map[string]string, v interface{}) error {
	adminKey := os.Getenv("OPENAI_API_ADMIN_KEY")
	if adminKey == "" {
		return fmt.Errorf("OPENAI_API_ADMIN_KEY not set, failing")
	}

	req, err := http.NewRequestWithContext(ctx, "GET", baseURL+path, nil)
	if err != nil {
		return err
	}
	q := req.URL.Query()
	for k, vv := range params {
		q.Add(k, vv)
	}
	req.URL.RawQuery = q.Encode()
	req.Header.Set("Authorization", "Bearer "+adminKey)
	req.Header.Set("Content-Type", "application/json")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		data, _ := io.ReadAll(res.Body)
		return fmt.Errorf("unexpected status %d: %s", res.StatusCode, string(data))
	}
	return json.NewDecoder(res.Body).Decode(v)
}

func fetchCompletionsUsage(ctx context.Context, start, end time.Time, bucket string) (*CompletionsUsageResponse, error) {
	params := map[string]string{
		"start_time":   fmt.Sprint(start.Unix()),
		"end_time":     fmt.Sprint(end.Unix()),
		"bucket_width": bucket,
	}
	var resp CompletionsUsageResponse
	if err := doGet(ctx, "/usage/completions", params, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

func FetchCosts(ctx context.Context, start, end time.Time) (*CostsResponse, error) {
	params := map[string]string{
		"start_time":   fmt.Sprint(start.Unix()),
		"end_time":     fmt.Sprint(end.Unix()),
		"bucket_width": "1d",
	}
	var cr CostsResponse
	if err := doGet(ctx, "/costs", params, &cr); err != nil {
		log.Printf("error fetching costs: %v", err)
		return nil, err
	}
	return &cr, nil
}
