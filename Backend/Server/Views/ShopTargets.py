from flask_restful import Resource
from flask import request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from functools import wraps

from app import db
from Server.Models.Users import Users
from Server.Models.ShopTargets import ShopTargets

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



class PostShopTarget(Resource):

    @jwt_required()
    @check_role('manager')
    def post(self):
        data = request.get_json()

        shop_id = data.get("shop_id")
        target_type = data.get("target_type")
        target_amount = data.get("target_amount")
        start_date = data.get("start_date")
        end_date = data.get("end_date")

        if not shop_id:
            return {"message": "shop_id is required."}, 400

        if not target_type:
            return {"message": "target_type is required."}, 400

        if target_amount is None:
            return {"message": "target_amount is required."}, 400

        if not start_date or not end_date:
            return {"message": "start_date and end_date are required."}, 400

        try:
            target_amount = float(target_amount)
        except ValueError:
            return {"message": "target_amount must be a number."}, 400

        try:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            return {"message": "Dates must be in YYYY-MM-DD format."}, 400

        current_user_id = get_jwt_identity()
        user = Users.query.get(current_user_id)

        if not user:
            return {"message": "User not found."}, 404

        target = ShopTargets(
            shop_id=shop_id,
            target_type=target_type,
            target_amount=target_amount,
            current_sales=0.0,
            start_date=start_date,
            end_date=end_date,
            assigned_by_user_id=user.users_id,
            assigned_by_name=user.username
        )

        db.session.add(target)
        db.session.commit()

        return {
            "message": "Shop target created successfully.",
            "shop_target": {
                "id": target.id,
                "shop_id": target.shop_id,
                "target_type": target.target_type,
                "target_amount": target.target_amount,
                "current_sales": target.current_sales,
                "status": target.status,
                "start_date": str(target.start_date),
                "end_date": str(target.end_date),
                "assigned_by": target.assigned_by_name,
                "assigned_at": target.assigned_at.isoformat()
            }
        }, 201


class GetShopTargets(Resource):

    @jwt_required()
    def get(self):
        shop_id = request.args.get("shop_id")

        query = ShopTargets.query

        if shop_id:
            try:
                shop_id = int(shop_id)
            except ValueError:
                return {"message": "shop_id must be an integer."}, 400

            query = query.filter(ShopTargets.shop_id == shop_id)

        targets = query.order_by(ShopTargets.created_at.desc()).all()

        return {
            "count": len(targets),
            "targets": [
                {
                    "id": target.id,
                    "shop_id": target.shop_id,
                    "target_type": target.target_type,
                    "target_amount": target.target_amount,
                    "current_sales": target.current_sales,
                    "status": target.status,
                    "start_date": str(target.start_date),
                    "end_date": str(target.end_date),
                    "assigned_by": target.assigned_by_name,
                    "assigned_at": target.assigned_at.isoformat(),
                    "is_active": target.is_active
                }
                for target in targets
            ]
        }, 200
    


class TargetResource(Resource):

    @jwt_required()
    def get(self, target_id):
        target = ShopTargets.query.get(target_id)

        if not target:
            return {"message": "Target not found."}, 404

        return {
            "id": target.id,
            "shop_id": target.shop_id,
            "target_type": target.target_type,
            "target_amount": target.target_amount,
            "current_sales": target.current_sales,
            "status": target.status,
            "start_date": str(target.start_date),
            "end_date": str(target.end_date),
            "assigned_by": target.assigned_by_name,
            "assigned_at": target.assigned_at.isoformat(),
            "is_active": target.is_active
        }, 200

    @jwt_required()
    @check_role('manager')
    def put(self, target_id):
        target = ShopTargets.query.get(target_id)

        if not target:
            return {"message": "Target not found."}, 404

        data = request.get_json()

        if "target_type" in data:
            target.target_type = data["target_type"]

        if "target_amount" in data:
            try:
                target.target_amount = float(data["target_amount"])
            except ValueError:
                return {"message": "target_amount must be a number."}, 400

        if "start_date" in data:
            try:
                target.start_date = datetime.strptime(
                    data["start_date"], "%Y-%m-%d"
                ).date()
            except ValueError:
                return {"message": "Invalid start_date format."}, 400

        if "end_date" in data:
            try:
                target.end_date = datetime.strptime(
                    data["end_date"], "%Y-%m-%d"
                ).date()
            except ValueError:
                return {"message": "Invalid end_date format."}, 400

        if "is_active" in data:
            target.is_active = bool(data["is_active"])

        db.session.commit()

        return {
            "message": "Target updated successfully.",
            "id": target.id
        }, 200

    @jwt_required()
    @check_role('manager')
    def delete(self, target_id):
        target = ShopTargets.query.get(target_id)

        if not target:
            return {"message": "Target not found."}, 404

        db.session.delete(target)
        db.session.commit()

        return {"message": "Target deleted successfully."}, 200