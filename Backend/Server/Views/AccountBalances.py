from flask_restful import Resource
from flask import request, jsonify,make_response
from app import db
from Server.Models.Users import Users
from Server.Models.BankAccounts import BankAccount  # adjust import if needed
from flask_jwt_extended import jwt_required,get_jwt_identity
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


class PostBankAccount(Resource):
    
    @jwt_required()
    @check_role('manager')
    def post(self):
        data = request.get_json()

        account_name = data.get('Account_name')
        account_balance = data.get('Account_Balance')

        if not account_name or account_balance is None:
            return {"message": "Account_name and Account_Balance are required."}, 400

        # Check if account already exists
        existing = BankAccount.query.filter_by(Account_name=account_name).first()
        if existing:
            return {"message": "Account with this name already exists."}, 409

        new_account = BankAccount(
            Account_name=account_name,
            Account_Balance=account_balance
        )

        db.session.add(new_account)
        db.session.commit()

        return {
            "message": "Bank account created successfully.",
            "account": {
                "id": new_account.id,
                "Account_name": new_account.Account_name,
                "Account_Balance": new_account.Account_Balance
            }
        }, 201


class GetAllBankAccounts(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        accounts = BankAccount.query.all()
        result = []

        for account in accounts:
            result.append({
                "id": account.id,
                "Account_name": account.Account_name,
                "Account_Balance": account.Account_Balance
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

        account.Account_Balance += deposit_amount
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