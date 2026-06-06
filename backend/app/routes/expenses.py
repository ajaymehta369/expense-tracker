# Expense Routes

from datetime import datetime, date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, extract
from app import db
from app.models import Expense, Category

expenses_bp = Blueprint('expenses', __name__)


@expenses_bp.route('', methods=['GET'])
@jwt_required()
def get_expenses():
    """Get all expenses for the current user with optional filters."""
    current_user_id = int(get_jwt_identity())
    
    # Base query
    query = Expense.query.filter_by(user_id=current_user_id)
    
    # Apply filters
    category_id = request.args.get('category_id', type=int)
    if category_id:
        query = query.filter_by(category_id=category_id)
    
    start_date = request.args.get('start_date')
    if start_date:
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(Expense.date >= start)
        except ValueError:
            pass
    
    end_date = request.args.get('end_date')
    if end_date:
        try:
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(Expense.date <= end)
        except ValueError:
            pass
    
    # Apply month/year filter (convenience filter)
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)
    if month and year:
        query = query.filter(
            extract('month', Expense.date) == month,
            extract('year', Expense.date) == year
        )
    elif year:
        query = query.filter(extract('year', Expense.date) == year)
    
    # Sorting
    sort_by = request.args.get('sort_by', 'date')
    sort_order = request.args.get('sort_order', 'desc')
    
    if sort_by == 'amount':
        order_col = Expense.amount
    elif sort_by == 'created_at':
        order_col = Expense.created_at
    else:
        order_col = Expense.date
    
    if sort_order == 'asc':
        query = query.order_by(order_col.asc())
    else:
        query = query.order_by(order_col.desc())
    
    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    per_page = min(per_page, 100)  # Max 100 per page
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'expenses': [expense.to_dict() for expense in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
        'per_page': per_page,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev
    }), 200


@expenses_bp.route('/<int:expense_id>', methods=['GET'])
@jwt_required()
def get_expense(expense_id):
    """Get a specific expense."""
    current_user_id = int(get_jwt_identity())
    expense = Expense.query.filter_by(id=expense_id, user_id=current_user_id).first()
    
    if not expense:
        return jsonify({'error': 'Expense not found'}), 404
    
    return jsonify(expense.to_dict()), 200


@expenses_bp.route('', methods=['POST'])
@jwt_required()
def create_expense():
    """Create a new expense."""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    # Validate required fields
    if not data.get('amount'):
        return jsonify({'error': 'Amount is required'}), 400
    if not data.get('description'):
        return jsonify({'error': 'Description is required'}), 400
    if not data.get('category_id'):
        return jsonify({'error': 'Category is required'}), 400
    
    # Validate amount
    try:
        amount = float(data['amount'])
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid amount'}), 400
    
    # Validate category belongs to user
    category = Category.query.filter_by(
        id=data['category_id'], 
        user_id=current_user_id
    ).first()
    if not category:
        return jsonify({'error': 'Invalid category'}), 400
    
    # Parse date
    expense_date = date.today()
    if data.get('date'):
        try:
            expense_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    try:
        expense = Expense(
            amount=amount,
            description=data['description'].strip(),
            date=expense_date,
            notes=data.get('notes', '').strip() if data.get('notes') else None,
            category_id=data['category_id'],
            user_id=current_user_id
        )
        db.session.add(expense)
        db.session.commit()
        
        return jsonify({
            'message': 'Expense created successfully',
            'expense': expense.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create expense', 'details': str(e)}), 500


@expenses_bp.route('/<int:expense_id>', methods=['PUT'])
@jwt_required()
def update_expense(expense_id):
    """Update an existing expense."""
    current_user_id = int(get_jwt_identity())
    expense = Expense.query.filter_by(id=expense_id, user_id=current_user_id).first()
    
    if not expense:
        return jsonify({'error': 'Expense not found'}), 404
    
    data = request.get_json()
    
    # Update amount
    if data.get('amount') is not None:
        try:
            amount = float(data['amount'])
            if amount <= 0:
                return jsonify({'error': 'Amount must be positive'}), 400
            expense.amount = amount
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid amount'}), 400
    
    # Update description
    if data.get('description'):
        expense.description = data['description'].strip()
    
    # Update date
    if data.get('date'):
        try:
            expense.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    # Update notes
    if 'notes' in data:
        expense.notes = data['notes'].strip() if data['notes'] else None
    
    # Update category
    if data.get('category_id'):
        category = Category.query.filter_by(
            id=data['category_id'], 
            user_id=current_user_id
        ).first()
        if not category:
            return jsonify({'error': 'Invalid category'}), 400
        expense.category_id = data['category_id']
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Expense updated successfully',
            'expense': expense.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update expense', 'details': str(e)}), 500


@expenses_bp.route('/<int:expense_id>', methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    """Delete an expense."""
    current_user_id = int(get_jwt_identity())
    expense = Expense.query.filter_by(id=expense_id, user_id=current_user_id).first()
    
    if not expense:
        return jsonify({'error': 'Expense not found'}), 404
    
    try:
        db.session.delete(expense)
        db.session.commit()
        return jsonify({'message': 'Expense deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete expense', 'details': str(e)}), 500


@expenses_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_expense_summary():
    """Get expense summary by category for a given period."""
    current_user_id = int(get_jwt_identity())
    
    # Get period (default to current month)
    month = request.args.get('month', date.today().month, type=int)
    year = request.args.get('year', date.today().year, type=int)
    
    # Query expenses grouped by category
    summary = db.session.query(
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
    ).all()
    
    # Calculate total
    total_spent = sum(float(row.total) for row in summary)
    
    return jsonify({
        'month': month,
        'year': year,
        'total_spent': total_spent,
        'by_category': [
            {
                'category_id': row.id,
                'category_name': row.name,
                'icon': row.icon,
                'color': row.color,
                'total': float(row.total),
                'percentage': round((float(row.total) / total_spent * 100), 1) if total_spent > 0 else 0
            }
            for row in summary
        ]
    }), 200
