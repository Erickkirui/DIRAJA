from flask_restful import Resource
from Server.Models.LiveStock import LiveStock
from Server.Models.Shops import Shops
from datetime import datetime
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


class GetAllLiveStock(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        today = datetime.utcnow().date()
        
        # Fetch all stock records for today and yesterday, ordered by creation date
        stock_records = (
            LiveStock.query
            .order_by(LiveStock.created_at.desc())
            .all()
        )

        # Filter to get only the most recent stock for each item (prioritize today's stock)
        items_seen = set()
        filtered_stock_records = []

        for stock in stock_records:
            # If the item has not been seen yet, or if it is from today, add it
            if stock.item_name not in items_seen or db.func.date(stock.created_at) == today:
                filtered_stock_records.append(stock)
                items_seen.add(stock.item_name)

        # If stock records are found, return them sorted by the creation date
        if filtered_stock_records:
            # Fetch the shop details for each shop_id
            shop_ids = {stock.shop_id for stock in filtered_stock_records}
            shops = {shop.shops_id: shop.shopname for shop in Shops.query.filter(Shops.shops_id.in_(shop_ids)).all()}

            return jsonify([{
                "stock_id": stock.id,
                "shop_id": stock.shop_id,  # Include shop_id to identify which shop the stock belongs to
                "shop_name": shops.get(stock.shop_id, "Unknown"),  # Get the shop name related to the shop_id
                "item_name": stock.item_name,
                "metric": stock.metric,
                "clock_in_quantity": stock.clock_in_quantity,
                "added_stock": stock.added_stock,
                "current_quantity": stock.current_quantity,
                "clock_out_quantity": stock.clock_out_quantity,
                "mismatch_quantity": stock.mismatch_quantity,
                "mismatch_reason": stock.mismatch_reason,
                "created_at": stock.created_at
            } for stock in filtered_stock_records])

        return {"error": "No stock records found."}, 404




class GetStock(Resource):
    @jwt_required()
    def get(self, shop_id):
        today = datetime.utcnow().date()
        
        # Fetch all stock records for today and yesterday, ordered by creation date
        stock_records = (
            LiveStock.query.filter(
                LiveStock.shop_id == shop_id
            )
            .order_by(LiveStock.created_at.desc())
            .all()
        )

        # Filter to get only the most recent stock for each item (prioritize today's stock)
        items_seen = set()
        filtered_stock_records = []

        for stock in stock_records:
            # If the item has not been seen yet, or if it is from today, add it
            if stock.item_name not in items_seen or db.func.date(stock.created_at) == today:
                filtered_stock_records.append(stock)
                items_seen.add(stock.item_name)

        # If stock records are found, return them sorted by the creation date
        if filtered_stock_records:
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
                    "created_at": stock.created_at
                }
                for stock in filtered_stock_records
            ])
        
        return {"error": "No stock records found."}, 404

   
class AddStock(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()

        required_fields = ["shop_id", "item_name", "added_stock"]
        for field in required_fields:
            if field not in data:
                return {"error": f"Missing field: {field}"}, 400

        shop_id = data["shop_id"]
        item_name = data["item_name"]
        added_stock = data["added_stock"]

        if added_stock < 0:
            return {"error": "Added stock cannot be negative"}, 400

        # Fetch today's stock record
        today_stock = (
            LiveStock.query.filter_by(shop_id=shop_id, item_name=item_name)
            .order_by(LiveStock.created_at.desc())
            .first()
        )

        if not today_stock:
            return {"error": "No stock check-in found for today. Please check in first."}, 400

        # Update stock: Add new stock to both `added_stock` and `current_quantity`
        today_stock.added_stock += added_stock
        today_stock.current_quantity += added_stock

        try:
            db.session.commit()
            return {
                "message": "Stock updated successfully",
                "item_name": today_stock.item_name,
                "clock_in_quantity": today_stock.clock_in_quantity,
                "added_stock": today_stock.added_stock,
                "current_quantity": today_stock.current_quantity,
            }, 200

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500


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

            # Get custom date if provided, otherwise use the current time
            created_at = data.get("created_at")
            if created_at:
                try:
                    created_at = datetime.strptime(created_at, "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    return {"error": "Invalid date format. Use 'YYYY-MM-DD HH:MM:SS'."}, 400
            else:
                created_at = datetime.utcnow()  # Use current UTC time

            # Get the last stock entry for this item and shop
            last_stock = (
                LiveStock.query.filter_by(shop_id=shop_id, item_name=item_name)
                .order_by(LiveStock.created_at.desc())
                .first()
            )

            # If previous stock exists, add the new stock to the last `current_quantity`
            new_current_quantity = last_stock.current_quantity + added_stock if last_stock else added_stock

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
                created_at=created_at
            )

            db.session.add(new_stock)
            db.session.commit()

            return {
                "message": "Stock registered successfully",
                "stock_id": new_stock.id,
                "current_quantity": new_stock.current_quantity,
                "created_at": created_at.strftime("%Y-%m-%d %H:%M:%S")
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
            .order_by(LiveStock.created_at.desc())
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
            created_at=datetime.utcnow()
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
        

class CheckoutStock(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()

        if "shop_id" not in data:
            return {"error": "Missing field: shop_id"}, 400

        shop_id = data["shop_id"]

        # Get current date
        today = datetime.utcnow().date()

        # Fetch all stock records for the shop for the current date
        today_stocks = (
            LiveStock.query.filter_by(shop_id=shop_id)
            .filter(LiveStock.created_at >= today)
            .all()
        )

        if not today_stocks:
            return {"error": "No stock check-in records found for today."}, 400

        try:
            # Update each stock entry with the current quantity as the clock-out quantity
            for stock in today_stocks:
                stock.clock_out_quantity = stock.current_quantity

            db.session.commit()

            return {
                "message": "Stock checked out successfully",
                "items": [
                    {
                        "item_name": stock.item_name,
                        "clock_in_quantity": stock.clock_in_quantity,
                        "added_stock": stock.added_stock,
                        "current_quantity": stock.current_quantity,
                        "clock_out_quantity": stock.clock_out_quantity,
                    }
                    for stock in today_stocks
                ],
            }, 200

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500

class DeleteStock(Resource):
    @jwt_required()
    def delete(self, stock_id):
        # Find the stock record by stock_id
        stock = LiveStock.query.get(stock_id)

        if not stock:
            return {"error": "Stock record not found."}, 404

        try:
            db.session.delete(stock)
            db.session.commit()
            return {"message": "Stock record deleted successfully."}, 200
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500
        
        
