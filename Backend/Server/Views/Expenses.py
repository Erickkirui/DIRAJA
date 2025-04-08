from  flask_restful import Resource
from Server.Models.Expenses import Expenses
from Server.Models.Users import Users
from Server.Models.Shops import Shops
from app import db
from flask_jwt_extended import jwt_required,get_jwt_identity
from flask import jsonify,request,make_response
from datetime import datetime
from functools import wraps
from sqlalchemy.exc import SQLAlchemyError

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

class AddExpense(Resource):
    @jwt_required()
    @check_role('manager')
    def post(self):
        data = request.get_json()

        # Extract necessary fields from the incoming request data
        current_user_id = get_jwt_identity()

        shop_id = data.get('shop_id')
        item = data.get('item')
        description = data.get('description')
        quantity = data.get('quantity')
        category = data.get('category')  # Accepting the category from the request
        totalPrice = data.get('totalPrice')
        amountPaid = data.get('amountPaid')
        paidTo = data.get('paidTo')
        source = data.get('source')  # Accepting the source of funds from the request

        # Validate the 'source' field
        valid_sources = {
            "Shop Tills",
            "Petty Cash - 011 64 (0) 0393 held by Momanyi",
            "Bank (Standard Chartered Account number 0102488954500)",
            "Leonard Sasapay (account: 254711592002)"
        }

        if source not in valid_sources:
            return {"message": f"Invalid source: {source}. Must be one of {valid_sources}"}, 400

        # Convert the 'created_at' string to a datetime object
        created_at = data.get('created_at')
        if created_at:
            created_at = datetime.strptime(created_at, '%Y-%m-%d')

        # Create a new expense entry
        new_expense = Expenses(
            shop_id=shop_id,
            item=item,
            description=description,
            quantity=quantity,
            category=category,
            totalPrice=totalPrice,
            amountPaid=amountPaid,
            paidTo=paidTo,
            created_at=created_at,
            user_id=current_user_id,
            source=source  # Add the source of funds to the expense entry
        )

        # Add the new expense to the database and commit the transaction
        db.session.add(new_expense)
        db.session.commit()

        # Return success message
        return {"message": "Expense added successfully"}, 201




class AllExpenses(Resource):

    @jwt_required()
    @check_role('manager')
    def get(self):
        expenses = Expenses.query.all()
        all_expenses = []

        for expense in expenses:
            user = Users.query.filter_by(users_id=expense.user_id).first()
            shop = Shops.query.filter_by(shops_id=expense.shop_id).first()

            username = user.username if user else "Unknown User"
            shopname = shop.shopname if shop else "Unknown Shop"

            balance = max(expense.totalPrice - expense.amountPaid, 0)

            # Ensure created_at is correctly formatted
            created_at = None
            if expense.created_at:
                if isinstance(expense.created_at, str):
                    try:
                        created_at = datetime.strptime(expense.created_at, '%Y-%m-%d %H:%M:%S').strftime('%Y-%m-%d %H:%M:%S')
                    except ValueError:
                        created_at = expense.created_at  # Keep it as it is if parsing fails
                elif isinstance(expense.created_at, datetime):
                    created_at = expense.created_at.strftime('%Y-%m-%d %H:%M:%S')

            all_expenses.append({
                "expense_id": expense.expense_id,
                "user_id": expense.user_id,
                "username": username,
                "shop_id": expense.shop_id,
                "shop_name": shopname,
                "item": expense.item,
                "description": expense.description,
                "quantity": expense.quantity,
                "category": expense.category,
                "totalPrice": expense.totalPrice,
                "amountPaid": expense.amountPaid,
                "balance": balance,
                "paidTo": expense.paidTo,
                "created_at": created_at,
                "source": expense.source  
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
            "category": expense.category,
            "quantity" : expense.quantity,
            "totalPrice" : expense.totalPrice,
            "amountPaid" : expense.amountPaid,
            "paidTo": expense.paidTo,
            "source": expense.source,
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
                "category": expense.category,
                "quantity": expense.quantity,
                "totalPrice": expense.totalPrice,
                "paidTo": expense.paidTo,
                "amountPaid": expense.amountPaid,
                "source": expense.source,
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
    class UpdateExpense(Resource):
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
                expense.paidTo = data.get('paidTo', expense.paidTo)

                # Update the 'source' field
                source = data.get('source')
                if source:
                    valid_sources = {
                        "Shop Tills",
                        "Petty Cash - 011 64 (0) 0393 held by Momanyi",
                        "Bank (Standard Chartered Account number 0102488954500)",
                        "Leonard Sasapay (account: 254711592002)"
                    }
                    if source not in valid_sources:
                        return {"message": f"Invalid source: {source}. Must be one of {valid_sources}"}, 400
                    expense.source = source

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



class TotalBalance(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        try:
            # Get start_date and end_date from query parameters
            start_date_str = request.args.get('start_date')
            end_date_str = request.args.get('end_date')

            # Convert date strings to datetime objects if provided
            start_date = datetime.strptime(start_date_str.strip(), '%Y-%m-%d') if start_date_str else None
            end_date = datetime.strptime(end_date_str.strip(), '%Y-%m-%d') if end_date_str else None

            # Query expenses, possibly filtering by date range using created_at
            query = Expenses.query
            if start_date:
                query = query.filter(Expenses.created_at >= start_date)
            if end_date:
                query = query.filter(Expenses.created_at <= end_date)

            expenses = query.all()

            # Calculate the total balance
            total_balance = sum(max(expense.totalPrice - expense.amountPaid, 0) for expense in expenses)

            # Return the total balance
            return make_response(jsonify({"total_balance": total_balance}), 200)

        except SQLAlchemyError as e:
            db.session.rollback()
            return make_response(jsonify({"error": "Database error occurred", "details": str(e)}), 500)
        except Exception as e:
            return make_response(jsonify({"error": "An unexpected error occurred", "details": str(e)}), 500)
