# Quick Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:
- Python 3.11+
- Node.js 18+
- MySQL 8.0+

## Step 1: Database Setup

```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create database and user
CREATE DATABASE expense_tracker;
CREATE USER 'expense_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON expense_tracker.* TO 'expense_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Step 2: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Update .env file with your database credentials
# Edit backend/.env

# Initialize database tables
flask db init
flask db migrate -m "Initial migration"
flask db upgrade

# (Optional) Seed demo data
flask seed-demo

# Start the server
python run.py
```

The backend API will be running at `http://localhost:5000`

## Step 3: Frontend Setup

```bash
# Open a new terminal
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will be running at `http://localhost:3000`

## Step 4: Test the Application

1. Open `http://localhost:3000` in your browser
2. Register a new account or use demo credentials:
   - Email: `demo@example.com`
   - Password: `demo123`
3. Start tracking your expenses!

## Troubleshooting

### Database Connection Error
- Verify MySQL is running: `mysql --version`
- Check credentials in `backend/.env`
- Ensure the database exists: `SHOW DATABASES;`

### CORS Issues
- Verify `CORS_ORIGINS` in `.env` matches frontend URL
- Check browser console for specific errors

### Module Not Found
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt` again

## Development Commands

### Backend
```bash
# Run development server
python run.py

# Create new migration
flask db migrate -m "Description"

# Apply migrations
flask db upgrade

# Flask shell (for testing)
flask shell
```

### Frontend
```bash
# Start dev server
npm start

# Build for production
npm run build

# Run tests
npm test
```
