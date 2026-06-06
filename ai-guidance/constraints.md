# Constraints & Best Practices - ExpenseFlow

## Project Constraints

### Technical Constraints
1. **Database**: MySQL 8.0+ required
2. **Python**: Version 3.11+ for backend
3. **Node.js**: Version 18+ for frontend
4. **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

### Design Constraints
1. **Single User Focus**: MVP designed for personal use (no multi-tenancy requirements)
2. **Currency**: Currently USD only (single currency)
3. **Language**: English only (no i18n)
4. **Timezone**: Uses server timezone (no per-user timezone)

### Security Constraints
1. **Authentication Required**: All API endpoints except /auth/* require authentication
2. **Password Requirements**: Minimum 6 characters
3. **Token Expiry**: 
   - Access token: 15 minutes
   - Refresh token: 30 days

## API Constraints

### Rate Limits (Recommended for Production)
- Authentication endpoints: 5 requests/minute
- Other endpoints: 100 requests/minute per user

### Pagination
- Default page size: 20 items
- Maximum page size: 100 items

### Request Limits
- Maximum request body: 1MB
- Maximum file upload: N/A (no file uploads)

## Data Constraints

### Field Limits
| Field | Type | Max Length | Constraints |
|-------|------|------------|-------------|
| email | string | 255 | Valid email format, unique |
| password | string | N/A | Min 6 characters |
| name | string | 100 | Required |
| expense.amount | decimal | 10,2 | Positive, max 99,999,999.99 |
| expense.description | string | 255 | Required |
| category.name | string | 50 | Unique per user |
| category.color | string | 7 | Hex format (#RRGGBB) |

### Date Constraints
- Expense dates: Any valid date (no future restriction in MVP)
- Budget periods: Month/Year based (no weekly/daily)

## Performance Constraints

### Expected Load (MVP)
- Users: < 100 concurrent
- Expenses per user: < 10,000
- Response time target: < 500ms for API calls

### Query Optimization
- Use indexes for:
  - user_id (all tables)
  - date (expenses)
  - month/year (budgets)
- Avoid N+1 queries by using eager loading

## Frontend Constraints

### Bundle Size Targets
- Initial JS: < 200KB gzipped
- Initial CSS: < 50KB gzipped

### Accessibility (A11y)
- Minimum: WCAG 2.1 Level A
- Keyboard navigation for core functions
- Proper ARIA labels

### Browser Storage
- Local Storage for tokens only
- No sensitive data in storage
- Clear on logout

## Deployment Constraints

### Environment Variables Required
```
# Backend
SECRET_KEY=<random-string>
DATABASE_URL=mysql+pymysql://user:pass@host/db
JWT_SECRET_KEY=<random-string>
CORS_ORIGINS=https://your-frontend-domain.com

# Frontend
REACT_APP_API_URL=https://your-api-domain.com/api
```

### Infrastructure Requirements
- HTTPS required in production
- Database backups (daily recommended)
- Log retention (30 days minimum)

## Known Limitations

### Current Limitations (MVP)
1. No email verification
2. No password recovery
3. No data export
4. No recurring expenses
5. No expense attachments/receipts
6. No shared expenses/households
7. No mobile app

### Future Considerations
1. Multi-currency support
2. Bank import integrations
3. Mobile applications
4. Expense predictions/insights
5. Shared accounts for families

## Do's and Don'ts

### Do's ✅
- Validate all inputs server-side
- Use parameterized queries
- Log errors with context
- Handle edge cases gracefully
- Keep components small and focused
- Write meaningful error messages
- Use semantic HTML

### Don'ts ❌
- Don't trust client-side validation alone
- Don't store sensitive data in localStorage
- Don't log passwords or tokens
- Don't use inline styles (use Tailwind)
- Don't make API calls in render functions
- Don't ignore loading/error states
- Don't hardcode API URLs

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `invalid_credentials` | 401 | Email/password incorrect |
| `token_expired` | 401 | JWT token has expired |
| `token_invalid` | 401 | JWT token is malformed |
| `not_found` | 404 | Resource doesn't exist |
| `validation_error` | 400 | Input validation failed |
| `duplicate_entry` | 409 | Resource already exists |
| `server_error` | 500 | Unexpected server error |

## Monitoring Recommendations

### Metrics to Track
1. API response times
2. Error rates by endpoint
3. Authentication failures
4. Database query times

### Alerts to Set Up
1. Error rate > 5%
2. Response time > 2s
3. Database connection failures
4. Disk space < 20%
