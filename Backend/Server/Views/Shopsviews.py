from  flask_restful import Resource
from Server.Models.Shops import Shops
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


   
        

        
        
