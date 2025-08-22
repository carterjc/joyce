# joyce

to reveal the rich interior of the mind..

## Roadmap

A lot of this scaffold is AI generated and bad, so if I want to spend more time on this, I'll be gradually cleaning up that tech debt. I also used the backend as an opportunity to try `gorm` (recently have been working with `sqlc` and `go-jet` too). I unfortunately don't love it, but hopefully the scope here stays small and it's okay.

I built this with the intention of integrating with Obsidian audio recordings, so that's the immediate prio (the frontend was a detour, but also a convenient way to develop). Over the horizon lies

- [Building the Obsidian plugin](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin) and polishing the API
- Adding different modes of summarization
- Adding speaker diarization/audio segmentation
- Adding generic webhooks (kinda supposes that transcription becomes async, which I may or may not do)
- Stylizing the frontend more to lean into the "Joycean" theme
- (Maybe) making it multi-tenant in case other people want to use

## Configuration

### Environment Variables

- `OPENAI_API_KEY` - Required for OpenAI transcriptions
- `OPENAI_API_ADMIN_KEY` - Optional admin key to see OpenAI usage analytics
- `DATABASE_URL` - PostgreSQL connection string (required)
- `ADMIN_USER` - User for admin endpoints
- `ADMIN_PASS` - Password for admin endpoints
- `UPLOAD_DIR` - Directory for storing uploaded audio files (default: `./uploads`)

## Deployment

I'm currently deploying this stack on my own hardware using [Komodo](https://komo.do). It's pretty great. The only consideration is that--because my infra repo is disaggregated from the app services--I have to handle routing through a side channel. So, after configuring the Komodo stack (or syncing via a resource group), remember to add a manual rule through Dockflare.

### Access

The NextJS frontend is exposed at: `joyce.costic.dev`

The Golang API is exposed at `joyce-api.costic.dev`.

I would've liked to use `api.joyce.costic.dev` but I don't want to deal with nested subdomains yet.

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

## dev testing

I'm trying out Yaak and saved the requests here (in `.yaak`). It's pretty good. Breath of fresh air from Postman.
