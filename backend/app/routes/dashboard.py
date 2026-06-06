# Dashboard Routes

from datetime import date, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, extract
from app import db
from app.models import Expense, Category, Budget

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('', methods=['GET'])
@jwt_required()
def get_dashboard():
    """Get dashboard overview data."""
    current_user_id = int(get_jwt_identity())
    
    # Get period (default to current month)
    month = request.args.get('month', date.today().month, type=int)
    year = request.args.get('year', date.today().year, type=int)
    
    # Calculate totals
    total_spent = db.session.query(
        func.coalesce(func.sum(Expense.amount), 0)
    ).filter(
        Expense.user_id == current_user_id,
        extract('month', Expense.date) == month,
        extract('year', Expense.date) == year
    ).scalar()
    
    total_budget = db.session.query(
        func.coalesce(func.sum(Budget.amount), 0)
    ).filter(
        Budget.user_id == current_user_id,
        Budget.month == month,
        Budget.year == year
    ).scalar()
    
    # Get expense count
    expense_count = Expense.query.filter(
        Expense.user_id == current_user_id,
        extract('month', Expense.date) == month,
        extract('year', Expense.date) == year
    ).count()
    
    # Get spending by category
    category_spending = db.session.query(
        Category.id,
        Category.name,
        Category.icon,
        Category.color,
        func.coalesce(func.sum(Expense.amount), 0).label('total')
    ).outerjoin(
        Expense,
        (Expense.category_id == Category.id) & 
        (extract('month', Expense.date) == month) &
        (extract('year', Expense.date) == year)
    ).filter(
        Category.user_id == current_user_id
    ).group_by(
        Category.id
    ).order_by(
        func.sum(Expense.amount).desc()
    ).all()
    
    # Get daily spending for the month
    daily_spending = db.session.query(
        Expense.date,
        func.sum(Expense.amount).label('total')
    ).filter(
        Expense.user_id == current_user_id,
        extract('month', Expense.date) == month,
        extract('year', Expense.date) == year
    ).group_by(
        Expense.date
    ).order_by(
        Expense.date
    ).all()
    
    # Get recent expenses (last 5)
    recent_expenses = Expense.query.filter(
        Expense.user_id == current_user_id
    ).order_by(
        Expense.date.desc(),
        Expense.created_at.desc()
    ).limit(5).all()
    
    # Get budget status
    budget_status = []
    for cat in category_spending:
        budget = Budget.query.filter_by(
            user_id=current_user_id,
            category_id=cat.id,
            month=month,
            year=year
        ).first()
        
        if budget:
            spent = float(cat.total)
            budget_amount = float(budget.amount)
            budget_status.append({
                'category_id': cat.id,
                'category_name': cat.name,
                'icon': cat.icon,
                'color': cat.color,
                'budget': budget_amount,
                'spent': spent,
                'remaining': budget_amount - spent,
                'percentage_used': round((spent / budget_amount * 100), 1) if budget_amount > 0 else 0,
                'over_budget': spent > budget_amount
            })
    
    return jsonify({
        'period': {
            'month': month,
            'year': year
        },
        'summary': {
            'total_spent': float(total_spent),
            'total_budget': float(total_budget),
            'remaining_budget': float(total_budget) - float(total_spent),
            'expense_count': expense_count,
            'budget_utilization': round((float(total_spent) / float(total_budget) * 100), 1) if total_budget > 0 else 0
        },
        'spending_by_category': [
            {
                'category_id': cat.id,
                'category_name': cat.name,
                'icon': cat.icon,
                'color': cat.color,
                'total': float(cat.total),
                'percentage': round((float(cat.total) / float(total_spent) * 100), 1) if total_spent > 0 else 0
            }
            for cat in category_spending if float(cat.total) > 0
        ],
        'daily_spending': [
            {
                'date': day.date.isoformat(),
                'total': float(day.total)
            }
            for day in daily_spending
        ],
        'budget_status': budget_status,
        'recent_expenses': [expense.to_dict() for expense in recent_expenses]
    }), 200


