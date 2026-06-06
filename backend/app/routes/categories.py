# Category Routes

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Category, Expense

categories_bp = Blueprint('categories', __name__)


@categories_bp.route('', methods=['GET'])
@jwt_required()
def get_categories():
    """Get all categories for the current user."""
    current_user_id = int(get_jwt_identity())
    
    categories = Category.query.filter_by(user_id=current_user_id).order_by(Category.name).all()
    
    return jsonify({
        'categories': [category.to_dict() for category in categories]
    }), 200


@categories_bp.route('/<int:category_id>', methods=['GET'])
@jwt_required()
def get_category(category_id):
    """Get a specific category."""
    current_user_id = int(get_jwt_identity())
    category = Category.query.filter_by(id=category_id, user_id=current_user_id).first()
    
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    
    return jsonify(category.to_dict()), 200


@categories_bp.route('', methods=['POST'])
@jwt_required()
def create_category():
    """Create a new category."""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data.get('name'):
        return jsonify({'error': 'Category name is required'}), 400
    
    name = data['name'].strip()
    
    # Check for duplicate
    existing = Category.query.filter_by(
        name=name, 
        user_id=current_user_id
    ).first()
    if existing:
        return jsonify({'error': 'Category with this name already exists'}), 409
    
    try:
        category = Category(
            name=name,
            icon=data.get('icon', '📦'),
            color=data.get('color', '#6b7280'),
            is_default=False,
            user_id=current_user_id
        )
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'message': 'Category created successfully',
            'category': category.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create category', 'details': str(e)}), 500


@categories_bp.route('/<int:category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id):
    """Update an existing category."""
    current_user_id = int(get_jwt_identity())
    category = Category.query.filter_by(id=category_id, user_id=current_user_id).first()
    
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    
    data = request.get_json()
    
    # Update name
    if data.get('name'):
        name = data['name'].strip()
        # Check for duplicate
        existing = Category.query.filter(
            Category.name == name,
            Category.user_id == current_user_id,
            Category.id != category_id
        ).first()
        if existing:
            return jsonify({'error': 'Category with this name already exists'}), 409
        category.name = name
    
    # Update icon
    if data.get('icon'):
        category.icon = data['icon']
    
    # Update color
    if data.get('color'):
        category.color = data['color']
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Category updated successfully',
            'category': category.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update category', 'details': str(e)}), 500


@categories_bp.route('/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id):
    """Delete a category (and optionally reassign expenses)."""
    current_user_id = int(get_jwt_identity())
    category = Category.query.filter_by(id=category_id, user_id=current_user_id).first()
    
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    
    # Check if there are expenses in this category
    expense_count = Expense.query.filter_by(
        category_id=category_id, 
        user_id=current_user_id
    ).count()
    
    if expense_count > 0:
        # Get reassign_to category (optional)
        reassign_to = request.args.get('reassign_to', type=int)
        
        if reassign_to:
            # Verify the target category exists and belongs to user
            target_category = Category.query.filter_by(
                id=reassign_to, 
                user_id=current_user_id
            ).first()
            if not target_category:
                return jsonify({'error': 'Target category not found'}), 400
            
            # Reassign expenses
            Expense.query.filter_by(
                category_id=category_id,
                user_id=current_user_id
            ).update({'category_id': reassign_to})
        else:
            return jsonify({
                'error': 'Cannot delete category with expenses',
                'expense_count': expense_count,
                'hint': 'Use ?reassign_to=<category_id> to move expenses to another category'
            }), 400
    
    try:
        db.session.delete(category)
        db.session.commit()
        return jsonify({'message': 'Category deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete category', 'details': str(e)}), 500
