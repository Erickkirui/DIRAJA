# Server/Views/Shopstockviews.py

from flask_restful import Resource, reqparse
from Server.Models.Shops import Shops
from Server.Models.Shopstock import ShopStock
from Server.Models.Users import Users
from Server.Models.Inventory import Inventory, db
from Server.Models.Expenses import Expenses  # Import Expenses model
from Server.Models.Transfer import Transfer  # Import Transfer model
from app import db
from flask import current_app
from functools import wraps
from flask import request, make_response, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import joinedload
import datetime 


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


class AvailableBatchesByShopResource(Resource):
    @jwt_required()
    def get(self):
        # Get the shop_id from query parameters
        shop_id = request.args.get('shop_id')

        # Check if shop_id is provided
        if not shop_id:
            return jsonify({"error": "shop_id parameter is required"}), 400

        # Query for batch numbers with quantity > 0 and matching shop_id
        batches = db.session.query(ShopStock.BatchNumber).filter(
            ShopStock.shop_id == shop_id,
            ShopStock.quantity > 0
        ).all()

        # Extract BatchNumber values into a list
        batch_numbers = [batch.BatchNumber for batch in batches]

        # Return the batch numbers as a JSON response
        return jsonify(batch_numbers)
    
class AvailableBatchesResource(Resource):
    @jwt_required()
    def get(self):
        # Query for batch numbers with quantity greater than zero
        batches = db.session.query(ShopStock.BatchNumber).filter(ShopStock.quantity > 0).all()

        # Extract BatchNumber values into a list
        batch_numbers = [batch.BatchNumber for batch in batches]

        # Return the batch numbers as a JSON response
        return jsonify(batch_numbers)
    
class BatchDetailsResource(Resource):
    def get(self):
        # Retrieve the batch number from the request arguments
        batch_number = request.args.get('BatchNumber')
        
        if not batch_number:
            return {'message': 'Batch number is required'}, 400
        
        # Query the ShopStock table for the given batch number
        shop_stock_item = ShopStock.query.filter_by(BatchNumber=batch_number).first()
        
        if not shop_stock_item:
            return {'message': 'Batch number not found'}, 404

        # Prepare the sales details based on the selected batch number
        sales_details = {
            'itemname':shop_stock_item.itemname,
            'metric': shop_stock_item.metric,
            'unit_price': shop_stock_item.unitPrice,
            'BatchNumber': shop_stock_item.BatchNumber,
            'stock_id': shop_stock_item.stock_id
        }
        
        return sales_details, 200
    
