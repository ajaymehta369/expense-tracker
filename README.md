# ExpenseFlow - Personal Expense Tracker

A full-stack expense tracking application built with Python Flask (Backend), React (Frontend), and MySQL (Database).

## 🎯 Project Overview

ExpenseFlow helps users track their daily expenses, categorize spending, set budgets, and visualize their financial habits through an intuitive dashboard.

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Frontend │────▶│   Flask API     │────▶│     MySQL       │
│  (Port 3000)    │     │   (Port 5000)   │     │   Database      │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Tech Stack
- **Backend**: Python 3.11+ with Flask
  - Flask-SQLAlchemy (ORM)
  - Flask-JWT-Extended (Authentication)
  - Flask-CORS (Cross-Origin Resource Sharing)
  - Flask-Migrate (Database migrations)
  
- **Frontend**: React 18
  - React Router v6 (Routing)
  - Recharts (Data visualization)
  - Axios (HTTP client)
  - Tailwind CSS (Styling)

- **Database**: MySQL 8.0
  - Normalized schema design
  - Foreign key constraints
  - Indexed queries for performance

## 📁 Project Structure

```
expense-tracker/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # App factory
│   │   ├── config.py            # Configuration
│   │   ├── models/              # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── expense.py
│   │   │   ├── category.py
│   │   │   └── budget.py
│   │   ├── routes/              # API endpoints
│   │   │   ├── auth.py
│   │   │   ├── expenses.py
│   │   │   ├── categories.py
│   │   │   └── budgets.py
│   │   └── utils/               # Helper functions
│   ├── migrations/              # Database migrations
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API services
│   │   ├── context/             # React context
│   │   └── hooks/               # Custom hooks
│   ├── package.json
│   └── tailwind.config.js
├── ai-guidance/                 # AI agent guidance files
│   ├── claude.md
│   ├── coding-standards.md
│   └── constraints.md
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- MySQL 8.0+

### Database Setup

1. Create MySQL database:
```sql
CREATE DATABASE expense_tracker;
CREATE USER 'expense_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON expense_tracker.* TO 'expense_user'@'localhost';
FLUSH PRIVILEGES;
```

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt

# Set environment variables
copy .env.example .env
# Edit .env with your database credentials

# Run migrations
flask db upgrade

# Start server
python run.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔑 Key Technical Decisions

### 1. **Flask over FastAPI**
- Chose Flask for its simplicity and mature ecosystem
- Flask-SQLAlchemy provides excellent ORM integration
- Flask-JWT-Extended offers robust authentication
- Large community support and extensive documentation

### 2. **MySQL over SQLite**
- Production-ready database with ACID compliance
- Better concurrency support for multiple users
- Advanced features like JSON columns and window functions
- Industry standard for financial applications

### 3. **JWT Authentication**
- Stateless authentication suitable for REST APIs
- Token refresh mechanism for better security
- Easy to scale across multiple servers
- No server-side session storage needed

### 4. **Component-Based Architecture (React)**
- Reusable UI components reduce code duplication
- Context API for lightweight state management
- Custom hooks for shared logic
- Lazy loading for performance optimization

### 5. **Tailwind CSS**
- Utility-first approach speeds up development
- Consistent design system
- Small bundle size with PurgeCSS
- No CSS file management overhead

### 6. **RESTful API Design**
- Clear resource-based endpoints
- Standard HTTP methods (GET, POST, PUT, DELETE)
- Consistent response format with proper status codes
- Pagination for list endpoints

## 📊 Database Schema

### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐
│    users     │       │  categories  │
├──────────────┤       ├──────────────┤
│ id (PK)      │──┐    │ id (PK)      │
│ email        │  │    │ name         │
│ password_hash│  │    │ icon         │
│ name         │  │    │ color        │
│ created_at   │  │    │ user_id (FK) │──┐
└──────────────┘  │    │ is_default   │  │
                  │    └──────────────┘  │
                  │                      │
                  │    ┌──────────────┐  │
                  │    │   expenses   │  │
                  │    ├──────────────┤  │
                  └───▶│ id (PK)      │  │
                       │ amount       │  │
                  ┌───▶│ description  │  │
                  │    │ date         │  │
                  │    │ user_id (FK) │◀─┤
                  │    │ category_id  │──┘
                  │    │ created_at   │
                  │    └──────────────┘
                  │
                  │    ┌──────────────┐
                  │    │   budgets    │
                  │    ├──────────────┤
                  │    │ id (PK)      │
                  │    │ amount       │
                  │    │ month        │
                  │    │ year         │
                  └────│ category_id  │
                       │ user_id (FK) │
                       └──────────────┘
```

## 🔒 Security Considerations

1. **Password Hashing**: Using bcrypt with salt
2. **JWT Tokens**: Short-lived access tokens (15 min) with refresh tokens
3. **Input Validation**: Server-side validation for all inputs
4. **SQL Injection Prevention**: Parameterized queries via SQLAlchemy
5. **CORS Configuration**: Restricted to frontend origin
6. **Environment Variables**: Sensitive data stored in .env files

## 🎨 Features

### Core Features
- ✅ User registration and authentication
- ✅ Add, edit, delete expenses
- ✅ Categorize expenses with custom categories
- ✅ Set monthly budgets per category
- ✅ Dashboard with spending overview
- ✅ Filter expenses by date range and category
- ✅ Visual charts (pie chart, bar chart)

### Future Extensions
- 📱 Mobile responsive design
- 📤 Export to CSV/PDF
- 🔔 Budget alerts and notifications
- 📈 Trend analysis and predictions
- 💱 Multi-currency support
- 🏷️ Tags for better organization

## 🤖 AI Usage

This project was developed with assistance from GitHub Copilot/Claude AI for:
- Boilerplate code generation
- Database schema design suggestions
- API endpoint structure
- React component patterns
- Error handling patterns

See the `ai-guidance/` folder for the prompts and constraints used.

## ⚠️ Known Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| JWT token theft | High | Short expiry, HTTP-only cookies option |
| Database injection | High | ORM parameterized queries |
| XSS attacks | Medium | React's built-in escaping |
| Rate limiting absent | Medium | Add rate limiting in production |
| No data backup | High | Implement automated backups |

## 📝 License

This project was created for assessment purposes.

---

**Author**: [AJAY MEHTA]  
**Email**: [riyanmehta428@gmail.com]  
**Date**: March 2026
