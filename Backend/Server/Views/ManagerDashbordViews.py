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
from datetime import datetime, timedelta

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
        # Get the period parameter to filter results
        period = request.args.get('period', 'today')
        today = datetime.utcnow()

        # Set the start date based on the selected period
        if period == 'today':
            start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)  # Beginning of today
        elif period == 'week':
            start_date = today - timedelta(days=7)
        elif period == 'month':
            start_date = today - timedelta(days=30)
        else:
            return {"message": "Invalid period specified"}, 400

        # Query the sum of amount_paid where created_at >= start_date
        total_amount = (
            db.session.query(db.func.sum(Sales.amount_paid))
            .filter(Sales.created_at >= start_date)
            .scalar() or 0
        )

        return {"total_amount_paid": total_amount}, 200
    

class TotalAmountPaidExpenses(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        period = request.args.get('period', 'today')
        today = datetime.utcnow()
        
        # Set the start date based on the requested period
        if period == 'today':
            start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)  # Beginning of today
        elif period == 'week':
            start_date = today - timedelta(days=7)
        elif period == 'month':
            start_date = today - timedelta(days=30)
        else:
            return {"message": "Invalid period specified"}, 400

        # Query for the sum of `amountPaid` from `Expenses` where `created_at` >= `start_date`
        total_amount = (
            db.session.query(db.func.sum(Expenses.amountPaid))
            .filter(Expenses.created_at >= start_date)
            .scalar() or 0
        )
        
        return {"total_amount_paid": total_amount}, 200
    


class CountShops(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        countShops = Shops.query.count()
        return {"total shops": countShops}, 200      
         