# Server/Views/Shopstockviews.py

from flask_restful import Resource, reqparse
from Server.Models.Shops import Shops
from Server.Models.Shopstock import ShopStock
from Server.Models.SystemStockTransfer import SystemStockTransfer
from Server.Models.Users import Users
from Server.Models.Inventory import Inventory, db
from Server.Models.Expenses import Expenses  # Import Expenses model
from Server.Models.Transfer import Transfer  # Import Transfer model
from Server.Models.Sales import Sales
from app import db
from flask import current_app
from functools import wraps
from flask import request, make_response, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import joinedload
import datetime 
from datetime import datetime
from sqlalchemy import func



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
        # Query for batch numbers with total quantity greater than zero
        batches = (
            db.session.query(ShopStock.BatchNumber)
            .group_by(ShopStock.BatchNumber)
            .having(func.sum(ShopStock.quantity) > 0)
            .all()
        )

        # Extract BatchNumber values into a list
        batch_numbers = [batch.BatchNumber for batch in batches]

        # Return the batch numbers as a JSON response
        return jsonify(batch_numbers)


class BatchDetailsResourceForShop(Resource):
    @jwt_required()
    def get(self):
        # Retrieve the batch number and shop_id from the request arguments
        batch_number = request.args.get('BatchNumber')
        shop_id = request.args.get('shop_id')
        
        if not batch_number or not shop_id:
            return {'message': 'Batch number and shop ID are required'}, 400
        
        # Query the ShopStock table for the given batch number and shop_id and filter out zero quantities
        shop_stock_items = ShopStock.query.filter_by(BatchNumber=batch_number, shop_id=shop_id).filter(ShopStock.quantity > 0).all()
        
        if not shop_stock_items:
            return {'message': 'No available stock for the given batch number and shop ID'}, 404

        # Select the first item with non-zero quantity
        shop_stock_item = shop_stock_items[0]

        # Prepare the sales details based on the selected batch number
        sales_details = {
            'itemname': shop_stock_item.itemname,
            'metric': shop_stock_item.metric,
            'unit_price': shop_stock_item.unitPrice,
            'BatchNumber': shop_stock_item.BatchNumber,
            'stock_id': shop_stock_item.stock_id,
            'quantity': shop_stock_item.quantity
        }
        
        return sales_details, 200





