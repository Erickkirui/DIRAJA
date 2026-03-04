from  flask_restful import Resource
from Server.Models.Expenses import Expenses
from Server.Models.Users import Users
from Server.Models.Accounting.ExpensesLedger import ExpensesLedger
from Server.Models.Shops import Shops
from Server.Models.ExpenseCategory import ExpenseCategory
from Server.Models.BankAccounts import BankAccount, BankingTransaction
from app import db
from flask_jwt_extended import jwt_required,get_jwt_identity
from flask import jsonify,request,make_response
from datetime import datetime
from sqlalchemy import and_
from math import ceil
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
        source = data.get('source')
        paymentRef = data.get('paymentRef')
        comments = data.get('comments')
        created_at_str = data.get('created_at')

        # ===== Validations =====
        if not shop_id or not category or not source or not paymentRef:
            return {"message": "Missing required fields"}, 400

        if quantity is None or quantity <= 0:
            return {"message": "Invalid quantity"}, 400

        if totalPrice is None or totalPrice <= 0:
            return {"message": "Invalid total price"}, 400

        if amountPaid is None or amountPaid <= 0:
            return {"message": "Invalid amount paid"}, 400

        try:
            created_at = datetime.strptime(created_at_str, "%Y-%m-%d")
        except:
            return {"message": "Invalid date format. Use YYYY-MM-DD."}, 400

        try:
            # ===== Step 1: Handle Bank Deduction =====
            if source not in ["External funding"]:
                account = BankAccount.query.filter_by(Account_name=source).first()
                if not account:
                    return {"message": f"Bank account '{source}' not found"}, 404

                account.Account_Balance -= amountPaid
                db.session.add(account)

                transaction = BankingTransaction(
                    account_id=account.id,
                    Transaction_type_debit=amountPaid,
                    Transaction_type_credit=None
                )
                db.session.add(transaction)

            # ===== Step 2: Create Expense =====
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
                source=source,
                paymentRef=paymentRef,
                comments=comments
            )

            db.session.add(new_expense)
            db.session.commit()  # commit expense first

            # ===== Step 3: Post Journal =====
            from Server.Views.Services.journal_service import ExpensesJournalService

            try:
                journal_result = ExpensesJournalService.post_expense_journal(new_expense)
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                return {
                    "message": "Expense saved but journal posting failed",
                    "error": str(e),
                    "expense_id": new_expense.expense_id
                }, 500

            return {
                "message": "Expense and journal entry added successfully",
                "expense_id": new_expense.expense_id,
                "journal_entry": journal_result
            }, 201

        except Exception as e:
            db.session.rollback()
            return {"message": "Error adding expense", "error": str(e)}, 500



class AllExpenses(Resource):

    @jwt_required()
    @check_role('manager')
    def get(self):
        # Query parameters
        page = request.args.get('page', 1, type=int)
        per_page = 50
        category = request.args.get('category', type=str)
        shopname = request.args.get('shopname', type=str)
        start_date = request.args.get('start_date', type=str)
        end_date = request.args.get('end_date', type=str)

        # Base query
        query = Expenses.query

        # Apply filters if provided
        filters = []
        if category:
            filters.append(Expenses.category.ilike(f"%{category}%"))

        if shopname:
            # Join with Shops table to filter by shopname
            query = query.join(Shops, Expenses.shop_id == Shops.shops_id)
            filters.append(Shops.shopname.ilike(f"%{shopname}%"))

        if start_date and end_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d')
                end = datetime.strptime(end_date, '%Y-%m-%d')
                filters.append(Expenses.created_at.between(start, end))
            except ValueError:
                return make_response(jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400)

        if filters:
            query = query.filter(and_(*filters))

        # Order by latest
        query = query.order_by(Expenses.created_at.desc())

        # Pagination
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        expenses = pagination.items

        all_expenses = []
        for expense in expenses:
            user = Users.query.filter_by(users_id=expense.user_id).first()
            shop = Shops.query.filter_by(shops_id=expense.shop_id).first()

            username = user.username if user else "Unknown User"
            shopname = shop.shopname if shop else "Unknown Shop"

            balance = max(expense.totalPrice - expense.amountPaid, 0)

            # Format created_at
            created_at = None
            if expense.created_at:
                if isinstance(expense.created_at, str):
                    try:
                        created_at = datetime.strptime(expense.created_at, '%Y-%m-%d %H:%M:%S').strftime('%Y-%m-%d %H:%M:%S')
                    except ValueError:
                        created_at = expense.created_at
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

        # Pagination metadata
        pagination_info = {
            "page": page,
            "per_page": per_page,
            "total_items": pagination.total,
            "total_pages": ceil(pagination.total / per_page),
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev,
        }

        return make_response(jsonify({
            "expenses": all_expenses,
            "pagination": pagination_info
        }), 200)


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
    def put(self, expense_id):

        data = request.get_json()
        expense = Expenses.query.get(expense_id)

        if not expense:
            return {"error": "Expense not found"}, 404

        # Store old values for comparison
        old_amount = expense.totalPrice
        old_category = expense.category
        old_date = expense.created_at

        # ------------------------
        # Update Expense Fields
        # ------------------------

        expense.item = data.get('item', expense.item)
        expense.description = data.get('description', expense.description)
        expense.category = data.get('category', expense.category)
        expense.quantity = data.get('quantity', expense.quantity)
        expense.totalPrice = data.get('totalPrice', expense.totalPrice)
        expense.amountPaid = data.get('amountPaid', expense.amountPaid)
        expense.paidTo = data.get('paidTo', expense.paidTo)
        expense.source = data.get('source', expense.source)
        expense.paymentRef = data.get('paymentRef', expense.paymentRef)
        expense.comments = data.get('comments', expense.comments)

        # Handle date update
        if 'created_at' in data:
            try:
                expense.created_at = datetime.strptime(
                    data['created_at'], '%Y-%m-%d %H:%M:%S'
                )
            except ValueError:
                expense.created_at = datetime.strptime(
                    data['created_at'], '%Y-%m-%d'
                )

        # -----------------------------------
        # Update Related Ledger Entries
        # -----------------------------------

        ledger_entries = ExpensesLedger.query.filter_by(
            expense_id=expense_id
        ).all()

        for ledger in ledger_entries:

            # 🔹 Update amount if changed
            if expense.totalPrice != old_amount:
                ledger.amount = expense.totalPrice

            # 🔹 Update date if changed
            if expense.created_at != old_date:
                ledger.created_at = expense.created_at

            # 🔹 Update category if changed
            if expense.category != old_category:

                # get new category object
                category_obj = ExpenseCategory.query.filter_by(
                    name=expense.category
                ).first()

                if category_obj:
                    ledger.category_id = category_obj.id

                    # 🔥 If your category controls accounts, update accounts too
                    ledger.debit_account_id = category_obj.debit_account_id
                    ledger.credit_account_id = category_obj.credit_account_id

        db.session.commit()

        return {"message": "Expense and ledger updated successfully"}, 200
    
    @jwt_required()
    @check_role('manager')
    def delete(self, expense_id):

        expense = Expenses.query.get(expense_id)

        if not expense:
            return {"error": "Expense not found"}, 404

        # 🔥 Delete related ledger entries first
        ExpensesLedger.query.filter_by(expense_id=expense_id).delete()

        # Then delete expense
        db.session.delete(expense)
        db.session.commit()

        return {"message": "Expense and related ledger deleted successfully"}, 200




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
