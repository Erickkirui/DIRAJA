from flask_restful import Resource
from Server.Models.LiveStock import LiveStock
from Server.Models.Shops import Shops
from app import db
from Server.Models.Users import Users
from flask import jsonify,request,make_response
from datetime import datetime, timedelta
from flask_jwt_extended import jwt_required, get_jwt_identity
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


class GetStock(Resource):
    @jwt_required()
    def get(self, shop_id):
        today = datetime.utcnow().date()
        
        # Fetch all today's stock records
        today_stock = (
            LiveStock.query.filter(
               LiveStock.shop_id == shop_id,
                db.func.date(LiveStock.timestamp) == today
            )
            .order_by(LiveStock.timestamp.desc())
            .all()
        )

        # If today's stock exists, return it (even if there are mismatches)
        if today_stock:
            return jsonify([
                {
                    "stock_id": stock.id,
                    "item_name": stock.item_name,
                    "metric": stock.metric,
                    "clock_in_quantity": stock.clock_in_quantity,
                    "added_stock": stock.added_stock,
                    "current_quantity": stock.current_quantity,
                    "clock_out_quantity": stock.clock_out_quantity,
                    "mismatch_quantity": stock.mismatch_quantity,
                    "mismatch_reason": stock.mismatch_reason,
                    "timestamp": stock.timestamp
                }
                for stock in today_stock
            ])

        # If no stock found today, fetch yesterday's stock
        yesterday = today - timedelta(days=1)
        yesterday_stock = (
            LiveStock.query.filter(
                LiveStock.shop_id == shop_id,
                db.func.date(LiveStock.timestamp) == yesterday
            )
            .order_by(LiveStock.timestamp.desc())
            .all()
        )

        if yesterday_stock:
            return jsonify([
                {
                    "stock_id": stock.id,
                    "item_name": stock.item_name,
                    "metric": stock.metric,
                    "clock_in_quantity": stock.clock_in_quantity,
                    "added_stock": stock.added_stock,
                    "current_quantity": stock.current_quantity,
                    "clock_out_quantity": stock.clock_out_quantity,
                    "mismatch_quantity": stock.mismatch_quantity,
                    "mismatch_reason": stock.mismatch_reason,
                    "timestamp": stock.timestamp
                }
                for stock in yesterday_stock
            ])

        return {"error": "No stock records found for today or yesterday."}, 404
    



class RegisterStock(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()

        required_fields = ["shop_id", "item_name", "metric", "added_stock"]
        for field in required_fields:
            if field not in data:
                return {"error": f"Missing field: {field}"}, 400

        try:
            shop_id = data["shop_id"]
            item_name = data["item_name"]
            metric = data["metric"]
            added_stock = float(data["added_stock"])

            # Get custom date if provided, otherwise use current time
            timestamp = data.get("timestamp")
            if timestamp:
                try:
                    timestamp = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    return {"error": "Invalid date format. Use 'YYYY-MM-DD HH:MM:SS'."}, 400
            else:
                timestamp = datetime.utcnow()

            # Get the last stock entry for this item and shop
            last_stock = (
                LiveStock.query.filter_by(shop_id=shop_id, item_name=item_name)
                .order_by(LiveStock.timestamp.desc())
                .first()
            )

            # If previous stock exists, add the new stock to the last `current_quantity`
            if last_stock:
                new_current_quantity = last_stock.current_quantity + added_stock
            else:
                new_current_quantity = added_stock  # First entry

            new_stock = LiveStock(
                shop_id=shop_id,
                item_name=item_name,
                metric=metric,
                added_stock=0,  # Set to 0, because it's not "added", just updated stock
                current_quantity=new_current_quantity,  # Update current stock
                clock_in_quantity=0,
                mismatch_quantity=0,
                mismatch_reason=None,
                clock_out_quantity=0,
                timestamp=timestamp
            )

            db.session.add(new_stock)
            db.session.commit()

            return {
                "message": "Stock registered successfully",
                "stock_id": new_stock.id,
                "current_quantity": new_stock.current_quantity,
                "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S")
            }, 201

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500
        


class CheckInStock(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()

        required_fields = ["shop_id", "item_name", "metric", "clock_in_quantity"]
        for field in required_fields:
            if field not in data:
                return {"error": f"Missing field: {field}"}, 400

        shop_id = data["shop_id"]
        item_name = data["item_name"]
        metric = data["metric"]
        clock_in_quantity = float(data["clock_in_quantity"])  # Convert to float for calculations

        # Fetch the last recorded stock entry
        last_stock = (
            LiveStock.query.filter_by(shop_id=shop_id, item_name=item_name)
            .order_by(LiveStock.timestamp.desc())
            .first()
        )

        # Determine the previous stock quantity
        previous_quantity = last_stock.current_quantity if last_stock else 0.0

        # Check for a mismatch
        mismatch_quantity = clock_in_quantity - previous_quantity if clock_in_quantity != previous_quantity else 0.0
        mismatch_reason = data.get("mismatch_reason") if mismatch_quantity != 0 else None

        # Update current quantity to match the clock-in value
        updated_current_quantity = clock_in_quantity  

        # Create a new stock entry
        new_stock = LiveStock(
            shop_id=shop_id,
            item_name=item_name,
            metric=metric,
            clock_in_quantity=clock_in_quantity,
            current_quantity=updated_current_quantity,  # Update to match clock-in value
            added_stock=0.0,
            mismatch_quantity=mismatch_quantity,
            mismatch_reason=mismatch_reason,
            clock_out_quantity=0.0,
            timestamp=datetime.utcnow()
        )

        try:
            db.session.add(new_stock)
            db.session.commit()

            return {
                "message": "Stock check-in successful",
                "stock_id": new_stock.id,
                "clock_in_quantity": new_stock.clock_in_quantity,
                "current_quantity": new_stock.current_quantity,
                "mismatch_quantity": new_stock.mismatch_quantity,
                "mismatch_reason": new_stock.mismatch_reason
            }, 201

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500