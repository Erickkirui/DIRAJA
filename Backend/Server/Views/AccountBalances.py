from flask_restful import Resource
from flask import request, jsonify,make_response
from app import db
from datetime import datetime, timedelta, time
from sqlalchemy import func
from Server.Models.Users import Users
from Server.Models.Sales import Sales
from Server.Models.Shops import Shops
from Server.Models.Paymnetmethods import SalesPaymentMethods
from Server.Models.Transactions import TranscationType
from Server.Models.BankAccounts import BankAccount  # adjust import if needed
from flask_jwt_extended import jwt_required,get_jwt_identity
from functools import wraps
from Server.Models import ChartOfAccounts

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


class TotalBankBalance(Resource):
    def get(self):
        try:
            # Calculate the total balance across all bank accounts
            total_balance = db.session.query(func.sum(BankAccount.Account_Balance)).scalar() or 0.0

            # Round the total balance to two decimal places
            rounded_balance = round(total_balance, 2)

            return jsonify({
                "total_balance": rounded_balance
            })
        except Exception as e:
            # Handle exceptions and rollback if necessary
            db.session.rollback()
            return {"error": str(e)}, 500
        
class PostBankAccount(Resource):
    
    @jwt_required()
    @check_role('manager')
    def post(self):
        data = request.get_json()

        account_name = data.get('Account_name')
        account_balance = data.get('Account_Balance')
        chart_account_id = data.get('chart_account_id')  # ✅ new field

        if not account_name or account_balance is None:
            return {"message": "Account_name and Account_Balance are required."}, 400

        # Check if account already exists
        existing = BankAccount.query.filter_by(Account_name=account_name).first()
        if existing:
            return {"message": "Account with this name already exists."}, 409

        # ✅ Validate chart_account_id if provided
        if chart_account_id:
            chart_account = ChartOfAccounts.query.get(chart_account_id)
            if not chart_account:
                return {"message": "Invalid chart_account_id provided."}, 400
        else:
            chart_account_id = None

        new_account = BankAccount(
            Account_name=account_name,
            Account_Balance=account_balance,
            chart_account_id=chart_account_id  # ✅ save foreign key
        )

        db.session.add(new_account)
        db.session.commit()

        return {
            "message": "Bank account created successfully.",
            "account": {
                "id": new_account.id,
                "Account_name": new_account.Account_name,
                "Account_Balance": new_account.Account_Balance,
                "chart_account_id": new_account.chart_account_id  # ✅ include in response
            }
        }, 201



class GetAllBankAccounts(Resource):
    @jwt_required()
    # @check_role('manager')
    def get(self):
        accounts = BankAccount.query.all()
        result = []

        for account in accounts:
            result.append({
                "id": account.id,
                "Account_name": account.Account_name,
                "Account_Balance": account.Account_Balance,
                "chart_account_id": account.chart_account_id,
                "chart_account_name": account.chart_account.name if account.chart_account else None
            })

        return {"accounts": result}, 200


class DepositToAccount(Resource):
    @jwt_required()
    def put(self, account_id):
        data = request.get_json()
        deposit_amount = data.get("amount")

        if deposit_amount is None or deposit_amount <= 0:
            return {"message": "Valid deposit amount is required."}, 400

        account = BankAccount.query.get(account_id)
        if not account:
            return {"message": "Bank account not found."}, 404

        # Update account balance
        account.Account_Balance += deposit_amount

        # Create transaction record
        transaction = TranscationType(
            Transaction_type="Deposit",
            Transaction_amount=deposit_amount,
            From_account=account.Account_name
        )
        db.session.add(transaction)

        db.session.commit()

        return {
            "message": "Deposit successful.",
            "account": {
                "id": account.id,
                "Account_name": account.Account_name,
                "Account_Balance": account.Account_Balance
            }
        }, 200

    

class BankAccountResource(Resource):
    @jwt_required()
    def get(self, account_id):
        account = BankAccount.query.get(account_id)
        if not account:
            return {"message": "Account not found."}, 404
        
        return {
            "id": account.id,
            "Account_name": account.Account_name,
            "Account_Balance": account.Account_Balance
        }, 200

    @jwt_required()
    def put(self, account_id):
        account = BankAccount.query.get(account_id)
        if not account:
            return {"message": "Account not found."}, 404
        
        data = request.get_json()
        account.Account_name = data.get("Account_name", account.Account_name)
        account.Account_Balance = data.get("Account_Balance", account.Account_Balance)

        db.session.commit()

        return {
            "message": "Account updated successfully.",
            "account": {
                "id": account.id,
                "Account_name": account.Account_name,
                "Account_Balance": account.Account_Balance
            }
        }, 200

    @jwt_required()
    def delete(self, account_id):
        account = BankAccount.query.get(account_id)
        if not account:
            return {"message": "Account not found."}, 404
        
        db.session.delete(account)
        db.session.commit()

        return {"message": "Account deleted successfully."}, 200



class DailySalesDeposit(Resource):
    @jwt_required()
    def post(self, date_str=None):
        try:
            # Parse the date from URL or use today's date
            if date_str:
                try:
                    selected_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                except ValueError:
                    return {"error": "Invalid date format. Use YYYY-MM-DD."}, 400
            else:
                selected_date = datetime.now().date()

            # Define the full calendar day range: 00:00 to 23:59:59
            start_datetime = datetime.combine(selected_date, datetime.min.time())
            end_datetime = start_datetime + timedelta(days=1)

            # Query total payments grouped by shop
            payments = db.session.query(
                Sales.shop_id,
                func.sum(SalesPaymentMethods.amount_paid).label('total_paid')
            ).join(Sales, Sales.sales_id == SalesPaymentMethods.sale_id) \
             .filter(SalesPaymentMethods.created_at >= start_datetime,
                     SalesPaymentMethods.created_at < end_datetime) \
             .group_by(Sales.shop_id).all()

            if not payments:
                return {
                    "message": f"No sales found on {selected_date.strftime('%Y-%m-%d')}"
                }, 404

            # Shop-to-bank mapping (customize as needed)
            shop_to_bank_mapping = {
                1: 12,
                2: 3,
                3: 6,
                4: 2,
                5: 5,
                6: 17,
                7: 15,
                8: 9,
                10: 18,
                11: 8,
                12: 7,
                14: 14,
                16: 13
            }

            deposit_results = []

            for shop_id, total_paid in payments:
                if total_paid <= 0:
                    continue

                bank_id = shop_to_bank_mapping.get(shop_id)
                if not bank_id:
                    continue

                bank_account = BankAccount.query.get(bank_id)
                shop = Shops.query.get(shop_id)

                if not bank_account or not shop:
                    continue

                # Update bank balance
                bank_account.Account_Balance += total_paid

                # Create a transaction record
                debit_tx = TranscationType(
                    Transaction_type="Debit",
                    Transaction_amount=total_paid,
                    From_account=shop.shopname,
                    To_account=bank_account.Account_name  # ✅ Added
                )
                db.session.add(debit_tx)

                deposit_results.append({
                    "shop_id": shop_id,
                    "shop_name": shop.shopname,
                    "bank_account_id": bank_id,
                    "bank_account_name": bank_account.Account_name,
                    "amount_deposited": round(total_paid, 2)
                })

            db.session.commit()

            return {
                "message": "Daily sales deposited successfully (BankingTransaction skipped).",
                "deposits": deposit_results,
                "range": {
                    "from": start_datetime.strftime("%Y-%m-%d %H:%M"),
                    "to": end_datetime.strftime("%Y-%m-%d %H:%M")
                }
            }, 200

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500
