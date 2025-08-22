# joyce

to reveal the rich interior of the mind..

## Configuration

### Environment Variables

- `OPENAI_API_KEY` - Required for OpenAI transcriptions
- `OPENAI_API_ADMIN_KEY` - Optional admin key to see OpenAI usage analytics
- `DATABASE_URL` - PostgreSQL connection string (required)
- `ADMIN_USER` - User for admin endpoints
- `ADMIN_PASS` - Password for admin endpoints
- `UPLOAD_DIR` - Directory for storing uploaded audio files (default: `./uploads`)

## Obsidian Integration

Joyce provides a dedicated API for Obsidian plugins to enable direct voice recording integration.

### API Authentication

All Obsidian API endpoints require authentication via API key:

- Pass the API key in the `X-API-Key` header or `api_key` query parameter
- Create API keys via the admin endpoint (see below)

### Obsidian API Endpoints

#### Transcribe Audio

```
POST /api/obsidian/transcribe
```

Parameters:

- `audio` (file) - Audio file to transcribe
- `language` (string) - Language code (default: "en")
- `word_timestamps` (boolean) - Include word-level timestamps (default: true)
- `initial_prompt` (string) - Optional context prompt
- `format` (string) - Output format: "default", "meeting", "timestamp", "speaker"

Response includes formatted text ready for Obsidian notes.

#### Check Status

```
GET /api/obsidian/status/:id
```

#### Get Formatted Output

```
GET /api/obsidian/format/:id?format=meeting
```

### Managing API Keys

Create an API key (admin only):

```bash
curl -X POST http://localhost:8080/api/obsidian/keys \
  -H "X-Admin-Password: $ADMIN_PASS" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Obsidian Vault", "description": "Personal vault"}'
```

### Webhooks

Register a webhook to receive transcription events:

```bash
curl -X POST http://localhost:8080/api/obsidian/webhooks \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-server.com/webhook", "events": "transcription.completed"}'
```

### Output Formats

- **default**: Plain transcription text
- **meeting**: Structured meeting notes with sections for summary, transcript, and action items
- **timestamp**: Includes word-level timestamps (when available)
- **speaker**: Prepared for speaker diarization (future feature)

Each format includes Obsidian-compatible YAML frontmatter with metadata.

## dev testing

I'm trying out Yaak and saved the requests here (in `.yaak`). It's pretty good. Breath of fresh air from Postman.
