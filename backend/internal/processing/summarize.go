package processing

import (
	"context"

	"github.com/openai/openai-go"
)

// TODO: mode changes prompting
func SummarizeTranscription(ctx context.Context, client *openai.Client, mode string, text string) (string, error) {
	params := openai.ChatCompletionNewParams{
		Model: "o4-mini-2025-04-16",
		Messages: []openai.ChatCompletionMessageParamUnion{
			{OfSystem: &openai.ChatCompletionSystemMessageParam{
				Content: openai.ChatCompletionSystemMessageParamContentUnion{
					OfString: openai.String("You summarize transcripts into professional meeting recaps."),
				},
			}},
			{OfUser: &openai.ChatCompletionUserMessageParam{
				Content: openai.ChatCompletionUserMessageParamContentUnion{
					OfString: openai.String(
						"Summarize the following transcript as a meeting recap. Focus on key points discussed, decisions made, and any action items.\n\n" +
							"Format the output as Markdown with section headings (###) and bulleted lists compatible with Obsidian:\n\n" +
							text,
					),
				},
			}},
		},
	}
	resp, err := client.Chat.Completions.New(ctx, params)
	if err != nil {
		return "", err
	}

	summaryText := resp.Choices[0].Message.Content
	return summaryText, nil
}
