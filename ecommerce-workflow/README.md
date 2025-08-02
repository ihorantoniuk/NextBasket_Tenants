# 🛒 AI-Powered E-commerce Workflow System

## 📋 Project Overview

This project implements **Task 4: AI-Powered Checkout and Upsell** from NEXT BASKET's technical assessment. It features a comprehensive multi-tenant e-commerce platform with AI-powered upselling capabilities, built using modern technologies and clean architecture principles.

### 🎯 Key Features

- **Multi-tenant Architecture**: Complete tenant isolation with tenant-specific data
- **AI-Powered Upselling**: Integrated Ollama + Mistral model for intelligent product recommendations
- **Feature Flags**: Dynamic feature management (UPSELL_ENABLED, SUMMER10 promo)
- **Stock Management**: Real-time inventory tracking with reservation system
- **VAT Calculations**: Automated tax calculations (20% VAT)
- **Comprehensive API**: RESTful API with Swagger documentation
- **Containerized Deployment**: Docker + Docker Compose setup
- **Production Ready**: Comprehensive testing, logging, and monitoring

## 🏗️ Architecture

### Clean Architecture Pattern
```
src/
├── types/           # TypeScript interfaces and schemas
├── config/          # Configuration management
├── database/        # Database setup and migrations
├── repositories/    # Data access layer
├── services/        # Business logic layer
├── controllers/     # Request handlers
├── routes/          # API route definitions
├── middleware/      # Cross-cutting concerns
└── app.ts          # Application entry point
```

### Technology Stack

**Backend**
- Node.js 18 + TypeScript
- Express.js (REST API)
- SQLite (Database)
- Jest (Testing)
- Winston (Logging)
- Joi (Validation)

**AI Integration**
- Ollama (Local AI runtime)
- Mistral 7B (Language model)
- Fallback logic for offline scenarios

**Infrastructure**
- Docker & Docker Compose
- Swagger/OpenAPI documentation
- ESLint + Prettier (Code quality)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- Git

### Installation

1. **Clone and Navigate**
```bash
cd c:\Users\Dina\source\repos\Next_Busket\ecommerce-workflow
```

2. **Install Dependencies**
```bash
npm install
```

3. **Start with Docker (Recommended)**
```bash
docker-compose up --build
```

4. **Alternative: Local Development**
```bash
# Start Ollama separately (if you have it installed)
npm run dev
```

### 🌐 Access Points

- **Web Interface**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
- **AI Health**: http://localhost:3000/api/ai/health

## 📱 Web Interface Features

The included web interface (`public/index.html`) provides:

- **System Status Dashboard**: Real-time health monitoring
- **Multi-tenant Selector**: Switch between tenants
- **Product Catalog**: Browse and add products
- **Shopping Cart**: Add items and manage cart
- **Checkout Process**: Complete orders with AI upselling
- **Feature Flag Status**: View current feature settings

## 🧪 Testing

### Run Test Suite
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Coverage report
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Coverage
- Unit tests for all services and repositories
- Integration tests for API endpoints
- AI service mocking for offline testing
- Database transaction testing

## 🔧 Configuration

### Environment Variables
Create `.env` file:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_PATH=./database.sqlite

# AI Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral

# Feature Flags
UPSELL_ENABLED=true
SUMMER10_ENABLED=true

# Logging
LOG_LEVEL=info
```

### Feature Flags
Control features dynamically:
- `UPSELL_ENABLED`: Enable/disable AI upselling
- `SUMMER10_ENABLED`: Enable/disable SUMMER10 promo (10% discount)

## 📊 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | System health check |
| GET | `/api/features` | Get feature flags |
| GET | `/api/products` | List products (paginated) |
| POST | `/api/products` | Create product |
| GET | `/api/products/:id` | Get product details |
| POST | `/api/carts` | Create shopping cart |
| GET | `/api/carts/:id` | Get cart details |
| POST | `/api/carts/:id/items` | Add item to cart |
| POST | `/api/carts/:id/clear` | Clear cart |
| POST | `/api/checkout` | Process checkout |
| GET | `/api/ai/health` | AI service health |

### Authentication
All API requests require the `x-tenant-id` header for tenant isolation.

### Example Usage

**Create Cart & Add Items**
```bash
# Create cart
curl -X POST http://localhost:3000/api/carts \
  -H "x-tenant-id: tenant-demo" \
  -H "Content-Type: application/json"

# Add item to cart
curl -X POST http://localhost:3000/api/carts/{cartId}/items \
  -H "x-tenant-id: tenant-demo" \
  -H "Content-Type: application/json" \
  -d '{"productId": "product-1", "quantity": 2}'
```

**Checkout with Promo**
```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "x-tenant-id: tenant-demo" \
  -H "Content-Type: application/json" \
  -d '{
    "cartId": "cart-123",
    "tenantId": "tenant-demo",
    "promoCode": "SUMMER10"
  }'
