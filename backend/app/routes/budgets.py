# Budget Routes

from datetime import date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, extract
from app import db
from app.models import Budget, Category, Expense

budgets_bp = Blueprint('budgets', __name__)


@budgets_bp.route('', methods=['GET'])
@jwt_required()
def get_budgets():
    """Get all budgets for the current user for a given period."""
    current_user_id = int(get_jwt_identity())
    
    # Get period (default to current month)
    month = request.args.get('month', date.today().month, type=int)
    year = request.args.get('year', date.today().year, type=int)
    
    budgets = Budget.query.filter_by(
        user_id=current_user_id,
        month=month,
        year=year
    ).all()
    
    # Get spending for each budget's category
    result = []
    for budget in budgets:
        spent = db.session.query(
            func.coalesce(func.sum(Expense.amount), 0)
        ).filter(
            Expense.category_id == budget.category_id,
            Expense.user_id == current_user_id,
            extract('month', Expense.date) == month,
            extract('year', Expense.date) == year
        ).scalar()
        
        budget_dict = budget.to_dict()
        budget_dict['spent'] = float(spent)
        budget_dict['remaining'] = float(budget.amount) - float(spent)
        budget_dict['percentage_used'] = round((float(spent) / float(budget.amount) * 100), 1) if budget.amount > 0 else 0
        result.append(budget_dict)
    
    return jsonify({
        'budgets': result,
        'month': month,
        'year': year
    }), 200


@budgets_bp.route('/<int:budget_id>', methods=['GET'])
@jwt_required()
def get_budget(budget_id):
    """Get a specific budget with spending details."""
    current_user_id = int(get_jwt_identity())
    budget = Budget.query.filter_by(id=budget_id, user_id=current_user_id).first()
    
    if not budget:
        return jsonify({'error': 'Budget not found'}), 404
    
    # Get spending for this budget's category
    spent = db.session.query(
        func.coalesce(func.sum(Expense.amount), 0)
    ).filter(
        Expense.category_id == budget.category_id,
        Expense.user_id == current_user_id,
        extract('month', Expense.date) == budget.month,
        extract('year', Expense.date) == budget.year
    ).scalar()
    
    budget_dict = budget.to_dict()
    budget_dict['spent'] = float(spent)
    budget_dict['remaining'] = float(budget.amount) - float(spent)
    budget_dict['percentage_used'] = round((float(spent) / float(budget.amount) * 100), 1) if budget.amount > 0 else 0
    
    return jsonify(budget_dict), 200


@budgets_bp.route('', methods=['POST'])
@jwt_required()
def create_budget():
    """Create a new budget."""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    # Validate required fields
    if not data.get('amount'):
        return jsonify({'error': 'Amount is required'}), 400
    if not data.get('category_id'):
        return jsonify({'error': 'Category is required'}), 400
    
    # Validate amount
    try:
        amount = float(data['amount'])
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid amount'}), 400
    
    # Get period (default to current month)
    month = data.get('month', date.today().month)
    year = data.get('year', date.today().year)
    
    # Validate month
    if not (1 <= month <= 12):
        return jsonify({'error': 'Invalid month'}), 400
    
    # Validate category belongs to user
    category = Category.query.filter_by(
        id=data['category_id'], 
        user_id=current_user_id
    ).first()
    if not category:
        return jsonify({'error': 'Invalid category'}), 400
    
    # Check for existing budget
    existing = Budget.query.filter_by(
        user_id=current_user_id,
        category_id=data['category_id'],
        month=month,
        year=year
    ).first()
    if existing:
        return jsonify({'error': 'Budget already exists for this category and period'}), 409
    
    try:
        budget = Budget(
            amount=amount,
            month=month,
            year=year,
            category_id=data['category_id'],
            user_id=current_user_id
        )
        db.session.add(budget)
        db.session.commit()
        
        return jsonify({
            'message': 'Budget created successfully',
            'budget': budget.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create budget', 'details': str(e)}), 500


@budgets_bp.route('/<int:budget_id>', methods=['PUT'])
@jwt_required()
def update_budget(budget_id):
    """Update an existing budget."""
    current_user_id = int(get_jwt_identity())
    budget = Budget.query.filter_by(id=budget_id, user_id=current_user_id).first()
    
    if not budget:
        return jsonify({'error': 'Budget not found'}), 404
    
    data = request.get_json()
    
    # Update amount
    if data.get('amount') is not None:
        try:
            amount = float(data['amount'])
            if amount <= 0:
                return jsonify({'error': 'Amount must be positive'}), 400
            budget.amount = amount
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid amount'}), 400
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Budget updated successfully',
            'budget': budget.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update budget', 'details': str(e)}), 500


@budgets_bp.route('/<int:budget_id>', methods=['DELETE'])
@jwt_required()
def delete_budget(budget_id):
    """Delete a budget."""
    current_user_id = int(get_jwt_identity())
    budget = Budget.query.filter_by(id=budget_id, user_id=current_user_id).first()
    
    if not budget:
        return jsonify({'error': 'Budget not found'}), 404
    
    try:
        db.session.delete(budget)
        db.session.commit()
        return jsonify({'message': 'Budget deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete budget', 'details': str(e)}), 500


@budgets_bp.route('/copy', methods=['POST'])
@jwt_required()
def copy_budgets():
    """Copy budgets from one month to another."""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    # Source period
    from_month = data.get('from_month')
    from_year = data.get('from_year')
    
    # Target period
    to_month = data.get('to_month', date.today().month)
    to_year = data.get('to_year', date.today().year)
    
    if not from_month or not from_year:
        return jsonify({'error': 'Source month and year are required'}), 400
    
    # Get source budgets
    source_budgets = Budget.query.filter_by(
        user_id=current_user_id,
        month=from_month,
        year=from_year
    ).all()
    
    if not source_budgets:
        return jsonify({'error': 'No budgets found in source period'}), 404
    
    copied = 0
    skipped = 0
    
    for budget in source_budgets:
        # Check if budget already exists in target period
        existing = Budget.query.filter_by(
            user_id=current_user_id,
            category_id=budget.category_id,
            month=to_month,
            year=to_year
        ).first()
        
        if existing:
            skipped += 1
            continue
        
        new_budget = Budget(
            amount=budget.amount,
            month=to_month,
            year=to_year,
            category_id=budget.category_id,
            user_id=current_user_id
        )
        db.session.add(new_budget)
        copied += 1
    
    try:
        db.session.commit()
        return jsonify({
            'message': f'Copied {copied} budgets, skipped {skipped} (already exist)',
            'copied': copied,
            'skipped': skipped
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to copy budgets', 'details': str(e)}), 500
