from  flask_restful import Resource
from Server.Models.Expenses import Expenses
from app import db
from flask_jwt_extended import jwt_required,get_jwt_identity
from flask import jsonify,request,make_response



class AllExpenses(Resource):

    def get(self):

        expenses = Expenses.query.all()

        all_expenses = [{
            "expense_id " : expense.expense_id ,
            "user_id": expense.user_id,
            "shop_id" :expense.shop_id,
            "item":expense.item,
            "description" : expense.description,
            "quantity" : expense.quantity,
            "totalPrice" : expense.totalPrice,
            "amountPaid" : expense.amountPaid,
            "created_at" : expense.created_at

        } for expense in expenses]

        return make_response(jsonify(all_expenses), 200)
    
    