```

## 🤖 AI Integration

### Production AI Setup
The system uses **Ollama + Mistral 7B** for production deployment:

**Why This Approach:**
- ✅ **Cost Effective**: No per-token charges (free after deployment)
- ✅ **Data Privacy**: All inference happens locally
- ✅ **Reliable**: No external API dependencies
- ✅ **Predictable Performance**: ~1-3 second response times
- ✅ **Scalable**: Can run multiple instances

### System Requirements
- **RAM**: 4-8GB minimum for Mistral model
- **Disk**: ~4GB for model storage
- **CPU**: Modern multi-core (GPU optional for acceleration)

### Ollama Setup
The system uses Ollama with Mistral 7B for intelligent upselling:

1. **Automatic Setup**: Docker Compose handles Ollama installation
2. **Model Download**: Mistral model is pulled automatically
3. **Fallback Logic**: System continues working if AI is unavailable

### AI Features
- **Context-Aware Recommendations**: Analyzes cart contents
- **Intelligent Reasoning**: Provides explanations for suggestions
- **Performance Optimized**: Fast inference with local deployment
- **Graceful Degradation**: Fallback when AI service is down

### Alternative Cloud AI Options
For high-scale deployments, the architecture supports switching to:
- **OpenAI GPT**: For advanced reasoning capabilities
- **Azure OpenAI**: For enterprise compliance requirements
- **AWS Bedrock**: For AWS-native deployments
- **Google Vertex AI**: For Google Cloud integration

*Current production setup uses Ollama + Mistral for optimal cost/performance balance.*

## 🐳 Docker Deployment

### Production Build
```bash
# Build production image
docker build -t ecommerce-api .

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up
```

### Service Architecture
- **API Service**: Main application (port 3000)
- **Ollama Service**: AI runtime (port 11434)
- **Health Checks**: Automatic service monitoring
- **Restart Policies**: Automatic recovery

## 🔍 Monitoring & Debugging

### Logging
- **Structured Logging**: JSON format with Winston
- **Request Tracing**: Unique request IDs
- **Error Tracking**: Detailed error logs
- **Performance Metrics**: Request timing

### Health Checks
- `/health`: Overall system health
- `/api/ai/health`: AI service status
- Database connectivity checks
- Feature flag validation

## 📈 Performance Features

### Optimization
- **Database Indexing**: Optimized queries
- **Connection Pooling**: Efficient database connections
- **Request Validation**: Early input validation
- **Error Handling**: Graceful error responses

### Scalability
- **Stateless Design**: Horizontal scaling ready
- **Multi-tenant**: Efficient resource sharing
- **Caching Ready**: Prepared for Redis integration
- **Load Balancer Ready**: Health check endpoints

## 🧩 Development Workflow

### Code Quality
```bash
# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format

# Type checking
npm run type-check
```

### Git Hooks (Recommended)
Install husky for pre-commit hooks:
```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm run lint && npm test"
```

## 🚀 Cloud Deployment

### Deployment Options

**Option 1: Heroku**
```bash
# Install Heroku CLI and login
heroku create your-app-name
heroku config:set NODE_ENV=production
git push heroku main
```

**Option 2: Render**
1. Connect GitHub repository
2. Set build command: `npm install && npm run build`
3. Set start command: `npm start`
4. Add environment variables

**Option 3: Vercel**
```bash
npm install -g vercel
vercel --prod
```

### Environment Setup
Set these environment variables in your cloud provider:
```
NODE_ENV=production
PORT=3000
DATABASE_PATH=/tmp/database.sqlite
UPSELL_ENABLED=true
SUMMER10_ENABLED=true
```

## 📝 Task Requirements Checklist

### ✅ Core Requirements
- [x] **Multi-tenant E-commerce APIs** - Complete tenant isolation
- [x] **AI-Powered Upselling** - Ollama + Mistral integration
- [x] **Stock Management** - Real-time inventory with reservations
- [x] **Pricing Calculations** - Subtotal, discount, VAT calculations
- [x] **Feature Flags** - UPSELL_ENABLED, SUMMER10 promo
- [x] **Docker Deployment** - Complete containerization
- [x] **Comprehensive Testing** - Unit & integration tests
- [x] **API Documentation** - Swagger/OpenAPI docs

### ✅ Technical Stack
- [x] **Node.js + TypeScript** - Modern backend development
- [x] **Express.js** - RESTful API framework
- [x] **SQLite** - Lightweight database with full SQL features
- [x] **Jest** - Comprehensive testing framework
- [x] **Ollama + Mistral** - Local AI for upselling

### ✅ Additional Features
- [x] **Clean Architecture** - Separation of concerns
- [x] **Error Handling** - Comprehensive error management
- [x] **Logging** - Structured logging with Winston
- [x] **Validation** - Input validation with Joi
- [x] **Security** - CORS, helmet, rate limiting
- [x] **Performance** - Database indexing, optimized queries
- [x] **Monitoring** - Health checks and status endpoints

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Ensure all tests pass
5. Submit a pull request

### Code Standards
- Follow TypeScript best practices
- Maintain test coverage above 80%
- Use conventional commit messages
- Add JSDoc comments for public APIs

## 📄 License

This project is part of NEXT BASKET's technical assessment and is intended for evaluation purposes.

## 🆘 Support

### Common Issues

**AI Service Not Working**
- Ensure Docker has sufficient memory (4GB+)
- Check Ollama logs: `docker logs ecommerce-ollama`
- Verify model download completed

**Database Issues**
- Check file permissions for SQLite database
- Ensure data directory exists
- Review database logs in application output

**Performance Issues**
- Monitor memory usage with Docker stats
- Check database query performance
- Review AI response times

### Getting Help
- Check application logs: `docker logs ecommerce-api`
- Review API documentation at `/api-docs`
- Test individual endpoints with curl or Postman
- Verify tenant headers in all requests

---

**Built with ❤️ for NEXT BASKET Technical Assessment**

*Demonstrating modern full-stack development with AI integration, clean architecture, and production-ready deployment.*
