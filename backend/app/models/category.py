# Category Model

from datetime import datetime
from app import db


class Category(db.Model):
    """Category model for expense categorization."""
    
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    icon = db.Column(db.String(50), default='💰')  # Emoji or icon name
    color = db.Column(db.String(7), default='#6366f1')  # Hex color
    is_default = db.Column(db.Boolean, default=False)  # System default categories
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    expenses = db.relationship('Expense', backref='category', lazy='dynamic')
    budgets = db.relationship('Budget', backref='category', lazy='dynamic')
    
    # Unique constraint: category name per user
    __table_args__ = (
        db.UniqueConstraint('name', 'user_id', name='unique_category_per_user'),
    )
    
    def to_dict(self):
        """Convert category to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'icon': self.icon,
            'color': self.color,
            'is_default': self.is_default,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @staticmethod
    def get_default_categories():
        """Return default category configurations."""
        return [
            {'name': 'Food & Dining', 'icon': '🍔', 'color': '#ef4444'},
            {'name': 'Transportation', 'icon': '🚗', 'color': '#f97316'},
            {'name': 'Shopping', 'icon': '🛍️', 'color': '#eab308'},
            {'name': 'Entertainment', 'icon': '🎬', 'color': '#22c55e'},
            {'name': 'Bills & Utilities', 'icon': '💡', 'color': '#06b6d4'},
            {'name': 'Healthcare', 'icon': '🏥', 'color': '#3b82f6'},
            {'name': 'Education', 'icon': '📚', 'color': '#8b5cf6'},
            {'name': 'Other', 'icon': '📦', 'color': '#6b7280'},
        ]
    
    def __repr__(self):
        return f'<Category {self.name}>'
