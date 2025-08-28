# 🏠 AI Real Estate Broker

A full-stack AI-powered real estate application built with FastAPI (Python) backend and React (TypeScript) frontend.

## 🚀 Quick Start

### Automated Setup
```bash
./start_project.sh
```

This will start both backend and frontend servers automatically.

## 📋 Manual Setup

### Prerequisites
- Python 3.13+
- Node.js 18+
- npm

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd AI-Broker-backend/AI-Broker
   ```

2. **Create and activate virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys
   ```

5. **Create database and migrate data:**
   ```bash
   python database.py
   python migrate_data.py
   ```

6. **Start backend server:**
   ```bash
   python main.py
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd AI-broker-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## 🌐 Access Points

- **Frontend Application:** http://localhost:8080 (or 8081)
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

## 🗄️ Database

The application uses SQLite for development with the following tables:
- `properties` - Real estate property listings
- `users` - User information
- `tours` - Scheduled property tours
- `inquiries` - User inquiries and messages
- `chat_sessions` - Chat conversation history

### Database Schema

The database contains 904+ migrated property records with:
- Property details (name, description, address, price)
- Property features (bedrooms, baths, square footage)
- Images and embeddings for AI search
- Listing status and type information

## 🔧 Configuration

### Environment Variables (.env)

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Email Configuration  
EMAIL_PASSWORD=your_app_password_here
SENDER_EMAIL=your_email@gmail.com

# Database Configuration
DATABASE_URL=sqlite:///./real_estate.db

# Server Configuration
HOST=0.0.0.0
PORT=8000

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:8080,https://yourdomain.com
```

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - SQL toolkit and ORM
- **OpenAI** - AI integration for property search and chat
- **LangChain** - AI application framework
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Frontend
- **React 18** - User interface library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **shadcn/ui** - UI component library
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Data fetching and caching
- **Axios** - HTTP client

## 📁 Project Structure

```
real-estate/
├── AI-Broker-backend/
│   └── AI-Broker/
│       ├── main.py              # FastAPI application
│       ├── database.py          # Database models and setup
│       ├── models.py            # Pydantic models
│       ├── migrate_data.py      # Data migration script
│       ├── data.json           # Property data
│       ├── requirements.txt    # Python dependencies
│       ├── .env               # Environment variables
│       └── venv/              # Virtual environment
├── AI-broker-frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Page components
│   │   ├── utils/            # Utility functions
│   │   └── lib/              # Library configurations
│   ├── package.json          # Node.js dependencies
│   └── vite.config.ts        # Vite configuration
├── start_project.sh           # Automated startup script
└── README.md
```

## 🔒 Security Features

- Environment variable configuration for sensitive data
- CORS protection with configurable origins
- Input validation with Pydantic models
- SQL injection protection with SQLAlchemy ORM

## 🚀 Deployment

For production deployment:

1. Update `ALLOWED_ORIGINS` in `.env` to include your production domain
2. Use a production-grade database (PostgreSQL recommended)
3. Set `NODE_ENV=production` for frontend
4. Use reverse proxy (nginx) for serving static files
5. Enable HTTPS with SSL certificates

## 📊 Features

- **AI-Powered Search** - Natural language property search using OpenAI
- **Property Management** - Complete CRUD operations for properties
- **Tour Scheduling** - Book property viewings with email confirmations
- **Chat Interface** - Interactive AI assistant for property inquiries
- **Responsive Design** - Mobile-friendly interface
- **Real-time Updates** - Live chat and property updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.