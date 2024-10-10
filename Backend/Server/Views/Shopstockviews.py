from  flask_restful import Resource
from Server.Models.Shops import Shops
from Server.Models.Shopstock import ShopStock
from Server.Models.Users import Users
from Server.Models.Inventory import Inventory, db
from app import db
from functools import wraps
from flask import request,make_response,jsonify
from flask_jwt_extended import jwt_required,get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import joinedload

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

# Delete a shop stock(One that alligns with the route) This deletes an item from a specific shop and returns the item to the central inventory
class ShopStockDelete(Resource):
    @jwt_required()
    def delete(self, shop_id, inventory_id):
        try:
            # Start a transaction
            with db.session.begin_nested():
                # Fetch the ShopStock entry
                shop_stock = ShopStock.query.filter_by(shop_id=shop_id, inventory_id=inventory_id).first()
                if not shop_stock:
                    return {"error": f"Stock for Inventory ID {inventory_id} in Shop ID {shop_id} not found"}, 404

                # Fetch the corresponding Inventory item
                inventory_item = Inventory.query.get(shop_stock.inventory_id)
                if not inventory_item:
                    return {"error": f"Inventory item with ID {shop_stock.inventory_id} not found"}, 404

                # Add the quantity back to the central inventory
                inventory_item.quantity += shop_stock.quantity
                db.session.add(inventory_item)

                # Delete the ShopStock entry
                db.session.delete(shop_stock)

                # Commit the transaction
                db.session.commit()

            # Prepare the response
            response = {
                "message": "Shop stock deleted successfully and quantity returned to central inventory",
                "inventory_item": {
                    "inventory_id": inventory_item.inventory_id,
                    "itemname": inventory_item.itemname,  # Corrected field name
                    "updated_quantity": inventory_item.quantity
                },
                "deleted_stock": {
                    "shop_id": shop_id,
                    "inventory_id": inventory_id,
                    "quantity_returned": shop_stock.quantity
                }
            }

            return response, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "An error occurred while deleting shop stock"}, 500

        

#Get shop stock
class GetShopStock(Resource):
    
    @jwt_required()
    
    def get(self):
        try:
            # Pagination parameters
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 10, type=int)
            
            # Optional filters
            shop_id = request.args.get('shop_id', type=int)
            inventory_id = request.args.get('inventory_id', type=int)
            
            # Base query
            query = ShopStock.query
            
            if shop_id:
                query = query.filter_by(shop_id=shop_id)
            if inventory_id:
                query = query.filter_by(inventory_id=inventory_id)
            
            # Eager load related models to optimize queries
            shop_stocks = query.options(
                joinedload(ShopStock.shop),
                joinedload(ShopStock.inventory)
            ).paginate(page=page, per_page=per_page, error_out=False)
            
            # Serialize the data
            shop_stock_list = []
            for stock in shop_stocks.items:
                shop_stock_list.append({
                    "shop_id": stock.shop_id,
                    "shop_name": stock.shop.shopname,  # Adjust attribute if different
                    "inventory_id": stock.inventory_id,
                    "item_name": stock.inventory.itemname,  # Adjust attribute if different
                    "quantity": stock.quantity,
                    "total_cost": stock.total_cost,
                    "unit_price": stock.unit_price
                })
            
            # Prepare the response with pagination info
            response = {
                "total_shop_stocks": shop_stocks.total,
                "page": shop_stocks.page,
                "per_page": shop_stocks.per_page,
                "pages": shop_stocks.pages,
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
                "shop_name": shop.shopname,
                "inventory_id": stock.inventory_id,
                "item_name": stock.inventory.itemname,
                "quantity": stock.quantity,
                "total_cost": stock.total_cost,
                "unit_price": stock.unit_price
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
                    "shop_id": stock.shop_id,
                    "shop_name": stock.shop.shopname,  
                    "inventory_id": stock.inventory_id,
                    "item_name": stock.inventory.itemname,  
                    "quantity": stock.quantity,
                    "total_cost": stock.total_cost,
                    "unit_price": stock.unit_price
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