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
            if user and user.role != required_role:
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

        if 'name' not in data:
            return {'message': 'Missing category name'}, 400

        category_name = data.get('name').strip()

        # Check if the category already exists
        if ExpenseCategory.query.filter_by(name=category_name).first():
            return {'message': 'Category already exists'}, 400

        category = ExpenseCategory(name=category_name)
        db.session.add(category)
        db.session.commit()

        return {'message': 'Category added successfully'}, 201


# Get, delete, or manage specific expense categories
class ExpenseCategoryResource(Resource):
    @jwt_required()
    def get(self, category_id):
        category = ExpenseCategory.query.get(category_id)

        if category:
            return {
                "id": category.id,
                "name": category.name
            }, 200
        else:
            return {"error": "Category not found"}, 404

    @jwt_required()
    @check_role('manager')
    def delete(self, category_id):
        category = ExpenseCategory.query.get(category_id)

        if category:
            db.session.delete(category)
            db.session.commit()
            return {"message": "Category deleted successfully"}, 200
        else:
            return {"error": "Category not found"}, 404
