from flask import request, jsonify
from flask_restful import Resource
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError
from flask_jwt_extended import get_jwt_identity, jwt_required
from Server.Models.Users import Users
from Server.Models.Shops import Shops
from Server.Models.ShopstockV2 import ShopStockV2
from Server.Models.Shoptoshoptransfer import Shoptoshoptransfer
from app import db
from flask_restful import Resource
from sqlalchemy.orm import joinedload
from flask import jsonify,request,make_response
from functools import wraps


class ShopToShopTransfer(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()

        # User
        user_id = get_jwt_identity()
        user = Users.query.get(user_id)
        if not user:
            return {"message": "Invalid user"}, 400

        from_shop_id = data.get('from_shop_id')
        to_shop_id = data.get('to_shop_id')
        quantity = data.get('quantity')
        item_name = data.get('item_name')

        if not all([from_shop_id, to_shop_id, item_name, quantity]):
            return {"message": "Missing required fields"}, 400

        if from_shop_id == to_shop_id:
            return {"message": "Source and destination shops cannot be the same"}, 400

        try:
            quantity = float(quantity)
            if quantity <= 0:
                return {"message": "Quantity must be a positive number"}, 400
        except ValueError:
            return {"message": "Quantity must be numeric"}, 400

        # Get ALL batches of this item in source shop (FIFO by batch number or created_at)
        source_batches = ShopStockV2.query.filter_by(
            shop_id=from_shop_id,
            itemname=item_name
        ).order_by(ShopStockV2.BatchNumber.asc()).all()

        if not source_batches:
            return {"message": "Item not found in source shop"}, 404

        total_available = sum(batch.quantity for batch in source_batches)
        if total_available < quantity - 0.001:
            return {
                "message": "Insufficient stock",
                "available": total_available,
                "requested": quantity
            }, 400

        # Process batch-by-batch deduction
        qty_to_transfer = quantity
        transfer_records = []
        try:
            for batch in source_batches:
                if qty_to_transfer <= 0:
                    break

                take_qty = min(batch.quantity, qty_to_transfer)

                # Deduct from source
                batch.quantity -= take_qty
                db.session.add(batch)

                # Add to destination (same batch number)
                destination_stock = ShopStockV2.query.filter_by(
                    shop_id=to_shop_id,
                    BatchNumber=batch.BatchNumber,
                    inventoryv2_id=batch.inventoryv2_id
                ).first()

                if destination_stock:
                    destination_stock.quantity += take_qty
                    destination_stock.unitPrice = batch.unitPrice
                    db.session.add(destination_stock)
                else:
                    new_stock = ShopStockV2(
                        shop_id=to_shop_id,
                        inventoryv2_id=batch.inventoryv2_id,
                        itemname=batch.itemname,
                        quantity=take_qty,
                        BatchNumber=batch.BatchNumber,
                        unitPrice=batch.unitPrice,
                        metric=batch.metric,
                        total_cost=batch.unitPrice * take_qty,
                    )
                    db.session.add(new_stock)

                # Record transfer (batch-level)
                transfer = Shoptoshoptransfer(
                    shops_id=from_shop_id,
                    from_shop_id=from_shop_id,
                    to_shop_id=to_shop_id,
                    users_id=user_id,
                    stockv2_id=batch.stockv2_id,
                    itemname=batch.itemname,
                    quantity=take_qty
                )
                db.session.add(transfer)

                transfer_records.append({
                    "batch": batch.BatchNumber,
                    "transferred": take_qty
                })

                qty_to_transfer -= take_qty

            db.session.commit()

            return {
                "message": "Transfer completed successfully",
                "item": item_name,
                "requested_quantity": quantity,
                "batches_used": transfer_records,
                "destination_shop": to_shop_id
            }, 201

        except Exception as e:
            db.session.rollback()
            return {"message": "Transfer failed", "error": str(e)}, 500

            
            
class GetAllShopToShopTransfers(Resource):
    @jwt_required()
    def get(self):
        # Get all transfer records with related data loaded efficiently
        transfers = Shoptoshoptransfer.query.options(
            db.joinedload(Shoptoshoptransfer.user),
            db.joinedload(Shoptoshoptransfer.shop),
            db.joinedload(Shoptoshoptransfer.stockv2)
        ).order_by(Shoptoshoptransfer.transfer_date.desc()).all()
        
        if not transfers:
            return make_response(jsonify({"message": "No transfers found"}), 404)
        
        transfers_data = []
        for transfer in transfers:
            # Get additional shop names (since we only have relationship for shops_id)
            from_shop = Shops.query.get(transfer.from_shop_id)
            to_shop = Shops.query.get(transfer.to_shop_id)
            
            transfers_data.append({
                "transfer_id": transfer.transfer_id,
                "shops_id": transfer.shops_id,
                "shop_name": transfer.shop.shopname if transfer.shop else "Unknown Shop",
                "from_shop_id": transfer.from_shop_id,
                "from_shop_name": from_shop.shopname if from_shop else "Unknown Shop",
                "to_shop_id": transfer.to_shop_id,
                "to_shop_name": to_shop.shopname if to_shop else "Unknown Shop",
                "user_id": transfer.users_id,
                "username": transfer.user.username if transfer.user else "Unknown User",
                "stockv2_id": transfer.stockv2_id,
                "itemname": transfer.itemname,
                "quantity": transfer.quantity,
                "batch_number": transfer.stockv2.BatchNumber if transfer.stockv2 else "Unknown",
                "unit_price": transfer.stockv2.unitPrice if transfer.stockv2 else 0,
                "transfer_date": transfer.transfer_date.isoformat() if transfer.transfer_date else None
            })

        return make_response(jsonify(transfers_data), 200)