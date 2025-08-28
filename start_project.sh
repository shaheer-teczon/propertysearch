
echo "🚀 Starting Real Estate AI Broker Project..."

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

echo -e "${BLUE}Starting Backend Server...${NC}"
cd AI-Broker-backend/AI-Broker

if [ -d "venv" ]; then
    source venv/bin/activate
    if check_port 8000; then
        echo -e "${YELLOW}Backend port 8000 is already in use. Stopping existing process...${NC}"
        pkill -f "python main.py"
        sleep 2
    fi
    
    echo -e "${GREEN}Starting backend on http://localhost:8000${NC}"
    python main.py &
    BACKEND_PID=$!
    
    sleep 3
    
    if check_port 8000; then
        echo -e "${GREEN}✅ Backend server started successfully!${NC}"
        echo -e "${BLUE}📖 API Documentation: http://localhost:8000/docs${NC}"
    else
        echo -e "${RED}❌ Failed to start backend server${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Virtual environment not found. Please run setup first.${NC}"
    exit 1
fi

echo -e "${BLUE}Starting Frontend Server...${NC}"
cd ../../AI-broker-frontend

if [ -d "node_modules" ]; then
    if check_port 8080; then
        echo -e "${YELLOW}Frontend port 8080 is already in use. Using next available port...${NC}"
    fi
    
    echo -e "${GREEN}Starting frontend...${NC}"
    npm run dev &
    FRONTEND_PID=$!
    
    sleep 5
    
    if check_port 8080; then
        echo -e "${GREEN}✅ Frontend server started on http://localhost:8080${NC}"
    elif check_port 8081; then
        echo -e "${GREEN}✅ Frontend server started on http://localhost:8081${NC}"
    else
        echo -e "${RED}❌ Failed to start frontend server${NC}"
    fi
else
    echo -e "${RED}❌ Node modules not found. Please run 'npm install' first.${NC}"
    exit 1
fi

echo -e "${GREEN}"
echo "🎉 Project started successfully!"
echo ""
echo "📊 Backend API: http://localhost:8000"
echo "📖 API Docs: http://localhost:8000/docs"
echo "🌐 Frontend: http://localhost:8080 (or 8081 if 8080 is busy)"
echo ""
echo "Press Ctrl+C to stop all servers"
echo -e "${NC}"

trap 'echo -e "\n${YELLOW}Stopping servers...${NC}"; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT

wait