# Delete a shop stock (one that aligns with the route)
# This deletes an item from a specific shop and returns the item to the central inventory
class ShopStockDelete(Resource):
    parser = reqparse.RequestParser()
    parser.add_argument('quantity_to_delete', type=int, required=True, help="Quantity to delete cannot be blank!")

    @jwt_required()
    @check_role('manager')  # Ensure only managers can perform this action
    def delete(self, shop_id, inventory_id):
        args = self.parser.parse_args()
        quantity_to_delete = args['quantity_to_delete']

        try:
            # Start a transaction
            with db.session.begin_nested():
                # Fetch the ShopStock entry
                shop_stock = ShopStock.query.filter_by(shop_id=shop_id, inventory_id=inventory_id).first()
                if not shop_stock:
                    return {"error": f"Stock for Inventory ID {inventory_id} in Shop ID {shop_id} not found"}, 404

                if quantity_to_delete <= 0:
                    return {"error": "Quantity to delete must be a positive integer"}, 400

                if quantity_to_delete > shop_stock.quantity:
                    return {"error": f"Cannot delete {quantity_to_delete} units as only {shop_stock.quantity} units are available"}, 400

                # Fetch the corresponding Inventory item
                inventory_item = Inventory.query.get(shop_stock.inventory_id)
                if not inventory_item:
                    return {"error": f"Inventory item with ID {shop_stock.inventory_id} not found"}, 404

                # Calculate the cost per unit
                if shop_stock.quantity == 0:
                    unit_cost = 0
                else:
                    unit_cost = shop_stock.total_cost / shop_stock.quantity

                # Calculate the new total cost based on remaining quantity
                remaining_quantity = shop_stock.quantity - quantity_to_delete
                new_total_cost = unit_cost * remaining_quantity

                # Update the ShopStock entry
                if remaining_quantity > 0:
                    shop_stock.quantity = remaining_quantity
                    shop_stock.total_cost = new_total_cost
                    db.session.add(shop_stock)
                else:
                    # If all stock is deleted, remove the ShopStock entry
                    db.session.delete(shop_stock)

                # Add the quantity back to the central inventory
                inventory_item.quantity += quantity_to_delete
                db.session.add(inventory_item)

                # Fetch the corresponding Transfer entry
                transfer = Transfer.query.filter_by(
                    shop_id=shop_id,
                    inventory_id=inventory_id,
                    quantity=shop_stock.quantity  # Adjust as per your Transfer model's fields
                ).first()

                if transfer and transfer.expenses:
                    expense = transfer.expenses  # Access via relationship

                    if remaining_quantity > 0:
                        # Update the existing Expense to reflect the remaining stock
                        expense.totalPrice = new_total_cost
                        expense.amountPaid = new_total_cost
                        expense.description = f"Adjusted expense after deleting {quantity_to_delete} units. Remaining: {remaining_quantity} units."
                        if hasattr(expense, 'updated_at'):
                            expense.updated_at = datetime.datetime.utcnow()
                        db.session.add(expense)
                    else:
                        # If all stock is deleted, set expense to zero or handle as per business logic
                        expense.totalPrice = 0
                        expense.amountPaid = 0
                        expense.description = f"All stock deleted. Expense reset to zero."
                        if hasattr(expense, 'updated_at'):
                            expense.updated_at = datetime.datetime.utcnow()
                        db.session.add(expense)
                else:
                    # Handle the case where Transfer or Expenses are not found
                    return {"error": "Related Transfer or Expense record not found"}, 404

                # Commit the transaction
                db.session.commit()

            # Prepare the response
            response = {
                "message": "Shop stock deleted successfully and quantity returned to central inventory",
                "inventory_item": {
                    "inventory_id": inventory_item.inventory_id,
                    "item_name": inventory_item.itemname,
                    "updated_quantity": inventory_item.quantity
                },
                "deleted_stock": {
                    "shop_id": shop_id,
                    "inventory_id": inventory_id,
                    "quantity_deleted": quantity_to_delete,
                    "quantity_remaining": remaining_quantity
                },
                "expense_adjustment": {
                    "description": expense.description,
                    "totalPrice": expense.totalPrice,
                    "amountPaid": expense.amountPaid,
                    "updated_at": expense.updated_at.isoformat() if hasattr(expense, 'updated_at') else None
                }
            }

            return response, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            current_app.logger.error(f"Database error occurred: {str(e)}")
            return {"error": "An error occurred while deleting shop stock"}, 500
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Unexpected error occurred: {str(e)}")
            return {"error": "An unexpected error occurred"}, 500

        

