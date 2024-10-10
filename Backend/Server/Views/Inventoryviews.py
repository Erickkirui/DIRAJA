from  flask_restful import Resource
from Server.Models.Inventory import Inventory, db, Distribution, Transfer
from Server.Models.Shops import ShopStock, Shops
from Server.Models.Users import Users
from app import db
from functools import wraps
from flask import request,make_response,jsonify
from flask_jwt_extended import jwt_required,get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
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



#DIFFERENT APPROACH. This one shows the initial quantity that was added to the inventory and the available quantity after a distribution is made
class AddInventory(Resource):
    @jwt_required()
    @check_role('manager')
    def post(self):
        data = request.get_json()
        
        required_fields = ['itemname', 'quantity', 'metric', 'unitCost', 'totalCost', 'amountPaid', 'unitPrice']
        if not all(field in data for field in required_fields):
            return {'message': 'Missing itemname, quantity, metric, unitCost, totalCost, amountPaid, or unitPrice'}, 400

        itemname = data.get('itemname')
        quantity = data.get('quantity') 
        metric = data.get('metric')
        totalCost = data.get('totalCost')
        unitCost = data.get('unitCost')
        amountPaid = data.get('amountPaid')
        unitPrice = data.get('unitPrice')
        
        
         
        # Convert the 'created_at' string to a datetime object
        created_at = data.get('created_at')
        if created_at:
            created_at = datetime.strptime(created_at, '%Y-%m-%d')
        
        inventory = Inventory(
            itemname=itemname, 
            initial_quantity=quantity,  # Set initial_quantity
            quantity=quantity,          # Set remaining quantity
            metric=metric, 
            totalCost=totalCost, 
            unitCost=unitCost, 
            amountPaid=amountPaid, 
            unitPrice=unitPrice,
            created_at=created_at
        )
        db.session.add(inventory)
        db.session.commit()
        
        return {'message': 'Inventory added successfully'}, 201
    
    
class GetAllInventory(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
    
        inventories = Inventory.query.all()

        all_inventory = [{
            "inventory_id": inventory.inventory_id,
            "itemname": inventory.itemname,
            "initial_quantity": inventory.initial_quantity,      # Initial Quantity
            "remaining_quantity": inventory.quantity,             # Remaining Quantity
            "metric": inventory.metric,
            "totalCost": inventory.totalCost,
            "unitCost": inventory.unitCost,
            "amountPaid": inventory.amountPaid,
            "created_at": inventory.created_at.strftime('%Y-%m-%d %H:%M:%S') if inventory.created_at else None,
            "unitPrice": inventory.unitPrice
        } for inventory in inventories]

        return make_response(jsonify(all_inventory), 200)


class InventoryResourceById(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self, inventory_id):

        inventory = Inventory.query.get(inventory_id)
   
        if inventory :
            return {
            "inventory_id": inventory.inventory_id,
            "itemname": inventory.itemname,
            "quantity": inventory.quantity,
            "metric": inventory.metric,
            "totalCost" : inventory.totalCost,
            "unitCost": inventory.unitCost,
            "amountPaid": inventory.amountPaid,
            "created_at": inventory.created_at.strftime('%Y-%m-%d %H:%M:%S') if inventory.created_at else None,
            "unitPrice": inventory.unitPrice
        }, 200
        else:
             return {"error": "Inventory not found"}, 400


    @jwt_required()
    @check_role('manager')
    def put(self, inventory_id):
        inventory = Inventory.query.get(inventory_id)
        if not inventory:
            return {"error": "Item not found"}, 404
        
        data = request.get_json()
        
        # Update the shop's fields
        if 'itemname' in data:
            inventory.itemname = data['itemname']
        if 'quantity' in data:
            inventory.quantity = data['quantity']
        if 'metric' in data:
            inventory.metric = data['metric']
        if 'unitCost' in data:
            inventory.unitCost = data['unitCost']
        if 'totalCost' in data:
            inventory.totalcost = data['totalCost']
        if 'amountPaid' in data:
            inventory.amountPaid = data['amountPaid']
        if 'unitPrice' in data:
            inventory.metric = data['unitPrice']
        
        db.session.commit()
        
        return {"message": "Invemtory updated successfully"}, 200
    

    @jwt_required()
    @check_role('manager')
    def delete(self, inventory_id):

        inventory = Inventory.query.get(inventory_id)
        
        if inventory:
            db.session.delete(inventory)  
            db.session.commit()  
            return {"message": "item deleted successfully"}, 200
        else:
            return {"error": "item not found"}, 404


