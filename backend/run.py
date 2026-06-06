# Application entry point

import os
from app import create_app, db
from app.models import User, Category, Expense, Budget

app = create_app()

# Auto-create tables on startup (for Render deployment)
with app.app_context():
    db.create_all()


@app.shell_context_processor
def make_shell_context():
    """Add database models to flask shell context."""
    return {
        'db': db,
        'User': User,
        'Category': Category,
        'Expense': Expense,
        'Budget': Budget
    }


@app.cli.command('init-db')
def init_db():
    """Initialize the database."""
    db.create_all()
    print('Database initialized.')


@app.cli.command('seed-demo')
def seed_demo():
    """Seed database with demo data."""
    from datetime import date, timedelta
    import random
    
    # Check if demo user exists
    demo_user = User.query.filter_by(email='demo@example.com').first()
    if demo_user:
        print('Demo user already exists.')
        return
    
    # Create demo user
    demo_user = User(
        email='demo@example.com',
        password='demo123',
        name='Demo User'
    )
    db.session.add(demo_user)
    db.session.flush()
    
    # Create categories
    categories = []
    for cat_data in Category.get_default_categories():
        category = Category(
            name=cat_data['name'],
            icon=cat_data['icon'],
            color=cat_data['color'],
            is_default=True,
            user_id=demo_user.id
        )
        db.session.add(category)
        categories.append(category)
    
    db.session.flush()
    
    # Create sample expenses
    expense_templates = [
        ('Grocery shopping', 0, 50, 150),
        ('Restaurant dinner', 0, 30, 100),
        ('Coffee', 0, 5, 15),
        ('Gas', 1, 40, 80),
        ('Uber ride', 1, 15, 50),
        ('Bus pass', 1, 30, 50),
        ('New clothes', 2, 50, 200),
        ('Amazon order', 2, 20, 100),
        ('Movie tickets', 3, 15, 40),
        ('Netflix subscription', 3, 15, 20),
        ('Electricity bill', 4, 80, 150),
        ('Internet bill', 4, 50, 80),
        ('Phone bill', 4, 40, 80),
        ('Pharmacy', 5, 15, 60),
        ('Doctor visit', 5, 100, 200),
        ('Books', 6, 15, 50),
        ('Online course', 6, 50, 200),
        ('Miscellaneous', 7, 10, 50),
    ]
    
    # Generate expenses for the last 3 months
    today = date.today()
    for month_offset in range(3):
        target_month = today.month - month_offset
        target_year = today.year
        if target_month <= 0:
            target_month += 12
            target_year -= 1
        
        # Generate 15-25 expenses per month
        num_expenses = random.randint(15, 25)
        for _ in range(num_expenses):
            template = random.choice(expense_templates)
            expense_date = date(
                target_year,
                target_month,
                random.randint(1, 28)
            )
            
            expense = Expense(
                amount=round(random.uniform(template[2], template[3]), 2),
                description=template[0],
                date=expense_date,
                category_id=categories[template[1]].id,
                user_id=demo_user.id
            )
            db.session.add(expense)
    
    # Create budgets for current month
    budget_amounts = [500, 300, 200, 150, 300, 100, 100, 100]
    for i, category in enumerate(categories):
        budget = Budget(
            amount=budget_amounts[i],
            month=today.month,
            year=today.year,
            category_id=category.id,
            user_id=demo_user.id
        )
        db.session.add(budget)
    
    db.session.commit()
    print('Demo data seeded successfully.')
    print('Demo credentials: demo@example.com / demo123')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
