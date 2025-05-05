from  flask_restful import Resource
from Server.Models.Expenses import Expenses
from Server.Models.Users import Users
from Server.Models.Shops import Shops
from Server.Models.BankAccounts import BankAccount, BankingTransaction
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
        current_user_id = get_jwt_identity()

        shop_id = data.get('shop_id')
        item = data.get('item')
        description = data.get('description')
        quantity = data.get('quantity')
        category = data.get('category')
        totalPrice = data.get('totalPrice')
        amountPaid = data.get('amountPaid')
        paidTo = data.get('paidTo')
        source = data.get('source')  # e.g. "Cash" or "Sasapay"
        paymentRef = data.get('paymentRef')
        comments = data.get('comments')

        # ✅ Validate required fields individually with custom messages
        if not shop_id:
            return {"message": "Shop ID is required."}, 400
        if not category:
            return {"message": "Category is required."}, 400
        if not source:
            return {"message": "Payment source (e.g. 'Cash' or 'Sasapay') is required."}, 400
        if not paymentRef:
            return {"message": "Payment reference (paymentRef) is required."}, 400

        if quantity is None or quantity <= 0:
            return {"message": "Quantity must be a valid number greater than 0."}, 400
        if totalPrice is None or totalPrice <= 0:
            return {"message": "Total Price must be a valid number greater than 0."}, 400
        if amountPaid is None or amountPaid <= 0:
            return {"message": "Amount Paid must be a valid number greater than 0."}, 400

        created_at = data.get('created_at')
        if created_at:
            try:
                created_at = datetime.strptime(created_at, '%Y-%m-%d')
            except ValueError:
                return {"message": "Invalid date format. Use YYYY-MM-DD."}, 400

        # Step 1: Fetch account
        account = BankAccount.query.filter_by(Account_name=source).first()
        if not account:
            return {"message": f"Account '{source}' not found."}, 404

        # Step 2: Check balance (optional)
        # if account.Account_Balance < amountPaid:
        #     return {"message": f"Insufficient funds in '{source}' account."}, 400

        # Step 3: Deduct amount
        account.Account_Balance -= amountPaid

        # Step 4: Log transaction
        transaction = BankingTransaction(
            account_id=account.id,
            Transaction_type_debit=amountPaid,
            Transaction_type_credit=None
        )

        # Step 5: Create expense
        new_expense = Expenses(
            shop_id=shop_id,
            item=item,
            description=description,
            quantity=quantity,
            category=category,
            totalPrice=totalPrice,
            amountPaid=amountPaid,
            paidTo=paidTo,
            created_at=created_at or datetime.utcnow(),
            user_id=current_user_id,
            source=source,
            paymentRef=paymentRef,
            comments=comments
        )

        try:
            db.session.add(new_expense)
            db.session.add(transaction)
            db.session.commit()
            return {"message": "Expense added and account updated successfully"}, 201
        except Exception as e:
            db.session.rollback()
            return {"message": "Failed to add expense", "error": str(e)}, 500



class AllExpenses(Resource):

    @jwt_required()
    @check_role('manager')
    def get(self):
        # Fetch all expenses ordered by 'created_at' in descending order
        expenses = Expenses.query.order_by(Expenses.created_at.desc()).all()
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
                "source": expense.source,
                "paymentRef": expense.paymentRef,
                "comments": expense.comments  
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
            "paymentRef": expense.paymentRef,
            "comments": expense.comments,
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
                "paymentRef": expense.paymentRef,
                "comments": expense.comments,
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
                expense.source = data.get('source', expense.source)
                expense.paymentRef = data.get('paymentRef', expense.paymentRef)
                expense.comments = data.get('comments', expense.comments)  # New comments column

                # Convert created_at from String to datetime if provided
                if 'created_at' in data:
                    try:
                        expense.created_at = datetime.strptime(data['created_at'], '%Y-%m-%d %H:%M:%S')
                    except ValueError:
                        expense.created_at = datetime.strptime(data['created_at'], '%Y-%m-%d')

                # Commit the changes to the database
                db.session.commit()

                return {"message": "Expense updated successfully"}, 200

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
