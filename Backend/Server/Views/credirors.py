from flask_sqlalchemy import SQLAlchemy
from flask import request, jsonify, make_response
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func
import datetime
from Server.Models.Creditors import Creditors
from Server.Models.Users import Users
from Server.Models.Shops import Shops

# Decorator for role checking
def check_role(required_role):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = Users.query.get(current_user_id)
            if user and user.role != required_role:
                return make_response(jsonify({"error": "Unauthorized access"}), 403)
            return fn(*args, **kwargs)
        return decorator
    return wrapper


class CreateCreditor(Resource):
    @jwt_required()
    @check_role('manager')
    def post(self):
        data = request.get_json()

        try:
            new_creditor = Creditors(
                name=data.get("name"),
                shop_id=data.get("shop_id"),
                total_credit=data.get("total_credit", 0.0),
                credit_amount=data.get("credit_amount", 0.0),
                phone_number=data.get("phone_number")  # ✅ Added phone number
            )

            db.session.add(new_creditor)
            db.session.commit()

            return {
                "message": "Creditor created successfully",
                "creditor": {
                    "id": new_creditor.id,
                    "name": new_creditor.name,
                    "shop_id": new_creditor.shop_id,
                    "total_credit": new_creditor.total_credit,
                    "credit_amount": new_creditor.credit_amount,
                    "phone_number": new_creditor.phone_number  # ✅ Include in response
                }
            }, 201

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 400



class CreditorsList(Resource):
    @jwt_required()
    def get(self):
        try:
            creditors = Creditors.query.all()

            creditors_list = []
            for creditor in creditors:
                shop = Shops.query.get(creditor.shop_id)  # ✅ Get the matching shop
                creditors_list.append({
                    "id": creditor.id,
                    "name": creditor.name,
                    "shop_id": creditor.shop_id,
                    "shop_name": shop.shopname if shop else None,  # ✅ Include shop name
                    "total_credit": creditor.total_credit,
                    "credit_amount": creditor.credit_amount,
                    "phone_number": creditor.phone_number  # ✅ Include phone number
                })

            return {
                "creditors": creditors_list,
                "count": len(creditors_list)
            }, 200

        except Exception as e:
            return {"error": str(e)}, 400



class SingleCreditor(Resource):
    @jwt_required()
    def get(self, creditor_id):
        try:
            creditor = Creditors.query.get(creditor_id)
            
            if not creditor:
                return {"error": "Creditor not found"}, 404

            return {
                "creditor": {
                    "id": creditor.id,
                    "name": creditor.name,
                    "phone_number": creditor.phone_number,
                    "shop_id": creditor.shop_id,
                    "shop_name": creditor.shops.shopname if creditor.shops else None,
                    "total_credit": creditor.total_credit,
                    "credit_amount": creditor.credit_amount
                }
            }, 200

        except Exception as e:
            return {"error": str(e)}, 400

    @jwt_required()
    @check_role('manager')
    def put(self, creditor_id):
        data = request.get_json()
        
        try:
            creditor = Creditors.query.get(creditor_id)
            
            if not creditor:
                return {"error": "Creditor not found"}, 404

            if 'name' in data:
                creditor.name = data['name']
            if 'phone_number' in data:
                creditor.phone_number = data['phone_number']
            if 'shop_id' in data:
                creditor.shop_id = data['shop_id']
            if 'total_credit' in data:
                creditor.total_credit = data['total_credit']
            if 'credit_amount' in data:
                creditor.credit_amount = data['credit_amount']

            db.session.commit()

            return {
                "message": "Creditor updated successfully",
                "creditor": {
                    "id": creditor.id,
                    "name": creditor.name,
                    "phone_number": creditor.phone_number,
                    "shop_id": creditor.shop_id,
                    "shop_name": creditor.shops.shopname if creditor.shops else None,
                    "total_credit": creditor.total_credit,
                    "credit_amount": creditor.credit_amount
                }
            }, 200

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 400

    @jwt_required()
    @check_role('manager')
    def delete(self, creditor_id):
        try:
            creditor = Creditors.query.get(creditor_id)
            
            if not creditor:
                return {"error": "Creditor not found"}, 404

            db.session.delete(creditor)
            db.session.commit()

            return {
                "message": "Creditor deleted successfully"
            }, 200

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 400


class CreditorsByShop(Resource):
    @jwt_required()
    def get(self, shop_id):
        try:
            creditors = Creditors.query.filter_by(shop_id=shop_id).all()

            if not creditors:
                return {
                    "message": "No creditors found for this shop.",
                    "creditors": [],
                    "count": 0
                }, 200

            creditors_list = []
            for creditor in creditors:
                creditors_list.append({
                    "id": creditor.id,
                    "name": creditor.name,
                    "shop_id": creditor.shop_id,
                    "total_credit": creditor.total_credit,
                    "credit_amount": creditor.credit_amount,
                    "phone_number": creditor.phone_number
                })

            return {
                "creditors": creditors_list,
                "count": len(creditors_list)
            }, 200

        except Exception as e:
            return {"error": str(e)}, 400