class GetShopStock(Resource):
    @jwt_required()
    def get(self):
        try:
            # Optional filters
            shop_id = request.args.get('shop_id', type=int)
            inventory_id = request.args.get('inventory_id', type=int)

            # Base query
            query = ShopStock.query

            if shop_id:
                query = query.filter_by(shop_id=shop_id)
            if inventory_id:
                query = query.filter_by(inventory_id=inventory_id)

            # Execute query without eager loading
            shop_stocks = query.all()  # Fetch all results

            # Serialize the data
            shop_stock_list = []
            for stock in shop_stocks:
                # Fetch shop name manually using shop_id
                shop = Shops.query.filter_by(shops_id=stock.shop_id).first()

                # Handle cases where shop may not be found
                shopname = shop.shopname if shop else "Unknown Shop"

                shop_stock_list.append({
                    "stock_id": stock.stock_id,
                    "shop_id": stock.shop_id,
                    "shop_name": shopname,  # Adjust attribute if different
                    "inventory_id": stock.inventory_id,
                    "item_name": stock.inventory.itemname,  # Adjust attribute if different
                    "batchnumber": stock.BatchNumber,
                    "metric": stock.inventory.metric,
                    "quantity": stock.quantity,
                    "total_cost": stock.total_cost,
                    "unitPrice": stock.unitPrice
                })

            # Prepare the response
            response = {
                "shop_stocks": shop_stock_list
            }

            return make_response(jsonify(response), 200)

        except SQLAlchemyError:
            db.session.rollback()
            return {"error": "An error occurred while fetching shop stock data"}, 500



        

#Get shopstock by id
class GetShopStockByShopId(Resource):
    @jwt_required()
    
    def get(self, shop_id):
        try:
            # Fetch the shop to ensure it exists
            shop = Shops.query.get(shop_id)
            if not shop:
                return {"error": f"Shop with ID {shop_id} not found"}, 404
            
            # Fetch all ShopStock entries for the given shop_id with related inventory data
            shop_stocks = ShopStock.query.filter_by(shop_id=shop_id).options(
                joinedload(ShopStock.inventory)
            ).all()
            
            # Serialize the data
            stock_list = [{
                "shop_id": stock.shop_id,
                "shop_name": stock.shop.shopname,
                "inventory_id": stock.inventory_id,
                "item_name": stock.inventory.itemname,
                "batchnumber": stock.BatchNumber,
                "metric": stock.inventory.metric,
                "quantity": stock.quantity,
                "total_cost": stock.total_cost,
                "unitPrice": stock.unitPrice
            } for stock in shop_stocks]
            
            # Prepare the response
            response = {
                "shop_id": shop_id,
                "shop_name": shop.shopname,
                "shop_stocks": stock_list
            }
            
            return make_response(jsonify(response), 200)
        
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "An error occurred while fetching shop stock data"}, 500
        

