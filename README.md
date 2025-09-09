# Porter

A chat interface for managing Railway deployments and services.

## Getting Started

Follow these steps to run Porter locally:

### 1. Install dependencies

```bash
bun install
```

### 2. Set up environment variables

Copy the example environment file to create your local configuration:

```bash
cp env.example .env
```

### 3. Configure API keys

Open `.env` and fill in your API keys:

- `OPENAI_API_KEY` - Your OpenAI API key
- `RAILWAY_API_TOKEN` - Your Railway API token

### 4. Start the database

Use Docker Compose to start MongoDB:

```bash
docker compose up -d
```

This will start MongoDB on port 27018 (to avoid conflicts with existing MongoDB
instances).

### 5. Start the development server

```bash
bun dev
```

### 6. Open the app

Visit [http://localhost:5173](http://localhost:5173) to try the app.
