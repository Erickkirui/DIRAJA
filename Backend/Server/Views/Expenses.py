from  flask_restful import Resource
from Server.Models.Expenses import Expenses
from Server.Models.ExpenseCategories import ExpenseCategory
from Server.Models.Users import Users
from Server.Models.Shops import Shops
from Server.Utils import get_expenses_filtered, serialize_expenses
from app import db
from flask_jwt_extended import jwt_required,get_jwt_identity
from flask import jsonify,request,make_response
from datetime import datetime
from functools import wraps

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

class AddExpence(Resource):
    @jwt_required()
    @check_role('manager')
    def post(self):
        data = request.get_json()

        current_user_id = get_jwt_identity() 

        shop_id = data.get('shop_id')
        item = data.get('item')
        description = data.get('description')
        quantity = data.get('quantity')
        category_name = data.get('categoryname')  # Get the category name or identifier
        totalPrice = data.get('totalPrice')
        amountPaid = data.get('amountPaid')

        # Convert the 'created_at' String to a datetime object
        created_at = data.get('created_at')
        if created_at:
            created_at = datetime.strptime(created_at, '%Y-%m-%d')

        # Fetch the category_id based on category name (or other criteria)
        category = ExpenseCategory.query.filter_by(categoryname=category_name).first()

        if category:
            category_id = category.category_id
        else:
            return {"error": "Category not found"}, 400

        new_expense = Expenses(
            shop_id=shop_id,
            item=item,
            description=description,
            quantity=quantity,
            category_id=category_id,  # Use category_id instead of category
            totalPrice=totalPrice,
            amountPaid=amountPaid,
            created_at=created_at,
            user_id=current_user_id
        )

        db.session.add(new_expense)
        db.session.commit()

        return {"message": "Expense added successfully"}, 201



class AllExpenses(Resource):
    
    @jwt_required()
    @check_role('manager')
    def get(self):
        expenses = Expenses.query.all()

        all_expenses = []
        
        for expense in expenses:
            # Fetch username and shop name manually using user_id and shop_id
            user = Users.query.filter_by(users_id=expense.user_id).first()
            shop = Shops.query.filter_by(shops_id=expense.shop_id).first()
            category = ExpenseCategory.query.filter_by(category_id=expense.category_id).first()

            # Handle cases where user or shop may not be found
            username = user.username if user else "Unknown User"
            shopname = shop.shopname if shop else "Unknown Shop"
            expensecategory = category.expensecategory if category else "Unknown Category"

            # Append the data
            all_expenses.append({
                "expense_id": expense.expense_id,
                "user_id": expense.user_id,
                "username": username,  # Manually fetched username
                "shop_id": expense.shop_id,
                "shop_name": shopname,  # Manually fetched shop name
                "item": expense.item,
                "description": expense.description,
                "quantity": expense.quantity,
                "category": expensecategory,
                "totalPrice": expense.totalPrice,
                "amountPaid": expense.amountPaid,
                "created_at": expense.created_at
            })

        return make_response(jsonify(all_expenses), 200)
    

class GetShopExpenses(Resource):
    
    @jwt_required()
    @check_role('manager')

    def get(self, shop_id):

        shopExpenses= Expenses.query.filter_by(shop_id=shop_id).all()

        expensesForShop = [{
            
            "expense_id " : expense.expense_id ,
            "user_id": expense.user_id,
            "shop_id" :expense.shop_id,
            "item":expense.item,
            "description" : expense.description,
            "category_id": expense.category_id,
            "quantity" : expense.quantity,
            "totalPrice" : expense.totalPrice,
            "amountPaid" : expense.amountPaid,
            "created_at" : expense.created_at

        } for expense in shopExpenses]

        return make_response(jsonify(expensesForShop), 200)
    


class ExpensesResources(Resource):
    
    @jwt_required()
    @check_role('manager')

    def get(self, expense_id):
        # Fetch the specific expense by ID
        expense = Expenses.query.get(expense_id)

        if expense:
            return {
                "expense_id": expense.expense_id,
                "user_id": expense.user_id,
                "shop_id": expense.shop_id,
                "item": expense.item,
                "description": expense.description,
                "category_id": expense.category_id,
                "quantity": expense.quantity,
                "totalPrice": expense.totalPrice,
                "amountPaid": expense.amountPaid,
                # Convert datetime object to String
                "created_at": expense.created_at.strftime('%Y-%m-%d %H:%M:%S') if expense.created_at else None
            }, 200
        else:
            return {"error": "Expense not found"}, 404

   
    @jwt_required()
    @check_role('manager')
    def delete(self, expense_id):
        # Fetch the specific expense by ID
        expense = Expenses.query.get(expense_id)

        if expense:
            # Delete the expense
            db.session.delete(expense)
            db.session.commit()

            return {"message": "Expense deleted successfully"}, 200
        else:
            return {"error": "Expense not found"}, 404
        
      
    @jwt_required()
    @check_role('manager')
    def put(self, expense_id):
        # Get the data from the request to update the expense
        data = request.get_json()

        # Fetch the specific expense by ID
        expense = Expenses.query.get(expense_id)

        if expense:
            # Update the expense with the provided data
            expense.item = data.get('item', expense.item)
            expense.description = data.get('description', expense.description)
            expense.category = data.get('category', expense.category)
            expense.quantity = data.get('quantity', expense.quantity)
            expense.totalPrice = data.get('totalPrice', expense.totalPrice)
            expense.amountPaid = data.get('amountPaid', expense.amountPaid)
            
            # Convert created_at from String to datetime, handling both formats
            if 'created_at' in data:
                try:
                    # Try parsing the full datetime first
                    expense.created_at = datetime.strptime(data['created_at'], '%Y-%m-%d %H:%M:%S')
                except ValueError:
                    # If only the date is provided, parse as date
                    expense.created_at = datetime.strptime(data['created_at'], '%Y-%m-%d')

            # Commit the changes to the database
            db.session.commit()

            return {"message": "Expense updated successfully"}, 200
        else:
            return {"error": "Expense not found"}, 404
        