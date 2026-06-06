# Budget Model

from datetime import datetime
from app import db


class Budget(db.Model):
    """Budget model for tracking spending limits per category."""
    
    __tablename__ = 'budgets'
    
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    month = db.Column(db.Integer, nullable=False)  # 1-12
    year = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Unique constraint: one budget per category per month per user
    __table_args__ = (
        db.UniqueConstraint('user_id', 'category_id', 'month', 'year', name='unique_budget_per_category_month'),
        db.Index('idx_budget_user_period', 'user_id', 'year', 'month'),
    )
    
    def to_dict(self):
        """Convert budget to dictionary."""
        return {
            'id': self.id,
            'amount': float(self.amount),
            'month': self.month,
            'year': self.year,
            'category_id': self.category_id,
            'category': self.category.to_dict() if self.category else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Budget {self.category.name if self.category else "Unknown"}: ${self.amount} for {self.month}/{self.year}>'
