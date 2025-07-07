from flask_restful import Resource

from flask import request, jsonify,make_response
from flask_jwt_extended import jwt_required
from app import db
from Server.Models.Users import Users
from Server.Models.ExpenseCategory import ExpenseCategory
from flask_jwt_extended import jwt_required,get_jwt_identity
from functools import wraps


def check_role(required_role):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = Users.query.get(current_user_id)
            if user and user.role != required_role:
                 return make_response( jsonify({"error": "Unauthorized access"}), 403 )       
            return fn(*args, **kwargs)
        return decorator
    return wrapper

class PostExpenseCategory(Resource):

    @jwt_required()
    @check_role('manager')
    def post(self):
        data = request.get_json()

        category_name = data.get('category_name')
        category_type = data.get('type')

        if not category_name or not category_type:
            return {"message": "Both category_name and type are required."}, 400

        # Check if category already exists
        existing = ExpenseCategory.query.filter_by(category_name=category_name, type=category_type).first()
        if existing:
            return {"message": "This expense category already exists."}, 409

        new_category = ExpenseCategory(
            category_name=category_name,
            type=category_type
        )

        db.session.add(new_category)
        db.session.commit()

        return {
            "message": "Expense category created successfully.",
            "expense_category": {
                "id": new_category.id,
                "category_name": new_category.category_name,
                "type": new_category.type
            }
        }, 201
        
class GetAllExpenseCategories(Resource):
    @jwt_required()
    def get(self):
        categories = ExpenseCategory.query.all()
        result = []

        for category in categories:
            result.append({
                "id": category.id,
                "category_name": category.category_name,
                "type": category.type
            })

        return result, 200  # Directly return the array


class ExpenseCategoryResource(Resource):

    @jwt_required()
    @check_role('manager')
    def get(self, category_id=None):
        """Retrieve a single expense category by ID or all categories if no ID is provided."""
        if category_id:
            # Find a specific category by ID
            category = ExpenseCategory.query.get(category_id)
            
            if not category:
                return {"message": "Expense category not found."}, 404

            return {
                "id": category.id,
                "category_name": category.category_name,
                "type": category.type
            }, 200

        # If no category_id provided, return all categories
        categories = ExpenseCategory.query.all()
        return [
            {
                "id": category.id,
                "category_name": category.category_name,
                "type": category.type
            }
            for category in categories
        ], 200

    @jwt_required()
    @check_role('manager')
    def put(self, category_id):
        """Update an existing expense category by category_id."""
        data = request.get_json()

        # Find the category by ID
        category = ExpenseCategory.query.get(category_id)

        if not category:
            return {"message": "Expense category not found."}, 404

        # Update the fields
        category_name = data.get('category_name', category.category_name)
        category_type = data.get('type', category.type)

        if category_name != category.category_name:
            # Check if new name already exists for this type
            existing = ExpenseCategory.query.filter_by(
                category_name=category_name,
                type=category_type
            ).first()
            if existing:
                return {"message": "This expense category already exists."}, 409
            category.category_name = category_name

        if category_type != category.type:
            category.type = category_type

        db.session.commit()

        return {
            "message": "Expense category updated successfully.",
            "expense_category": {
                "id": category.id,
                "category_name": category.category_name,
                "type": category.type
            }
        }, 200

    @jwt_required()
    @check_role('manager')
    def delete(self, category_id):
        """Delete an expense category by category_id."""
        # Find the category by ID
        category = ExpenseCategory.query.get(category_id)

        if not category:
            return {"message": "Expense category not found."}, 404

        db.session.delete(category)
        db.session.commit()

        return {"message": "Expense category deleted successfully."}, 200