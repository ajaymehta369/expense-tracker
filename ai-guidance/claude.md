# AI Agent Guidance - ExpenseFlow Project

## Project Overview

ExpenseFlow is a personal expense tracking application built with:
- **Backend**: Python Flask REST API
- **Frontend**: React with Tailwind CSS
- **Database**: MySQL

## Architecture Principles

### Backend Design
1. **Application Factory Pattern**: Use Flask's app factory for better testing and configuration
2. **Blueprint Organization**: Separate routes by resource (auth, expenses, categories, budgets)
3. **ORM for Data Access**: SQLAlchemy with models for type safety and migrations
4. **JWT Authentication**: Stateless auth with access + refresh tokens

### Frontend Design
1. **Component-Based**: Small, reusable components
2. **Context for State**: AuthContext for user state, avoid prop drilling
3. **Service Layer**: API calls isolated in services/api.js
4. **Responsive First**: Mobile-first design with Tailwind

## Code Style Guidelines

### Python (Backend)
```python
# Use type hints where practical
def get_expense(expense_id: int) -> dict:
    pass

# Use descriptive function names
def calculate_monthly_spending(user_id: int, month: int, year: int) -> float:
    pass

# Error handling with specific exceptions
try:
    expense = Expense.query.get_or_404(expense_id)
except NotFound:
    return {'error': 'Expense not found'}, 404
```

### JavaScript (Frontend)
```javascript
// Use functional components with hooks
const ExpenseCard = ({ expense, onEdit, onDelete }) => {
  // Component logic
};

// Destructure props
const { user, loading } = useAuth();

// Handle async operations with try/catch
const fetchData = async () => {
  try {
    const response = await api.get('/expenses');
    setExpenses(response.data);
  } catch (error) {
    toast.error('Failed to load expenses');
  }
};
```

## API Design Conventions

### Endpoints
- `GET /api/resources` - List (with pagination)
- `GET /api/resources/:id` - Get single
- `POST /api/resources` - Create
- `PUT /api/resources/:id` - Update
- `DELETE /api/resources/:id` - Delete

### Response Format
```json
{
  "data": { },
  "message": "Success message",
  "error": "Error message (if applicable)"
}
```

### Error Responses
```json
{
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "details": { }
}
```

## Database Schema Guidelines

1. Use singular table names (user, expense, category)
2. Include created_at/updated_at timestamps
3. Use foreign keys with proper indexes
4. Soft delete where appropriate (is_deleted flag)

## Security Requirements

1. Never store plain text passwords
2. Validate all user inputs server-side
3. Use parameterized queries (SQLAlchemy handles this)
4. Set appropriate CORS origins
5. Use HTTPS in production
6. Rate limit authentication endpoints

## Testing Strategy

1. Unit tests for business logic
2. Integration tests for API endpoints
3. Component tests for React components
4. E2E tests for critical user flows

## Performance Considerations

1. Paginate list endpoints
2. Use database indexes for frequent queries
3. Implement caching for dashboard data
4. Lazy load components in React
5. Optimize bundle size

## Common Tasks

### Adding a New API Endpoint
1. Define route in appropriate blueprint
2. Add input validation
3. Implement business logic
4. Return consistent response format
5. Add error handling

### Adding a New React Page
1. Create page component in /pages
2. Add route in App.js
3. Create any needed sub-components
4. Connect to API via service
5. Handle loading/error states

### Adding a New Database Model
1. Create model class in /models
2. Add to __init__.py exports
3. Create and run migration
4. Add to shell context in run.py
