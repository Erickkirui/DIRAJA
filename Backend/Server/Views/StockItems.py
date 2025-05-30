from flask_restful import Resource

from flask import request, jsonify,make_response
from flask_jwt_extended import jwt_required
from app import db
from Server.Models.Users import Users
from Server.Models.StockItems import StockItems
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

class PostStockItem(Resource):

    @jwt_required()
    @check_role('manager')
    def post(self):
        data = request.get_json()

        item_name = data.get('item_name')
        item_code = data.get('item_code')

        if not item_name :
            return {"message": "item_name  is required."}, 400

        # Check if item already exists
        existing = StockItems.query.filter_by(item_name=item_name).first()
        if existing:
            return {"message": "This item already exists."}, 409

        new_item = StockItems(
            item_name=item_name,
            item_code=item_code
        )

        db.session.add(new_item)
        db.session.commit()

        return {
            "message": "Stock item created successfully.",
            "stock_item": {
                "id": new_item.id,
                "item_name": new_item.item_name,
                "item_code": new_item.item_code
            }
        }, 201


class GetAllStockItems(Resource):
    @jwt_required()
    def get(self):
        items = StockItems.query.all()
        result = []

        for item in items:
            result.append({
                "id": item.id,
                "item_name": item.item_name,
                "item_code": item.item_code
            })

        return {"stock_items": result}, 200


class StockItem(Resource):

    @jwt_required()
    @check_role('manager')
    def get(self, item_id=None):
        """Retrieve a single stock item by ID or all items if no ID is provided."""
        if item_id:
            # Find a specific item by ID
            item = StockItems.query.get(item_id)
            
            if not item:
                return {"message": "Item not found."}, 404

            return {
                "id": item.id,
                "item_name": item.item_name,
                "item_code": item.item_code
            }, 200

        # If no item_id provided, return all items
        items = StockItems.query.all()
        return [
            {
                "id": item.id,
                "item_name": item.item_name,
                "item_code": item.item_code
            }
            for item in items
        ], 200

    @jwt_required()
    @check_role('manager')
    def put(self, item_id):
        """Update an existing stock item by item_id."""
        data = request.get_json()

        # Find the item by ID
        item = StockItems.query.get(item_id)

        if not item:
            return {"message": "Item not found."}, 404

        # Update the fields
        item_name = data.get('item_name', item.item_name)
        item_code = data.get('item_code', item.item_code)

        if item_name != item.item_name:
            item.item_name = item_name
        if item_code != item.item_code:
            item.item_code = item_code

        db.session.commit()

        return {
            "message": "Stock item updated successfully.",
            "stock_item": {
                "id": item.id,
                "item_name": item.item_name,
                "item_code": item.item_code
            }
        }, 200

    @jwt_required()
    @check_role('manager')
    def delete(self, item_id):
        """Delete a stock item by item_id."""
        # Find the item by ID
        item = StockItems.query.get(item_id)

        if not item:
            return {"message": "Item not found."}, 404

        db.session.delete(item)
        db.session.commit()

        return {"message": "Stock item deleted successfully."}, 200
