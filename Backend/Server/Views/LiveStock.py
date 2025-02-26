from flask_restful import Resource
from Server.Models.LiveStock import LiveStock
from Server.Models.ShopTransfers import ShopTransfer
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
        
        # Fetch all stock records ordered by creation date (latest first)
        stock_records = (
            LiveStock.query
            .order_by(LiveStock.created_at.desc())
            .all()
        )

        # Ensure we track unique items per shop
        items_seen = set()
        filtered_stock_records = []

        for stock in stock_records:
            key = (stock.item_name, stock.shop_id)  # Track by item and shop
            
            # If the item for the shop is not seen yet, or if it's from today, add it
            if key not in items_seen or db.func.date(stock.created_at) == today:
                filtered_stock_records.append(stock)
                items_seen.add(key)

        if filtered_stock_records:
            # Fetch shop details for shop IDs
            shop_ids = {stock.shop_id for stock in filtered_stock_records}
            shops = {shop.shops_id: shop.shopname for shop in Shops.query.filter(Shops.shops_id.in_(shop_ids)).all()}

            return jsonify([{
                "stock_id": stock.id,
                "shop_id": stock.shop_id,
                "shop_name": shops.get(stock.shop_id, "Unknown"),
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
        
        
class TransferStock(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()

        required_fields = ["from_shop_id", "to_shop_id", "item_name", "transfer_quantity"]
        for field in required_fields:
            if field not in data:
                return {"error": f"Missing field: {field}"}, 400

        try:
            from_shop_id = data["from_shop_id"]
            to_shop_id = data["to_shop_id"]
            item_name = data["item_name"]
            transfer_quantity = float(data["transfer_quantity"])

            if from_shop_id == to_shop_id:
                return {"error": "Shops must be different for stock transfer"}, 400

            # Get the latest stock entry for the item in the sending shop
            sending_stock = (
                LiveStock.query.filter_by(shop_id=from_shop_id, item_name=item_name)
                .order_by(LiveStock.created_at.desc())
                .first()
            )

            if not sending_stock or sending_stock.current_quantity < transfer_quantity:
                return {"error": "Insufficient stock for transfer"}, 400

            # Subtract stock from the sending shop
            sending_stock.current_quantity -= transfer_quantity
            db.session.add(sending_stock)

            # Get the latest stock entry for the receiving shop
            receiving_stock = (
                LiveStock.query.filter_by(shop_id=to_shop_id, item_name=item_name)
                .order_by(LiveStock.created_at.desc())
                .first()
            )

            today = datetime.utcnow().date()

            if receiving_stock:
                if receiving_stock.created_at.date() == today:
                    receiving_stock.added_stock += transfer_quantity
                    receiving_stock.current_quantity += transfer_quantity
                else:
                    new_stock_entry = LiveStock(
                        shop_id=to_shop_id,
                        item_name=item_name,
                        metric=sending_stock.metric,
                        added_stock=transfer_quantity,
                        current_quantity=transfer_quantity,
                        clock_in_quantity=0,
                        mismatch_quantity=0,
                        mismatch_reason=None,
                        clock_out_quantity=0,
                        created_at=datetime.utcnow()
                    )
                    db.session.add(new_stock_entry)
            else:
                receiving_stock = LiveStock(
                    shop_id=to_shop_id,
                    item_name=item_name,
                    metric=sending_stock.metric,
                    added_stock=transfer_quantity,
                    current_quantity=transfer_quantity,
                    clock_in_quantity=0,
                    mismatch_quantity=0,
                    mismatch_reason=None,
                    clock_out_quantity=0,
                    created_at=datetime.utcnow()
                )
                db.session.add(receiving_stock)

            # Fetch shop names
            from_shop = Shops.query.filter_by(shops_id=from_shop_id).first()
            to_shop = Shops.query.filter_by(shops_id=to_shop_id).first()

            # Store transfer record in ShopTransfer table
            transfer_record = ShopTransfer(
                shop_id=to_shop_id,
                item_name=item_name,
                quantity=transfer_quantity,
                metric=sending_stock.metric,
                fromshop=from_shop.shopname if from_shop else None,
                toshop=to_shop.shopname if to_shop else None,
                created_at=datetime.utcnow()
            )
            db.session.add(transfer_record)

            db.session.commit()

            return {
                "message": "Stock transferred successfully",
                "from_shop_id": from_shop_id,
                "to_shop_id": to_shop_id,
                "item_name": item_name,
                "transferred_quantity": transfer_quantity,
                "remaining_stock_in_sending_shop": sending_stock.current_quantity,
                "new_stock_in_receiving_shop": receiving_stock.current_quantity,
                "transfer_record_id": transfer_record.id
            }, 200

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500
        


class GetShopTransfers(Resource):
    @jwt_required()
    def get(self):
        try:
            # Fetch all shop transfer records, ordered by most recent
            transfers = ShopTransfer.query.order_by(ShopTransfer.created_at.desc()).all()

            # Serialize the transfer records
            transfer_list = []
            for transfer in transfers:
                transfer_list.append({
                    "id": transfer.id,
                    "shop_id": transfer.shop_id,
                    "item_name": transfer.item_name,
                    "quantity": transfer.quantity,
                    "metric": transfer.metric,
                    "fromshop": transfer.fromshop,
                    "toshop": transfer.toshop,
                    "created_at": transfer.created_at.strftime("%Y-%m-%d %H:%M:%S")
                })

            return {"transfers": transfer_list}, 200
        
        except Exception as e:
            return {"error": str(e)}, 500