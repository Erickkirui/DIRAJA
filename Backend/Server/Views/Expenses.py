from  flask_restful import Resource
from Server.Models.Expenses import Expenses
from app import db
from flask_jwt_extended import jwt_required,get_jwt_identity
from flask import jsonify,request,make_response
from datetime import datetime

class AddExpence(Resource):
    
    @jwt_required()
    def post(self):
        data = request.get_json()

        current_user_id = get_jwt_identity() 

        shop_id = data.get('shop_id')
        item = data.get('item')
        description = data.get('description')
        quantity = data.get('quantity')
        totalPrice = data.get('totalPrice')
        amountPaid = data.get('amountPaid')

        # Convert the 'created_at' string to a datetime object
        created_at = data.get('created_at')
        if created_at:
            created_at = datetime.strptime(created_at, '%Y-%m-%d')

        newexpence = Expenses(
            shop_id=shop_id,
            item=item,
            description=description,
            quantity=quantity,
            totalPrice=totalPrice,
            amountPaid=amountPaid,
            created_at=created_at,
            user_id=current_user_id
        )

        db.session.add(newexpence)
        db.session.commit()

        return {"message": "Expense added successfully"}, 201




class AllExpenses(Resource):
    
    @jwt_required()
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
    

class GetShopExpenses(Resource):
    @jwt_required()
    def get(self, shop_id):

        shopExpenses= Expenses.query.filter_by(shop_id=shop_id).all()

        expensesForShop = [{
            
            "expense_id " : expense.expense_id ,
            "user_id": expense.user_id,
            "shop_id" :expense.shop_id,
            "item":expense.item,
            "description" : expense.description,
            "quantity" : expense.quantity,
            "totalPrice" : expense.totalPrice,
            "amountPaid" : expense.amountPaid,
            "created_at" : expense.created_at

        } for expense in shopExpenses]

        return make_response(jsonify(expensesForShop), 200)


    



