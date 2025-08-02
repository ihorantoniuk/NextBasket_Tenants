# 🚀 Render Deployment Guide

## Quick Deploy to Render (Recommended)

### 1. Prepare for Cloud Deployment

#### Switch to Cloud AI (OpenAI)
Since Ollama requires significant resources, switch to OpenAI for cloud deployment:

```env
# Cloud environment variables
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://... # Render provides this
OPENAI_API_KEY=your_openai_key
AI_PROVIDER=openai
UPSELL_ENABLED=true
SUMMER10_ENABLED=true
```

#### Update package.json
Add start script for production:
```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc",
    "postinstall": "npm run build"
  }
}
```

### 2. Deploy Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

3. **Deploy Service**
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Configure:
     - **Name**: `nextbasket-ecommerce`
     - **Environment**: `Node`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`

4. **Add Database**
   - Click "New +" → "PostgreSQL"
   - Name: `nextbasket-db`
   - Copy connection string

5. **Environment Variables**
   Add in Render dashboard:
   ```
   NODE_ENV=production
   DATABASE_URL=<from_render_postgres>
   OPENAI_API_KEY=<your_key>
   AI_PROVIDER=openai
   UPSELL_ENABLED=true
   SUMMER10_ENABLED=true
   ```

### 3. Expected Result
- **Live URL**: `https://nextbasket-ecommerce.onrender.com`
- **Database**: Managed PostgreSQL
- **AI**: OpenAI GPT-3.5/4
- **Uptime**: 24/7 (no sleeping)

### 4. Cost
- **Web Service**: Free (512MB RAM)
- **Database**: Free (1GB storage)
- **OpenAI**: Pay-per-use (~$0.50/1000 requests)

## Alternative: Vercel + Planetscale

### 1. Vercel Setup
```bash
npm install -g vercel
vercel login
vercel --prod
```

### 2. Planetscale Database
- Sign up at https://planetscale.com
- Create database
- Get connection string

### 3. Environment Variables
Set in Vercel dashboard:
```
DATABASE_URL=mysql://...
OPENAI_API_KEY=...
AI_PROVIDER=openai
```

## 🎯 Recommendation

**Go with Render** because:
1. Better suited for your Node.js backend
2. Includes database in free tier
3. No cold starts (unlike Vercel functions)
4. Docker support if needed later
5. Simple deployment process

Would you like me to help prepare the deployment files?
