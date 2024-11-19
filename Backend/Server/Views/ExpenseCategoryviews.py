from flask_restful import Resource
from Server.Models.ExpenseCategories import ExpenseCategory
from Server.Models.Users import Users
from app import db
from functools import wraps
from flask import request, make_response, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity


# Role-checking decorator
def check_role(required_role):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = Users.query.get(current_user_id)
            if not user or user.role != required_role:
                return make_response(jsonify({"error": "Unauthorized access"}), 403)
            return fn(*args, **kwargs)
        return decorator
    return wrapper


# Add new expense category
class AddExpenseCategory(Resource):
    @jwt_required()
    @check_role('manager')
    def post(self):
        data = request.get_json()

        # Validate input
        if not data or 'categoryname' not in data:
            return {'message': 'Missing category name'}, 400

        categoryname = data.get('categoryname').strip()

        # Ensure the category name is not empty
        if not categoryname:
            return {'message': 'Category name cannot be empty'}, 400

        # Check if the category already exists
        if ExpenseCategory.query.filter_by(categoryname=categoryname).first():
            return {'message': 'Category already exists'}, 400

        # Create and save the new category
        category = ExpenseCategory(categoryname=categoryname)
        db.session.add(category)
        db.session.commit()

        return {
            'message': 'Category added successfully',
            'category': {
                'category_id': category.category_id,
                'categoryname': category.categoryname
            }
        }, 201


# Manage specific expense categories
class ExpenseCategoryResource(Resource):
    @jwt_required()
    def get(self, category_id=None):
        if category_id:
            # Fetch a specific category
            category = ExpenseCategory.query.get(category_id)
            if not category:
                return {'message': 'Category not found'}, 404
            return {
                'category_id': category.category_id,
                'categoryname': category.categoryname
            }, 200
        else:
            # Fetch all categories
            categories = ExpenseCategory.query.all()
            return {
                'categories': [
                    {
                        'category_id': category.category_id,
                        'categoryname': category.categoryname
                    }
                    for category in categories
                ]
            }, 200

