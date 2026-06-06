# Utility functions

from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity


def validate_required_fields(data, fields):
    """Validate that required fields are present in the data."""
    missing = []
    for field in fields:
        if not data.get(field):
            missing.append(field)
    return missing


def paginate_query(query, page=1, per_page=20, max_per_page=100):
    """Apply pagination to a query."""
    per_page = min(per_page, max_per_page)
    return query.paginate(page=page, per_page=per_page, error_out=False)


def format_response(data=None, message=None, error=None, status_code=200):
    """Format a consistent API response."""
    response = {}
    if data is not None:
        response['data'] = data
    if message:
        response['message'] = message
    if error:
        response['error'] = error
    return jsonify(response), status_code
