from  flask_restful import Resource
from Server.Models.Shops import Shops
from app import db
from flask import request


class AddShops(Resource):
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


   
        

        
        