@dashboard_bp.route('/trends', methods=['GET'])
@jwt_required()
def get_trends():
    """Get spending trends over multiple months."""
    current_user_id = int(get_jwt_identity())
    
    # Get number of months to look back (default 6)
    months_back = request.args.get('months', 6, type=int)
    months_back = min(months_back, 12)  # Max 12 months
    
    today = date.today()
    
    trends = []
    for i in range(months_back - 1, -1, -1):
        # Calculate the month/year
        target_date = today - timedelta(days=i * 30)  # Approximate
        month = target_date.month
        year = target_date.year
        
        # Adjust for proper month calculation
        month_offset = (today.month - i - 1) % 12 + 1
        year_offset = today.year - ((i + 12 - today.month) // 12)
        
        if i < today.month:
            month = today.month - i
            year = today.year
        else:
            month = 12 - (i - today.month)
            year = today.year - 1
        
        # Get total spent for this month
        total_spent = db.session.query(
            func.coalesce(func.sum(Expense.amount), 0)
        ).filter(
            Expense.user_id == current_user_id,
            extract('month', Expense.date) == month,
            extract('year', Expense.date) == year
        ).scalar()
        
        # Get total budget for this month
        total_budget = db.session.query(
            func.coalesce(func.sum(Budget.amount), 0)
        ).filter(
            Budget.user_id == current_user_id,
            Budget.month == month,
            Budget.year == year
        ).scalar()
        
        trends.append({
            'month': month,
            'year': year,
            'month_name': date(year, month, 1).strftime('%b'),
            'total_spent': float(total_spent),
            'total_budget': float(total_budget)
        })
    
    return jsonify({
        'trends': trends
    }), 200


@dashboard_bp.route('/insights', methods=['GET'])
@jwt_required()
def get_insights():
    """Get spending insights and recommendations."""
    current_user_id = int(get_jwt_identity())
    
    month = request.args.get('month', date.today().month, type=int)
    year = request.args.get('year', date.today().year, type=int)
    
    insights = []
    
    # Calculate previous month for comparison
    prev_month = month - 1 if month > 1 else 12
    prev_year = year if month > 1 else year - 1
    
    # Current month total
    current_total = db.session.query(
        func.coalesce(func.sum(Expense.amount), 0)
    ).filter(
        Expense.user_id == current_user_id,
        extract('month', Expense.date) == month,
        extract('year', Expense.date) == year
    ).scalar()
    
    # Previous month total
    prev_total = db.session.query(
        func.coalesce(func.sum(Expense.amount), 0)
    ).filter(
        Expense.user_id == current_user_id,
        extract('month', Expense.date) == prev_month,
        extract('year', Expense.date) == prev_year
    ).scalar()
    
    # Compare with previous month
    if prev_total > 0:
        change_percent = ((float(current_total) - float(prev_total)) / float(prev_total)) * 100
        if change_percent > 10:
            insights.append({
                'type': 'warning',
                'title': 'Spending Increase',
                'message': f'Your spending increased by {abs(change_percent):.1f}% compared to last month.'
            })
        elif change_percent < -10:
            insights.append({
                'type': 'success',
                'title': 'Great Savings',
                'message': f'Your spending decreased by {abs(change_percent):.1f}% compared to last month!'
            })
    
    # Check for over-budget categories
    over_budget_categories = db.session.query(
        Category.name,
        Budget.amount.label('budget'),
        func.sum(Expense.amount).label('spent')
    ).join(
        Budget, 
        (Budget.category_id == Category.id) & 
        (Budget.month == month) & 
        (Budget.year == year)
    ).join(
        Expense,
        (Expense.category_id == Category.id) &
        (extract('month', Expense.date) == month) &
        (extract('year', Expense.date) == year)
    ).filter(
        Category.user_id == current_user_id
    ).group_by(
        Category.id, Budget.amount
    ).having(
        func.sum(Expense.amount) > Budget.amount
    ).all()
    
    for cat in over_budget_categories:
        overspend = float(cat.spent) - float(cat.budget)
        insights.append({
            'type': 'danger',
            'title': f'{cat.name} Over Budget',
            'message': f'You\'ve exceeded your {cat.name} budget by ${overspend:.2f}.'
        })
    
    # Get highest spending category
    top_category = db.session.query(
        Category.name,
        func.sum(Expense.amount).label('total')
    ).join(
        Expense,
        (Expense.category_id == Category.id) &
        (extract('month', Expense.date) == month) &
        (extract('year', Expense.date) == year)
    ).filter(
        Category.user_id == current_user_id
    ).group_by(
        Category.id
    ).order_by(
        func.sum(Expense.amount).desc()
    ).first()
    
    if top_category and float(current_total) > 0:
        percentage = (float(top_category.total) / float(current_total)) * 100
        if percentage > 40:
            insights.append({
                'type': 'info',
                'title': 'Top Spending Category',
                'message': f'{top_category.name} accounts for {percentage:.1f}% of your spending this month.'
            })
    
    return jsonify({
        'insights': insights,
        'period': {
            'month': month,
            'year': year
        }
    }), 200