# Get all shop stocks across all shops 
class GetAllStock(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        try:
            # Base query for all shop stocks
            shop_stocks = ShopStock.query.options(
                joinedload(ShopStock.shop),
                joinedload(ShopStock.inventory)
            ).all()

            # Serialize the data
            shop_stock_list = []
            for stock in shop_stocks:
                shop_stock_list.append({
                    "stock_id": stock.stock_id,
                    "shop_id": stock.shop_id,
                    "shop_name": stock.shop.shopname,  
                    "inventory_id": stock.inventory_id,
                    "item_name": stock.inventory.itemname, 
                    "batchnumber": stock.BatchNumber,
                    "metric": stock.inventory.metric, 
                    "quantity": stock.quantity,
                    "total_cost": stock.total_cost,
                    "unitPrice": stock.unitPrice
                })

            # Prepare the response
            response = {
                "total_shop_stocks": len(shop_stock_list),
                "shop_stocks": shop_stock_list
            }

            return make_response(jsonify(response), 200)

        except SQLAlchemyError:
            db.session.rollback()
            return {"error": "An error occurred while fetching all shop stock data"}, 500
        
        
# Get items by shop ID
class GetItemsByShopId(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self, shop_id):
        try:
            # Fetch items associated with the shop
            items = ShopStock.query.filter_by(shop_id=shop_id).options(joinedload(ShopStock.inventory)).all()
            
            # Serialize the data
            item_list = []
            for stock in items:
                item_list.append({
                    "itemname": stock.inventory.itemname,
                    "BatchNumber": stock.BatchNumber,
                    "metric": stock.inventory.metric,
                    "unitPrice": stock.unitPrice,
                    "stock_id": stock.stock_id
                })
            
            # Prepare the response
            response = {
                "shop_id": shop_id,
                "items": item_list
            }
            
            return make_response(jsonify(response), 200)
        
        except SQLAlchemyError:
            db.session.rollback()
            return {"error": "An error occurred while fetching items for the shop"}, 500



#Get shopstock value per shop

class GetStockValueByShop(Resource):
    @jwt_required()
    def get(self, shop_id):
        try:
            # Fetch the shop to ensure it exists
            shop = Shops.query.get(shop_id)
            if not shop:
                return {"error": f"Shop with ID {shop_id} not found"}, 404

            # Calculate the total stock value for the given shop
            total_stock_value = db.session.query(
                db.func.sum(ShopStock.total_cost)
            ).filter_by(shop_id=shop_id).scalar()  # Use scalar() to fetch the single aggregated value

            # Handle the case where the shop has no stock
            total_stock_value = total_stock_value or 0.0

            # Prepare the response
            response = {
                "shop_id": shop_id,
                "shop_name": shop.shopname,
                "total_stock_value": total_stock_value
            }

            return make_response(jsonify(response), 200)

        except SQLAlchemyError as e:
            db.session.rollback()
            current_app.logger.error(f"Database error occurred: {str(e)}")
            return {"error": "An error occurred while calculating stock value"}, 500
        except Exception as e:
            current_app.logger.error(f"Unexpected error occurred: {str(e)}")
            return {"error": "An unexpected error occurred"}, 500


# class GetShopsWithStock(Resource):
#     @jwt_required()
#     def get(self):
#         try:
#             # Query to get shop names and their total stock values
#             query = db.session.query(
#                 Shops.name.label("shop_name"),
#                 db.func.sum(ShopStock.unit_price * ShopStock.quantity).label("total_stock_value")
#             ).join(ShopStock, Shops.id == ShopStock.shop_id)  # Assuming Stock has a shop_id foreign key
#             .group_by(shop_.id, shop_name)
            
#             # Execute the query
#             result = query.all()

#             # Format the response
#             shop_stock_list = [
#                 {"shop_name": row.shop_name, "total_stock_value": float(row.total_stock_value) if row.total_stock_value else 0.0}
#                 for row in result
#             ]

#             if not shop_stock_list:
#                 return {"message": "No shops or stock found"}, 404

#             return {"shops_with_stock": shop_stock_list}, 200

#         except SQLAlchemyError as e:
#             # Roll back in case of transaction failure
#             db.session.rollback()
#             return {"error": "Database error occurred", "details": str(e)}, 500

#         except Exception as e:
#             return {"error": "An unexpected error occurred", "details": str(e)}, 500


# Get stock value for all shops
class TotalStockValue(Resource):
    @jwt_required()
    @check_role('manager')  # Ensure only managers can access this endpoint
    def get(self):
        try:
            # Fetch all shop stocks with required fields
            shop_stocks = ShopStock.query.options(
                joinedload(ShopStock.shop),
                joinedload(ShopStock.inventory)
            ).all()

            # Compute the total value of stock for each shop
            shop_stock_values = {}
            for stock in shop_stocks:
                shop_id = stock.shop_id
                shop_name = stock.shop.shopname
                stock_value = stock.quantity * stock.unitPrice

                if shop_id not in shop_stock_values:
                    shop_stock_values[shop_id] = {
                        "shop_name": shop_name,
                        "total_stock_value": 0
                    }

                shop_stock_values[shop_id]["total_stock_value"] += stock_value

            # Prepare the response
            response = {
                "shop_stock_values": shop_stock_values
            }

            return make_response(jsonify(response), 200)

        except SQLAlchemyError as e:
            db.session.rollback()
            current_app.logger.error(f"Database error occurred: {str(e)}")
            return {"error": "An error occurred while calculating the total stock value"}, 500
        except Exception as e:
            current_app.logger.error(f"Unexpected error occurred: {str(e)}")
            return {"error": "An unexpected error occurred"}, 500

