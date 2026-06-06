# Video Walkthrough Guide (10-15 minutes)

## Introduction (1-2 min)
- Introduce yourself
- Brief overview of the application: "ExpenseFlow - Personal Expense Tracker"
- Tech stack: Python Flask, React, MySQL

---

## 1. Architecture Overview (2-3 min)

### System Architecture
```
Frontend (React) → Backend API (Flask) → Database (MySQL)
     ↓                    ↓                   ↓
   Port 3000           Port 5000         MySQL Server
```

### Key Architectural Decisions

1. **Monolithic but Modular**
   - Single Flask app with Blueprint organization
   - Easy to deploy, maintain, and understand
   - Can be split into microservices later if needed

2. **REST API Design**
   - Resource-based endpoints
   - Standard HTTP methods
   - Consistent response format

3. **JWT Authentication**
   - Stateless authentication
   - Access + Refresh token pattern
   - Easy to scale

---

## 2. Project Structure (2-3 min)

### Backend (Flask)
```
backend/
├── app/
│   ├── __init__.py      # Application factory
│   ├── config.py        # Configuration
│   ├── models/          # SQLAlchemy models
│   ├── routes/          # API blueprints
│   └── utils/           # Helper functions
├── run.py               # Entry point
└── requirements.txt     # Dependencies
```

**Key Files to Show:**
- `app/__init__.py` - Factory pattern, extension initialization
- `models/expense.py` - Model with relationships
- `routes/expenses.py` - CRUD operations, filtering, pagination

### Frontend (React)
```
frontend/src/
├── components/          # Reusable components
├── pages/              # Page components
├── services/           # API layer
├── context/            # State management
└── App.js              # Routing
```

**Key Files to Show:**
- `App.js` - Route protection pattern
- `context/AuthContext.js` - Authentication state
- `services/api.js` - Axios interceptors for token refresh

---

## 3. Technical Decisions (2-3 min)

### Database Design
- Normalized schema with foreign keys
- Indexes on frequently queried columns
- Unique constraints for data integrity

### State Management
- React Context for auth state (lightweight, sufficient for this app)
- Local state for component data
- No Redux needed for this scope

### Styling Approach
- Tailwind CSS for rapid development
- Utility-first approach
- Consistent design system

### Error Handling
- Server-side validation on all inputs
- Client-side feedback with toast notifications
- Token refresh mechanism for seamless UX

---

## 4. AI Usage (1-2 min)

### How AI Assisted Development

1. **Code Generation**
   - Boilerplate code (models, routes, components)
   - Repetitive patterns (CRUD operations)
   - Configuration files

2. **Architecture Guidance**
   - Database schema design
   - API endpoint structure
   - Component organization

3. **Documentation**
   - README and setup guides
   - Code comments
   - AI guidance files

### AI Guidance Files
- `ai-guidance/claude.md` - Project overview and patterns
- `ai-guidance/coding-standards.md` - Style guidelines
- `ai-guidance/constraints.md` - Technical constraints

---

## 5. Demo (2-3 min)

### Features to Demonstrate

1. **Authentication**
   - Register new account
   - Login/logout
   - Token persistence

2. **Expense Management**
   - Add new expense
   - Edit existing expense
   - Filter by date/category

3. **Dashboard**
   - Spending overview
   - Charts (pie chart, bar chart)
   - Budget status

4. **Budgets**
   - Set monthly budgets
   - Track progress
   - Over-budget warnings

---

## 6. Risks & Mitigations (1 min)

| Risk | Impact | Mitigation |
|------|--------|------------|
| JWT token theft | High | Short expiry, refresh tokens |
| SQL injection | High | ORM parameterized queries |
| Missing rate limiting | Medium | Add in production |
| No data backup | High | Implement automated backups |

---

## 7. Extension Approach (1-2 min)

### Next Steps for Production

1. **Security Enhancements**
   - Rate limiting
   - Email verification
   - Password recovery

2. **Feature Additions**
   - Recurring expenses
   - Multiple currencies
   - Export to CSV/PDF
   - Mobile app

3. **Infrastructure**
   - Docker containerization
   - CI/CD pipeline
   - Monitoring and logging

### Scalability Considerations
- Database connection pooling (already configured)
- Horizontal scaling via load balancer
- Cache layer for dashboard data

---

## Conclusion (30 sec)
- Recap key decisions
- Thank the viewer
- Offer to answer questions

---

## Tips for Recording

1. Share your screen with code editor open
2. Have the app running in the browser
3. Switch between code and browser to show relationships
4. Speak clearly and at a moderate pace
5. Aim for 10-15 minutes total
