from  flask_restful import Resource
from Server.Models.Inventory import Inventory
from Server.Models.Users import Users
from app import db
from functools import wraps
from flask import request,make_response,jsonify
from flask_jwt_extended import jwt_required,get_jwt_identity

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

class AddInventory(Resource):
    
    # @jwt_required
    # @check_role('manager')
    def post (self):
        data = request.get_json()
        
        
        if 'itemname' not in data or 'quantity'  not in data or 'metric' not in data or 'unitCost' not in data  or 'totalCost' not in data or 'amountPaid' not in data or 'unitPrice' not in data:
            return {'message': 'Missing itemname, quantity, metric, unitcost, amountpaid or unitprice'}, 400
    
        itemname = data.get('itemname')
        quantity = data.get('quantity') 
        metric =  data.get('metric')
        totalCost = data.get('totalCost')
        unitCost = data.get('unitCost')
        amountPaid = data.get('amountPaid')
        unitPrice = data.get('unitPrice')
        
        inventory = Inventory(itemname=itemname, quantity=quantity, metric=metric, totalCost=totalCost, unitCost=unitCost, amountPaid=amountPaid, unitPrice=unitPrice)
        db.session.add(inventory)
        db.session.commit()
        
        return {'message': 'Inventory added successfully'}, 201
    
class GetAllInventory(Resource):
    # @jwt_required
    def get(self):
        inventories = Inventory.query.all()

        all_inventory = [{

            "inventory_id": inventory.inventory_id,
            "itemname": inventory.itemname,
            "quantity": inventory.quantity,
            "metric": inventory.metric,
            "totalCost" : inventory.totalCost,
            "unitCost": inventory.unitCost,
            "amountPaid": inventory.amountPaid,
            "unitPrice": inventory.unitPrice
            
        } for inventory in inventories]

        return make_response(jsonify(all_inventory), 200)
    
class InventoryResourceByName(Resource):
    def get(self, itemname):

        inventory = Inventory.query.filter_by(itemname=itemname).first()

   
        if inventory :
            return {
            "inventory_id": inventory.inventory_id,
            "itemname": inventory.itemname,
            "quantity": inventory.quantity,
            "metric": inventory.metric,
            "totalCost" : inventory.totalCost,
            "unitCost": inventory.unitCost,
            "amountPaid": inventory.amountPaid,
            "unitPrice": inventory.unitPrice
        }, 200
        else:
             return {"error": "Inventory not found"}, 400
         
    def put(self, itemname):
        inventory = Inventory.query.filter_by(itemname=itemname).first()
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
    
    def delete(self, itemname):

        inventory = Inventory.query.filter_by(itemname=itemname).first()
        
        if inventory:
            db.session.delete(inventory)  
            db.session.commit()  
            return {"message": "item deleted successfully"}, 200
        else:
            return {"error": "item not found"}, 404