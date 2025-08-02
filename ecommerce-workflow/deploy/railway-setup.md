# 🚂 Railway Deployment Guide (Recommended for Ollama)

## Why Railway for Ollama + SQLite

Railway's free tier provides **$5 monthly credit** which translates to:
- **Up to 8GB RAM** (perfect for Mistral 7B)
- **Better CPU allocation** 
- **Persistent storage** for SQLite
- **Docker native** support
- **No sleeping** like Heroku

## Quick Deploy Steps

### 1. Prepare Repository

Add these files to your project:

#### `railway.json` (Railway Configuration)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "dockerfile"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health"
  }
}
```

#### `Dockerfile.railway` (Optimized for Railway)
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start command
CMD ["npm", "start"]
```

#### `.env.railway` (Railway Environment)
```env
NODE_ENV=production
PORT=3000
DATABASE_PATH=/app/data/database.sqlite
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral
UPSELL_ENABLED=true
SUMMER10_ENABLED=true
LOG_LEVEL=info
```

### 2. Deploy to Railway

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Deploy on Railway**
   - Go to https://railway.app
   - Sign up with GitHub
   - Click "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects and deploys

3. **Configure Environment**
   - Add environment variables from `.env.railway`
   - Set resource limits: 2GB RAM, 1 CPU

4. **Enable Custom Domain**
   - Railway provides: `your-app.up.railway.app`
   - Or add custom domain for free

### 3. Expected Resources Usage

With Railway's $5 credit:
- **2GB RAM**: ~$3/month (sufficient for small Mistral)
- **1 CPU**: ~$1/month  
- **Storage**: ~$0.50/month
- **Total**: ~$4.50/month (within free credit)

### 4. Alternative: Ollama Cloud Service

If Railway doesn't work, consider **Ollama hosting services**:
- **Ollama Cloud** (when available)
- **Replicate** ($0.001 per second)
- **Together AI** (competitive pricing)

## Backup Plan: Render with Lightweight AI

If you must use Render, switch to a lighter model:

```env
# Use smaller model for Render
OLLAMA_MODEL=phi3:mini  # Only 2GB RAM needed
# or
OLLAMA_MODEL=gemma:2b   # Very lightweight
```

## Testing Locally First

Before deploying, test resource usage:

```bash
# Monitor memory usage
docker stats

# Test with limited resources
docker run --memory=512m --cpus="0.1" your-app
```

## Recommendation

**Go with Railway** - it's specifically designed for this use case and the $5 monthly credit covers your needs perfectly.

Live URL will be: `https://nextbasket-ecommerce.up.railway.app`
