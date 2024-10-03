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
    
    @jwt_required
    @check_role('manager')
    def post (self):
        data = request.get_json()
        
        
        if 'itemname' not in data or 'quantity'  not in data or 'metric' not in data or 'unitCost' not in data or 'amountPaid' not in data or 'unitPrice' not in data:
            return {'message': 'Missing itemname, quantity, metric, unitcost, amountpaid or unitprice'}, 400
    
        itemname = data.get('itemname')
        quantity = data.get('quantity') 
        metric =  data.get('metric')
        unitCost = data.get('unitCost')
        amountPaid = data.get('amountPaid')
        unitPrice = data.get('unitPrice')
        

        inventory = Inventory(itemname=itemname, quantity=quantity, metric=metric, unitCost=unitCost, amountPaid=amountPaid, unitPrice=unitPrice)
        db.session.add(inventory)
        db.session.commit()
        
        return {'message': 'Inventory added successfully'}, 201