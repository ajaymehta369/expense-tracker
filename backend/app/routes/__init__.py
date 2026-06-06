from .auth import auth_bp
from .expenses import expenses_bp
from .categories import categories_bp
from .budgets import budgets_bp
from .dashboard import dashboard_bp

__all__ = ['auth_bp', 'expenses_bp', 'categories_bp', 'budgets_bp', 'dashboard_bp']
