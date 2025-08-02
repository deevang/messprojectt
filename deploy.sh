#!/bin/bash

# 🚀 Mess Management System Deployment Script
# This script helps you deploy your application to various platforms

echo "🚀 Mess Management System Deployment Script"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Function to build the application
build_app() {
    echo "📦 Building the application..."
    
    # Install server dependencies
    echo "Installing server dependencies..."
    cd server
    npm install
    
    # Install client dependencies
    echo "Installing client dependencies..."
    cd ../client
    npm install
    
    # Build the client
    echo "Building React application..."
    npm run build
    
    cd ..
    echo "✅ Build completed successfully!"
}

# Function to test the application locally
test_locally() {
    echo "🧪 Testing application locally..."
    
    # Start server in background
    cd server
    npm start &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 5
    
    # Test health endpoint
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        echo "✅ Server is running on http://localhost:5000"
    else
        echo "❌ Server failed to start"
        kill $SERVER_PID 2>/dev/null
        exit 1
    fi
    
    # Kill server
    kill $SERVER_PID 2>/dev/null
    cd ..
}

# Function to prepare for deployment
prepare_deployment() {
    echo "🔧 Preparing for deployment..."
    
    # Create .env.example if it doesn't exist
    if [ ! -f "server/.env.example" ]; then
        echo "Creating .env.example file..."
        cat > server/.env.example << EOF
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/mess_management

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here

# Email Configuration (Optional)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# CORS Configuration
CLIENT_URL=https://your-frontend-domain.com
EOF
    fi
    
    # Check if .env file exists
    if [ ! -f "server/.env" ]; then
        echo "⚠️  Warning: server/.env file not found!"
        echo "Please create server/.env file with your environment variables"
        echo "You can copy from server/.env.example as a template"
    else
        echo "✅ Environment file found"
    fi
    
    # Check if all required files exist
    required_files=("server/package.json" "client/package.json" "server/server.js" "client/src/main.jsx")
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            echo "❌ Required file missing: $file"
            exit 1
        fi
    done
    
    echo "✅ All required files found"
}

# Function to show deployment options
show_deployment_options() {
    echo ""
    echo "🌐 Deployment Options:"
    echo "====================="
    echo "1. Render (Recommended - Free tier)"
    echo "2. Vercel + Railway"
    echo "3. Heroku"
    echo "4. DigitalOcean App Platform"
    echo "5. AWS (Advanced)"
    echo ""
    echo "📋 Next Steps:"
    echo "=============="
    echo "1. Choose a deployment platform"
    echo "2. Set up MongoDB Atlas database"
    echo "3. Configure environment variables"
    echo "4. Deploy backend first, then frontend"
    echo "5. Update frontend API URL"
    echo ""
    echo "📖 For detailed instructions, see DEPLOYMENT.md"
}

# Main script
case "${1:-help}" in
    "build")
        build_app
        ;;
    "test")
        test_locally
        ;;
    "prepare")
        prepare_deployment
        ;;
    "deploy")
        build_app
        prepare_deployment
        show_deployment_options
        ;;
    "help"|*)
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  build    - Build the application"
        echo "  test     - Test the application locally"
        echo "  prepare  - Prepare for deployment"
        echo "  deploy   - Full deployment preparation"
        echo "  help     - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 build"
        echo "  $0 deploy"
        ;;
esac 