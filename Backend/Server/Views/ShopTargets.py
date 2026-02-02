from flask_restful import Resource
from flask import request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from functools import wraps
from sqlalchemy import func

from app import db
from Server.Models.Users import Users
from Server.Models.ShopTargets import ShopTargets
from Server.Models.Sales import Sales
from Server.Models.Paymnetmethods import SalesPaymentMethods
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
        target_type = request.args.get("target_type")
        status = request.args.get("status")
        is_active = request.args.get("is_active")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        show_expired = request.args.get("show_expired", "false").lower() == "true"

        query = ShopTargets.query

        # Filter by shop_id
        if shop_id:
            try:
                shop_id = int(shop_id)
                query = query.filter(ShopTargets.shop_id == shop_id)
            except ValueError:
                return {"message": "shop_id must be an integer."}, 400

        # Filter by target_type (daily, weekly, monthly)
        if target_type:
            valid_target_types = ['daily', 'weekly', 'monthly', 'custom']
            if target_type in valid_target_types:
                query = query.filter(ShopTargets.target_type == target_type)
            else:
                return {"message": f"Invalid target_type. Must be one of: {', '.join(valid_target_types)}"}, 400

        # Filter by status (active, completed, pending, cancelled)
        if status:
            valid_statuses = ['active', 'completed', 'pending', 'cancelled', 'not_achieved', 'achieved', 'in_progress']
            if status in valid_statuses:
                query = query.filter(ShopTargets.status == status)
            else:
                return {"message": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}, 400

        # Filter by is_active (true/false)
        if is_active is not None:
            if is_active.lower() == 'true':
                query = query.filter(ShopTargets.is_active == True)
            elif is_active.lower() == 'false':
                query = query.filter(ShopTargets.is_active == False)
            else:
                return {"message": "is_active must be 'true' or 'false'."}, 400

        # Filter by start_date (targets starting on or after this date)
        if start_date:
            try:
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                query = query.filter(ShopTargets.start_date >= start_date_obj)
            except ValueError:
                return {"message": "start_date must be in YYYY-MM-DD format."}, 400

        # Filter by end_date (targets ending on or before this date)
        if end_date:
            try:
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                query = query.filter(ShopTargets.end_date <= end_date_obj)
            except ValueError:
                return {"message": "end_date must be in YYYY-MM-DD format."}, 400

        # Filter out expired targets (optional - based on show_expired parameter)
        if not show_expired:
            current_date = datetime.now().date()
            query = query.filter(
                (ShopTargets.end_date >= current_date) | 
                (ShopTargets.status == 'completed')  # Include completed targets even if expired
            )

        targets = query.order_by(ShopTargets.created_at.desc()).all()
        
        # Create the response with calculated current_sales
        response_targets = []
        
        for target in targets:
            # Calculate current sales for this target's date range and shop
            current_sales = self._calculate_current_sales_for_target(target)
            
            response_targets.append({
                "id": target.id,
                "shop_id": target.shop_id,
                "target_type": target.target_type,
                "target_amount": target.target_amount,
                "current_sales": current_sales,
                "status": target.status,
                "start_date": str(target.start_date),
                "end_date": str(target.end_date),
                "assigned_by": target.assigned_by_name,
                "assigned_at": target.assigned_at.isoformat(),
                "is_active": target.is_active,
                "progress_percentage": self._calculate_progress_percentage(target.target_amount, current_sales),
                "days_remaining": self._calculate_days_remaining(target.end_date),
                "is_expired": datetime.now().date() > target.end_date if target.end_date else False
            })

        return {
            "count": len(response_targets),
            "targets": response_targets,
            "filters": {
                "shop_id": shop_id,
                "target_type": target_type,
                "status": status,
                "is_active": is_active,
                "start_date": start_date,
                "end_date": end_date,
                "show_expired": show_expired
            }
        }, 200
    
    def _calculate_current_sales_for_target(self, target):
        """
        Calculate total sales for a shop within the target's date range
        """
        # Sum all payments for sales in the given date range and shop
        total_sales = db.session.query(
            func.coalesce(func.sum(SalesPaymentMethods.amount_paid), 0)
        ).join(Sales, SalesPaymentMethods.sale_id == Sales.sales_id)\
         .filter(
            Sales.shop_id == target.shop_id,
            Sales.created_at >= target.start_date,
            Sales.created_at <= target.end_date,
            SalesPaymentMethods.payment_method != 'not payed'  # Exclude unpaid sales
         ).scalar()
        
        return float(total_sales) if total_sales else 0.0
    
    def _calculate_progress_percentage(self, target_amount, current_sales):
        """
        Calculate progress percentage towards target
        """
        if target_amount <= 0:
            return 0.0
        
        percentage = (current_sales / target_amount) * 100
        return min(round(percentage, 2), 100.0)  # Cap at 100%
    
    def _calculate_days_remaining(self, end_date):
        """
        Calculate days remaining until target end date
        """
        if not end_date:
            return None
        
        today = datetime.now().date()
        end_date_obj = end_date if isinstance(end_date, datetime) else end_date
        days_remaining = (end_date_obj - today).days
        
        return max(days_remaining, 0)  # Return 0 if expired


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