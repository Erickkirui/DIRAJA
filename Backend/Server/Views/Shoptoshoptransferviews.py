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

        # Get user from JWT
        user_id = get_jwt_identity()
        user = Users.query.get(user_id)
        if not user:
            return {"message": "Invalid user"}, 400

        # Required fields
        from_shop_id = data.get('from_shop_id')
        to_shop_id = data.get('to_shop_id')
        stockv2_id = data.get('stockv2_id')
        quantity = data.get('quantity')
        item_name = data.get('item_name')
        batch_number = data.get('BatchNumber')

        # If stockv2_id not provided, try to get it from item name + batch
        if not stockv2_id and item_name and batch_number:
            stock = ShopStockV2.query.filter_by(
                itemname=item_name,
                BatchNumber=batch_number,
                shop_id=from_shop_id
            ).first()
            if stock:
                stockv2_id = stock.stockv2_id

        if not all([from_shop_id, to_shop_id, stockv2_id, quantity]):
            return {"message": "Missing required fields (from_shop_id, to_shop_id, stockv2_id, quantity)"}, 400

        if from_shop_id == to_shop_id:
            return {"message": "Source and destination shops cannot be the same"}, 400

        try:
            quantity = float(quantity)
            if quantity <= 0:
                return {"message": "Quantity must be a positive number"}, 400
        except ValueError:
            return {"message": "Quantity must be a valid number"}, 400

        # Get the source stock item with its inventory
        source_stock = ShopStockV2.query.options(
            db.joinedload(ShopStockV2.inventory)
        ).filter_by(
            stockv2_id=stockv2_id,  # Changed from 'id' to 'stockv2_id'
            shop_id=from_shop_id
        ).first()

        if not source_stock:
            return {"message": "Stock item not found in source shop"}, 404

        # Check if destination shop exists
        to_shop = Shops.query.get(to_shop_id)
        if not to_shop:
            return {"message": f"Destination shop {to_shop_id} not found"}, 404

        if source_stock.quantity < quantity - 0.001:
            return {
                "message": "Insufficient stock",
                "available": source_stock.quantity,
                "requested": quantity
            }, 400

        try:
            # Deduct from source
            source_stock.quantity -= quantity
            db.session.add(source_stock)

            # Add to or create destination stock
            destination_stock = ShopStockV2.query.filter_by(
                shop_id=to_shop_id,
                BatchNumber=source_stock.BatchNumber,
                inventoryv2_id=source_stock.inventoryv2_id
            ).first()

            if destination_stock:
                destination_stock.quantity += quantity
                destination_stock.unitPrice = source_stock.unitPrice
                db.session.add(destination_stock)
            else:
                new_stock = ShopStockV2(
                    shop_id=to_shop_id,
                    inventoryv2_id=source_stock.inventoryv2_id,
                    itemname=source_stock.itemname,
                    quantity=quantity,
                    BatchNumber=source_stock.BatchNumber,
                    unitPrice=source_stock.unitPrice,
                    metric=source_stock.metric,
                    total_cost=source_stock.unitPrice * quantity,
                    
                )
                db.session.add(new_stock)

            # Record transfer
            transfer = Shoptoshoptransfer(
                shops_id=from_shop_id,
                from_shop_id=from_shop_id,
                to_shop_id=to_shop_id,
                users_id=user_id,
                stockv2_id=stockv2_id,
                itemname=source_stock.itemname,
                quantity=quantity
            )
            db.session.add(transfer)

            db.session.commit()

            return {
                "message": "Transfer completed successfully",
                "transfer_id": transfer.transfer_id,
                "details": {
                    "item": source_stock.itemname,
                    "batch": source_stock.BatchNumber,
                    "quantity_transferred": quantity,
                    "source_shop": from_shop_id,
                    "destination_shop": to_shop_id,
                    "remaining_quantity": source_stock.quantity
                }
            }, 201

        except Exception as e:
            db.session.rollback()
            return {
                "message": "Transfer failed due to database error",
                "error": str(e)
            }, 500
            
            
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