from  flask_restful import Resource
from Server.Models.Bank import Bank
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

class AddBank(Resource):
    
    @jwt_required
    @check_role('manager')
    def post (self):
        data = request.get_json()
        
        
        if 'bankname' not in data or 'accountnumber'  not in data:
            return {'message': 'Missing bankname or accountnumber'}, 400
    
        bankname = data.get('bankname')
        accountnumber = data.get('accountnumber') 
        
        
        # Check if shop already exists
        if Bank.query.filter_by(accountnumber=accountnumber).first():
            return {'message': 'Account already exists'}, 400

        bank = Bank(bankname=bankname,accountnumber=accountnumber)
        db.session.add(bank)
        db.session.commit()
        
        return {'message': 'Bank added successfully'}, 201
    
class BankResourceById(Resource):
    def get(self, bank_id):

        bank = Bank.query.get(bank_id)
   
        if bank :
            return {
            "bank_id": bank.bank_id,
            "bankname": bank.bankname,
            "accountnumber": bank.accountnumber
        }, 200
        else:
             return {"error": "Bank not found"}, 400
         
         
    def delete(self, bank_id):

        bank = Bank.query.get(bank_id)
        
        if bank:
            db.session.delete(bank)  
            db.session.commit()  
            return {"message": "Bank deleted successfully"}, 200
        else:
            return {"error": "Bank not found"}, 404