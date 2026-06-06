# Coding Standards - ExpenseFlow

## General Principles

1. **Readability over cleverness** - Write code that's easy to understand
2. **DRY (Don't Repeat Yourself)** - Extract common patterns into reusable functions
3. **Single Responsibility** - Each function/component should do one thing well
4. **Explicit over implicit** - Be clear about what code does

## Python Standards

### Naming Conventions
- `snake_case` for functions and variables
- `PascalCase` for classes
- `UPPER_SNAKE_CASE` for constants
- Prefix private methods with `_`

### File Organization
```
app/
├── __init__.py          # App factory, extensions
├── config.py            # Configuration classes
├── models/              # Database models
├── routes/              # API blueprints
├── services/            # Business logic (if needed)
└── utils/               # Helper functions
```

### Flask Best Practices
```python
# Use blueprints for route organization
from flask import Blueprint
auth_bp = Blueprint('auth', __name__)

# Use decorators for common patterns
@auth_bp.route('/login', methods=['POST'])
def login():
    pass

# Return tuples for status codes
return {'error': 'Not found'}, 404

# Use request context properly
from flask import request, g, current_app
```

### SQLAlchemy Patterns
```python
# Define relationships clearly
class User(db.Model):
    expenses = db.relationship('Expense', backref='user', lazy='dynamic')

# Use query methods
expenses = Expense.query.filter_by(user_id=user_id).all()

# Handle transactions properly
try:
    db.session.add(expense)
    db.session.commit()
except:
    db.session.rollback()
    raise
```

## JavaScript/React Standards

### Naming Conventions
- `camelCase` for variables and functions
- `PascalCase` for components
- `UPPER_SNAKE_CASE` for constants
- Prefix hooks with `use`

### File Organization
```
src/
├── components/          # Reusable components
│   └── Layout/         # Grouped by feature
├── pages/              # Page-level components
├── services/           # API calls
├── context/            # React context
├── hooks/              # Custom hooks
└── utils/              # Helper functions
```

### React Patterns
```jsx
// Functional components only
const ExpenseCard = ({ expense }) => {
  return <div>{expense.description}</div>;
};

// Use hooks for state and effects
const [loading, setLoading] = useState(false);
useEffect(() => {
  fetchData();
}, []);

// Destructure props
const { user, isAuthenticated } = useAuth();

// Conditional rendering
{loading ? <Spinner /> : <Content />}
```

### State Management
```jsx
// Use Context for global state
const AuthContext = createContext(null);

// Local state for component-specific data
const [expenses, setExpenses] = useState([]);

// Use useCallback for memoized functions
const handleSubmit = useCallback(async () => {
  // ...
}, [dependency]);
```

## CSS/Styling Standards (Tailwind)

### Class Organization
```jsx
// Order: layout → spacing → sizing → visual → state
<div className="flex items-center p-4 w-full bg-white hover:bg-gray-50">
```

### Responsive Design
```jsx
// Mobile-first approach
<div className="text-sm md:text-base lg:text-lg">

// Use breakpoint prefixes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
```

### Custom Classes (in index.css)
```css
/* Use @apply for repeated patterns */
.btn {
  @apply px-4 py-2 rounded-lg font-medium;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700;
}
```

## Error Handling

### Backend
```python
# Catch specific exceptions
try:
    user = User.query.filter_by(email=email).first()
except SQLAlchemyError as e:
    return {'error': 'Database error'}, 500

# Validate input
if not data.get('email'):
    return {'error': 'Email is required'}, 400
```

### Frontend
```jsx
// Always handle errors in async operations
try {
  await api.post('/expenses', data);
  toast.success('Expense added');
} catch (error) {
  const message = error.response?.data?.error || 'Something went wrong';
  toast.error(message);
}
```

## Testing Standards

### Naming Tests
```python
# Python: test_<what>_<condition>_<expected>
def test_login_invalid_password_returns_401():
    pass
```

```javascript
// JavaScript: describe/it pattern
describe('ExpenseCard', () => {
  it('displays expense amount correctly', () => {
    // ...
  });
});
```

## Git Commit Messages

Format: `<type>: <subject>`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

Examples:
```
feat: add budget copy functionality
fix: correct expense total calculation
docs: update API documentation
```

## Code Review Checklist

- [ ] Code follows naming conventions
- [ ] Functions are small and focused
- [ ] Error cases are handled
- [ ] No hardcoded values (use constants/config)
- [ ] Security considerations addressed
- [ ] Tests added for new functionality
- [ ] Documentation updated if needed
