from  flask_restful import Resource
from Server.Models.Shops import Shops, ShopStock
from Server.Models.Users import Users
from Server.Models.Inventory import Inventory, db, Distribution, Transfer
from app import db
from functools import wraps
from flask import request,make_response,jsonify
from flask_jwt_extended import jwt_required,get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError

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


class AddShops(Resource):
    
    # @jwt_required
    # @check_role('manager')
    def post (self):
        data = request.get_json()
        
        
        if 'shopname' not in data or 'employee'  not in data or 'shopstatus' not in data:
            return {'message': 'Missing shopname, employee or status'}, 400
    
        shopname = data.get('shopname')
        employee = data.get('employee') 
        shopstatus =  data.get('shopstatus')
        
        # Check if shop already exists
        if Shops.query.filter_by(shopname=shopname).first():
            return {'message': 'Shop already exists'}, 400

        shop = Shops(shopname=shopname, employee=employee,shopstatus=shopstatus)
        db.session.add(shop)
        db.session.commit()
        
        return {'message': 'Shop added successfully'}, 201
    
    
class ShopsResourceById(Resource):
    def get(self, shops_id):

        shop = Shops.query.get(shops_id)
   
        if shop :
            return {
            "shops_id": shop.shops_id,
            "shopname": shop.shopname,
            "employee": shop.employee,
            "shopstatus": shop.shopstatus
        }, 200
        else:
             return {"error": "Shop not found"}, 400
         

class ShopsResourceByName(Resource):
    def get(self, shopname):

        shop = Shops.query.filter_by(shopname=shopname).first()

   
        if shop :
            return {
            "shops_id": shop.shops_id,
            "shopname": shop.shopname,
            "employee": shop.employee,
            "shopstatus": shop.shopstatus
        }, 200
        else:
             return {"error": "Shop not found"}, 400
         
         
    def delete(self, shopname):

        shop = Shops.query.filter_by(shopname=shopname).first()
        
        if shop:
            db.session.delete(shop)  
            db.session.commit()  
            return {"message": "Shop deleted successfully"}, 200
        else:
            return {"error": "Shop not found"}, 404
        
    def put(self, shopname):
        shop = Shops.query.filter_by(shopname=shopname).first()
        if not shop:
            return {"error": "Shop not found"}, 404
        
        data = request.get_json()
        
        # Update the shop's fields
        if 'shopname' in data:
            shop.shopname = data['shopname']
        if 'employee' in data:
            shop.employee = data['employee']
        if 'shopstatus' in data:
            shop.shopstatus = data['shopstatus']
        
        db.session.commit()
        
        return {"message": "Shop updated successfully"}, 200


   
#Delete a shopstock
class ShopStockDelete(Resource):
    def delete(self, shopname, stock_id):
        try:
            # Start a transaction
            with db.session.begin_nested():
                # Fetch the ShopStock entry
                shop_stock = ShopStock.query.filter_by(shop_id=shopname, stock_id=stock_id).first()
                if not shop_stock:
                    return {"error": f"Stock with ID {stock_id} for Shop name {shopname} not found"}, 404

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
                    "item_name": inventory_item.item_name,
                    "updated_quantity": inventory_item.quantity
                },
                "deleted_stock": {
                    "stock_id": stock_id,
                    "shopname": shopname,
                    "quantity_returned": shop_stock.quantity
                }
            }

            return response, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "An error occurred while deleting shop stock"}, 500