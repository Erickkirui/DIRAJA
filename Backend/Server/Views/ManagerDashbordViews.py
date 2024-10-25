from  flask_restful import Resource
from app import db
from Server.Models.Users import Users
from Server.Models.Shops import Shops
from Server.Models.Sales import Sales
from Server.Models.Employees import Employees
from Server.Models.Expenses import Expenses
from flask_jwt_extended import jwt_required,get_jwt_identity
from functools import wraps
from flask import jsonify,request,make_response

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


class CountEmployees(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        countUsers =Employees.query.count()
        return {"total employees": countUsers}, 200


class TotalAmountPaidSales(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        # Query the total amount paid
        total_amount = db.session.query(db.func.sum(Sales.amount_paid)).scalar() or 0
        
        
        return jsonify({"total_amount_paid": total_amount})
    
class TotalAmountPaidExpenses(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        # Query the total amount paid
        total_amount = db.session.query(db.func.sum(Expenses.amountPaid)).scalar() or 0
        
        
        return jsonify({"total_amount_paid": total_amount})
    

class CountShops(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        countShops = Shops.query.count()
        return {"total shops": countShops}, 200      
         