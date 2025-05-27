from flask_restful import Resource
from flask import request, jsonify
from Server.Models.CashDeposit import CashDeposits
from Server.Models.Users import Users
from Server.Models.Shops import Shops
from app import db
from flask_jwt_extended import jwt_required,get_jwt_identity
from flask import jsonify,request,make_response
from datetime import datetime
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

class AddCashDeposit(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()
        current_user_id = get_jwt_identity()

        shop_id = data.get('shop_id')
        amount = data.get('amount')
        deductions = data.get('deductions', 0)
        reason = data.get('reason')
        created_at = data.get('created_at')

        if not shop_id:
            return {"message": "Shop ID is required."}, 400
        if amount is None or amount <= 0:
            return {"message": "Amount must be greater than 0."}, 400
        if deductions and deductions < 0:
            return {"message": "Deductions cannot be negative."}, 400

        if created_at:
            try:
                created_at = datetime.strptime(created_at, "%Y-%m-%d")
            except ValueError:
                return {"message": "Invalid date format. Use YYYY-MM-DD."}, 400
        else:
            created_at = datetime.utcnow()

        deposit = CashDeposits(
            user_id=current_user_id,
            shop_id=shop_id,
            amount=amount,
            deductions=deductions,
            reason=reason,
            created_at=created_at
        )

        try:
            db.session.add(deposit)

            # 🔼 Update Shop's Account Balance
            from models import ShopAccount  # Ensure correct import
            net_amount = amount - deductions
            account = ShopAccount.query.filter_by(shop_id=shop_id).first()

            if account:
                account.balance += net_amount
            else:
                # If the account doesn't exist, optionally create it
                account = ShopAccount(shop_id=shop_id, balance=net_amount)
                db.session.add(account)

            db.session.commit()

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"message": "Database error", "details": str(e)}, 500

        return {
            "message": "Cash deposit recorded successfully",
            "deposit_id": deposit.deposit_id
        }, 201



class CashDepositResource(Resource):
    @jwt_required()
    @check_role('manager')
    def post(self):
        data = request.get_json()
        current_user_id = get_jwt_identity()

        shop_id = data.get('shop_id')
        amount = data.get('amount')
        deductions = data.get('deductions', 0)
        reason = data.get('reason')

        # Validate required fields
        if not shop_id:
            return {"message": "Shop ID is required."}, 400
        if amount is None or amount <= 0:
            return {"message": "Amount must be a number greater than 0."}, 400
        if deductions is None:
            deductions = 0
        if reason is None or reason.strip() == "":
            return {"message": "Reason is required."}, 400

        created_at_str = data.get('created_at')
        created_at = None
        if created_at_str:
            try:
                created_at = datetime.datetime.strptime(created_at_str, '%Y-%m-%d')
            except ValueError:
                return {"message": "Invalid date format. Use YYYY-MM-DD."}, 400

        new_deposit = CashDeposits(
            user_id=current_user_id,
            shop_id=shop_id,
            amount=amount,
            deductions=deductions,
            reason=reason,
            created_at=created_at or datetime.datetime.utcnow()
        )

        db.session.add(new_deposit)
        db.session.commit()

        return {"message": "Cash deposit added successfully.", "deposit_id": new_deposit.deposit_id}, 201

    @jwt_required()
    @check_role('manager')
    def get(self):
        deposits = CashDeposits.query.order_by(CashDeposits.created_at.desc()).all()
        all_deposits = []

        for deposit in deposits:
            user = Users.query.filter_by(users_id=deposit.user_id).first()
            shop = Shops.query.filter_by(shops_id=deposit.shop_id).first()

            username = user.username if user else "Unknown User"
            shopname = shop.shopname if shop else "Unknown Shop"

            created_at = None
            if deposit.created_at:
                if isinstance(deposit.created_at, str):
                    try:
                        created_at = datetime.datetime.strptime(deposit.created_at, '%Y-%m-%d %H:%M:%S').strftime('%Y-%m-%d %H:%M:%S')
                    except ValueError:
                        created_at = deposit.created_at
                elif isinstance(deposit.created_at, datetime.datetime):
                    created_at = deposit.created_at.strftime('%Y-%m-%d %H:%M:%S')

            all_deposits.append({
                "deposit_id": deposit.deposit_id,
                "user_id": deposit.user_id,
                "username": username,
                "shop_id": deposit.shop_id,
                "shop_name": shopname,
                "amount": deposit.amount,
                "deductions": deposit.deductions,
                "reason": deposit.reason,
                "created_at": created_at
            })

        return make_response(jsonify(all_deposits), 200)

    @jwt_required()
    @check_role('manager')
    def put(self, deposit_id):
        deposit = CashDeposits.query.filter_by(deposit_id=deposit_id).first()
        if not deposit:
            return {"message": "Deposit not found."}, 404

        data = request.get_json()

        shop_id = data.get('shop_id')
        amount = data.get('amount')
        deductions = data.get('deductions')
        reason = data.get('reason')
        created_at_str = data.get('created_at')

        if shop_id:
            deposit.shop_id = shop_id
        if amount is not None:
            if amount <= 0:
                return {"message": "Amount must be greater than 0."}, 400
            deposit.amount = amount
        if deductions is not None:
            deposit.deductions = deductions
        if reason:
            deposit.reason = reason
        if created_at_str:
            try:
                deposit.created_at = datetime.datetime.strptime(created_at_str, '%Y-%m-%d')
            except ValueError:
                return {"message": "Invalid date format. Use YYYY-MM-DD."}, 400

        db.session.commit()

        return {"message": "Cash deposit updated successfully."}, 200

    @jwt_required()
    @check_role('manager')
    def delete(self, deposit_id):
        deposit = CashDeposits.query.filter_by(deposit_id=deposit_id).first()
        if not deposit:
            return {"message": "Deposit not found."}, 404

        db.session.delete(deposit)
        db.session.commit()

        return {"message": "Cash deposit deleted successfully."}, 200