class BatchDetailsResource(Resource):
    @jwt_required()
    def get(self):
        # Retrieve the batch number from the request arguments
        batch_number = request.args.get('BatchNumber')
        
        if not batch_number:
            return {'message': 'Batch number is required'}, 400
        
        # Query the ShopStock table for the given batch number and filter out zero quantities
        shop_stock_items = ShopStock.query.filter_by(BatchNumber=batch_number).filter(ShopStock.quantity > 0).all()
        
        if not shop_stock_items:
            return {'message': 'No available stock for the given batch number'}, 404

        # Select the first item with non-zero quantity
        shop_stock_item = shop_stock_items[0]  # You can add custom logic to pick a specific record if needed

        # Prepare the sales details based on the selected batch number
        sales_details = {
            'itemname': shop_stock_item.itemname,
            'metric': shop_stock_item.metric,
            'unit_price': shop_stock_item.unitPrice,
            'BatchNumber': shop_stock_item.BatchNumber,
            'stock_id': shop_stock_item.stock_id,
            'quantity': shop_stock_item.quantity
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

            # Base query with eager loading
            query = ShopStock.query.options(joinedload(ShopStock.inventory))

            if shop_id:
                query = query.filter_by(shop_id=shop_id)
            if inventory_id is not None:  # Ensure it handles None correctly
                query = query.filter_by(inventory_id=inventory_id)

            # Execute query
            shop_stocks = query.all()

            # Serialize the data
            shop_stock_list = []
            for stock in shop_stocks:
                # Fetch shop name manually using shop_id
                shop = Shops.query.filter_by(shops_id=stock.shop_id).first()
                shopname = shop.shopname if shop else "Unknown Shop"

                # Handle missing inventory reference
                if stock.inventory:
                    item_name = stock.inventory.itemname
                    metric = stock.inventory.metric
                else:
                    # Fetch details from the transfer entry for manual stock
                    transfer = Transfer.query.filter_by(transfer_id=stock.transfer_id).first()
                    item_name = transfer.itemname if transfer else "Unknown Item"
                    metric = transfer.metric if transfer else "Unknown Metric"
                

                shop_stock_list.append({
                    "stock_id": stock.stock_id,
                    "shop_id": stock.shop_id,
                    "shop_name": shopname,
                    "inventory_id": stock.inventory_id,  # This will be None if manual stock
                    "item_name": item_name,  # Prioritizes Transfer, then Inventory
                    "batchnumber": stock.BatchNumber,
                    "metric": metric,  # Prioritizes Transfer, then Inventory
                    "quantity": stock.quantity,
                    "total_cost": stock.total_cost,
                    "unitPrice": stock.unitPrice
                })

            # Prepare the response
            response = {
                "shop_stocks": shop_stock_list
            }

            return make_response(jsonify(response), 200)

        except SQLAlchemyError as e:
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


class ShopStockByDate(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        try:
            # Get the 'start_date' and 'end_date' query parameters
            start_date_str = request.args.get('start_date')
            end_date_str = request.args.get('end_date')

            # Convert date strings to datetime objects if provided
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d') if start_date_str else None
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d') if end_date_str else None

            # Query transfers and sales within the date range
            transfers_query = Transfer.query
            sales_query = Sales.query

            # Apply date filters if specified
            if start_date:
                transfers_query = transfers_query.filter(Transfer.created_at >= start_date)
                sales_query = sales_query.filter(Sales.created_at >= start_date)
            if end_date:
                transfers_query = transfers_query.filter(Transfer.created_at <= end_date)
                sales_query = sales_query.filter(Sales.created_at <= end_date)

            transfers = transfers_query.all()
            sales = sales_query.all()

            # Process data
            shop_data = {}

            # Process transfers (based on inventory_id)
            for transfer in transfers:
                shop_id = transfer.shop_id
                inventory_id = transfer.inventory_id  # Transfer uses inventory_id

                if shop_id not in shop_data:
                    shop_data[shop_id] = {
                        "shop_name": transfer.shop.shopname,
                        "total_value": 0,
                        "stock_breakdown": {}
                    }

                if inventory_id not in shop_data[shop_id]["stock_breakdown"]:
                    shop_data[shop_id]["stock_breakdown"][inventory_id] = {
                        "item_name": transfer.itemname,
                        "quantity": 0,
                        "unitCost": transfer.unitCost,
                        "total_value": 0
                    }

                shop_data[shop_id]["stock_breakdown"][inventory_id]["quantity"] += transfer.quantity
                shop_data[shop_id]["stock_breakdown"][inventory_id]["total_value"] += transfer.quantity * transfer.unitCost
                shop_data[shop_id]["total_value"] += transfer.quantity * transfer.unitCost

            # Process sales (based on stock_id)
            for sale in sales:
                shop_id = sale.shop_id
                stock_id = sale.stock_id  # Sale uses stock_id

                if shop_id in shop_data:
                    # Find the inventory_id linked to this stock_id
                    for inventory_id, stock in shop_data[shop_id]["stock_breakdown"].items():
                        if stock_id == inventory_id:
                            stock["quantity"] -= sale.quantity
                            stock["total_value"] -= sale.quantity * stock["unitCost"]
                            shop_data[shop_id]["total_value"] -= sale.quantity * stock["unitCost"]

            # Prepare response
            response = {
                "start_date": start_date.strftime('%Y-%m-%d') if start_date else None,
                "end_date": end_date.strftime('%Y-%m-%d') if end_date else None,
                "shop_stocks": [
                    {
                        "shop_id": shop_id,
                        "shop_name": data["shop_name"],
                        "total_value": data["total_value"],
                        "stock_breakdown": [
                            {
                                "inventory_id": inventory_id,
                                "item_name": stock["item_name"],
                                "quantity": stock["quantity"],
                                "unitCost": stock["unitCost"],
                                "total_value": stock["total_value"]
                            } for inventory_id, stock in data["stock_breakdown"].items()
                        ]
                    } for shop_id, data in shop_data.items()
                ]
            }

            return response, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "Database error occurred", "details": str(e)}, 500

        except Exception as e:
            return {"error": "An unexpected error occurred", "details": str(e)}, 500


class UpdateShopStockUnitPrice(Resource):
    def put(self, stock_id):
        parser = reqparse.RequestParser()
        parser.add_argument('unitPrice', type=float, required=True, help='unitPrice is required')
        args = parser.parse_args()

        shop_stock = ShopStock.query.get(stock_id)
        
        if not shop_stock:
            return jsonify({'error': 'ShopStock not found'}), 404

        shop_stock.unitPrice = args['unitPrice']
        db.session.commit()

        return jsonify({'message': 'unitPrice updated successfully', 'stock_id': stock_id, 'new_unitPrice': args['unitPrice']})



class AvailableItemsByShopResource(Resource):
    @jwt_required()
    def get(self):
        # Get the shop_id from query parameters
        shop_id = request.args.get('shop_id')

        # Check if shop_id is provided
        if not shop_id:
            return jsonify({"error": "shop_id parameter is required"}), 400

        # Query for distinct item names with available stock in the shop
        items = db.session.query(ShopStock.itemname).filter(
            ShopStock.shop_id == shop_id,
            ShopStock.quantity > 0
        ).distinct().all()

        # Extract item names into a list
        item_names = [item.itemname for item in items]

        return jsonify(item_names)


class ItemDetailsResourceForShop(Resource):
    @jwt_required()
    def get(self):
        item_name = request.args.get('item_name')
        shop_id = request.args.get('shop_id')

        if not item_name or not shop_id:
            return {'message': 'Item name and shop ID are required'}, 400

        # Query all batches for the given item and shop where quantity > 0
        shop_stock_items = ShopStock.query.filter_by(itemname=item_name, shop_id=shop_id).filter(ShopStock.quantity > 0).all()

        if not shop_stock_items:
            return {'message': 'No available stock for the given item'}, 404

        # Sum up the quantity across all batches
        total_quantity = sum(stock.quantity for stock in shop_stock_items)

        # Use the first available batch for other details (assuming unit_price and metric are the same)
        first_batch = shop_stock_items[0]

        sales_details = {
            'itemname': first_batch.itemname,
            'metric': first_batch.metric,
            'unit_price': first_batch.unitPrice,
            'stock_id': first_batch.stock_id,  # Just for reference, might not be needed
            'BatchNumber': first_batch.BatchNumber,  # First available batch
            'quantity': total_quantity  # Sum of all batches
        }

        return sales_details, 200


class TransferSystemStock(Resource):
    @jwt_required()
    def post(self):
        try:
            data = request.get_json()

            from_shop_id = data.get("from_shop_id")
            to_shop_id = data.get("to_shop_id")
            stock_id = data.get("stock_id")  
            transfer_quantity = data.get("quantity")

            # Get the current user ID from JWT
            current_user_id = get_jwt_identity()

            # Fetch stock from source shop
            stock = ShopStock.query.filter_by(stock_id=stock_id, shop_id=from_shop_id).first()
            if not stock:
                return jsonify({"error": "Stock not found in the source shop"}), 404

            # Check if there is enough stock to transfer
            if stock.quantity < transfer_quantity:
                return jsonify({"error": "Insufficient stock to transfer"}), 400

            # Deduct stock from source shop
            stock.quantity -= transfer_quantity

            # Check if the destination shop already has this stock
            dest_stock = ShopStock.query.filter_by(shop_id=to_shop_id, BatchNumber=stock.BatchNumber).first()

            if dest_stock:
                # Update the existing stock record
                dest_stock.quantity += transfer_quantity
            else:
                # Create a new stock entry for the destination shop
                new_stock = ShopStock(
                    shop_id=to_shop_id,
                    inventory_id=stock.inventory_id,
                    BatchNumber=stock.BatchNumber,
                    quantity=transfer_quantity,
                    total_cost=stock.unitPrice * transfer_quantity,
                    unitPrice=stock.unitPrice,
                    itemname=stock.itemname,
                    metric=stock.metric
                )
                db.session.add(new_stock)

            # Record the transfer in SystemStockTransfer
            transfer_record = SystemStockTransfer(
                shops_id=from_shop_id,  # Main shop reference
                from_shop_id=from_shop_id,
                to_shop_id=to_shop_id,
                users_id=current_user_id,
                itemname=stock.itemname,
                inventory_id=stock.inventory_id,
                quantity=transfer_quantity,
                batch_number=stock.BatchNumber,
                transfer_date=datetime.utcnow(),
                total_cost=stock.unitPrice * transfer_quantity,
                unit_price=stock.unitPrice
            )
            db.session.add(transfer_record)

            # Commit changes
            db.session.commit()

            return jsonify({
                "message": "Stock transferred successfully",
                "transfer_details": {
                    "shops_id": from_shop_id,
                    "from_shop_id": from_shop_id,
                    "to_shop_id": to_shop_id,
                    "users_id": current_user_id,
                    "itemname": stock.itemname,
                    "inventory_id": stock.inventory_id,
                    "quantity": transfer_quantity,
                    "batch_number": stock.BatchNumber,
                    "transfer_date": transfer_record.transfer_date.isoformat(),  # Fix datetime serialization
                    "total_cost": stock.unitPrice * transfer_quantity,
                    "unit_price": stock.unitPrice
                }
            })  # Ensure jsonify is correctly used

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Unexpected error", "details": str(e)})  # Fix response formatting