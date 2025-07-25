from flask import request, jsonify
from flask_restful import Resource
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError
from flask_jwt_extended import get_jwt_identity, jwt_required
from Server.Models.Users import Users
from Server.Models.Shops import Shops
from Server.Models.SpoiltStock import SpoiltStock
from Server.Models.Shopstock import ShopStock
from Server.Models.ShopstockV2 import ShopStockV2
from Server.Models.LiveStock import LiveStock

from app import db
from flask_restful import Resource
from flask import jsonify,request,make_response
from functools import wraps

from fuzzywuzzy import process

class AddSpoiltStock(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()

        # Get clerk from JWT
        user_id = get_jwt_identity()
        clerk = Users.query.get(user_id)
        if not clerk:
            return {"message": "Invalid user"}, 400

        # Required fields
        shop_id = data.get('shop_id')
        quantity = data.get('quantity')
        item = data.get('item')
        unit = data.get('unit')  # kgs or count
        disposal_method = data.get('disposal_method')  # depot or waste disposer
        collector_name = data.get('collector_name')
        comment = data.get('comment', '')

        if not all([item, quantity, unit, disposal_method]):
            return {"message": "Missing required fields"}, 400

        try:
            # Convert quantity to float for safety
            quantity = float(quantity)
        except ValueError:
            return {"message": "Invalid quantity format"}, 400

        # Find matching shop stock item(s), sorted by oldest batch first (FIFO)
        shop_stock_entries = ShopStockV2.query.filter_by(
            shop_id=shop_id,
            itemname=item
        ).order_by(ShopStockV2.BatchNumber).all()

        # Find matching livestock entry
        livestock_entry = LiveStock.query.filter_by(
            shop_id=shop_id,
            item_name=item
        ).first()

        if not shop_stock_entries and not livestock_entry:
            return {"message": f"Item '{item}' not found in shop {shop_id} stock or livestock"}, 400

        remaining_to_deduct = quantity
        batch_deductions = []  # Track which batches were deducted
        livestock_deduction = 0.0

        # First deduct from shop stock if available
        for stock in shop_stock_entries:
            if remaining_to_deduct <= 0:
                break
            if stock.quantity <= 0:
                continue

            deduct_amount = min(stock.quantity, remaining_to_deduct)
            stock.quantity -= deduct_amount
            remaining_to_deduct -= deduct_amount
            batch_deductions.append({
                'batch': stock.BatchNumber,
                'deducted': deduct_amount,
                'remaining': stock.quantity
            })
            db.session.add(stock)

        # If still remaining to deduct, try to deduct from livestock
        if remaining_to_deduct > 0 and livestock_entry:
            # Check if livestock has enough current quantity
            if livestock_entry.current_quantity > 0:
                deduct_amount = min(livestock_entry.current_quantity, remaining_to_deduct)
                livestock_entry.current_quantity -= deduct_amount
                livestock_deduction = deduct_amount
                remaining_to_deduct -= deduct_amount
                db.session.add(livestock_entry)

        if remaining_to_deduct > 0:
            db.session.rollback()
            available = quantity - remaining_to_deduct
            sources = []
            if batch_deductions:
                sources.append(f"shop stock: {sum(d['deducted'] for d in batch_deductions)}")
            if livestock_deduction > 0:
                sources.append(f"livestock: {livestock_deduction}")
            
            return {
                "message": f"Not enough stock to deduct spoilt quantity. Needed {quantity}, available {available} ({' + '.join(sources) if sources else 'none'})",
                "available": available,
                "sources": sources
            }, 400

        # Record spoilt stock
        record = SpoiltStock(
            created_at=datetime.utcnow(),
            clerk_id=user_id,
            shop_id=shop_id,
            item=item,
            quantity=quantity,
            unit=unit,
            disposal_method=disposal_method,
            collector_name=collector_name,
            comment=comment
        )

        # Add batches_affected as a separate field if your model supports it
        # If not, we'll store it in the comment or handle it differently
        if batch_deductions:
            batches_info = ', '.join([f"{d['batch']}({d['deducted']})" for d in batch_deductions])
            if hasattr(SpoiltStock, 'batches_affected'):
                record.batches_affected = batches_info
            else:
                # Append to comment if batches_affected field doesn't exist
                record.comment = f"{comment} | Batches: {batches_info}".strip(' |')

        if livestock_deduction > 0:
            if hasattr(SpoiltStock, 'livestock_deduction'):
                record.livestock_deduction = livestock_deduction
            else:
                # Append to comment if livestock_deduction field doesn't exist
                record.comment = f"{record.comment} | Livestock: {livestock_deduction}".strip(' |')

        db.session.add(record)
        
        try:
            db.session.commit()
            return {
                "message": "Spoilt stock recorded and deducted from inventory",
                "details": {
                    "item": item,
                    "quantity": quantity,
                    "unit": unit,
                    "batches_affected": batch_deductions,
                    "livestock_deduction": livestock_deduction,
                    "disposal_method": disposal_method
                }
            }, 201
        except Exception as e:
            db.session.rollback()
            return {
                "message": "Failed to record spoilt stock",
                "error": str(e)
            }, 500
    
class SpoiltStockResource(Resource):
    @jwt_required()
    def get(self):
        shop_id = request.args.get('shop_id')

        if shop_id:
            records = SpoiltStock.query.filter_by(shop_id=shop_id).order_by(SpoiltStock.created_at.desc()).all()
        else:
            records = SpoiltStock.query.order_by(SpoiltStock.created_at.desc()).all()

        result = []
        for record in records:
            user = Users.query.filter_by(users_id=record.clerk_id).first()
            shop = Shops.query.filter_by(shops_id=record.shop_id).first()

            username = user.username if user else "Unknown User"
            shopname = shop.shopname if shop else "Unknown Shop"

            # Format created_at
            if record.created_at:
                if isinstance(record.created_at, str):
                    try:
                        created_at = datetime.strptime(record.created_at, '%Y-%m-%d %H:%M:%S').strftime('%Y-%m-%d %H:%M:%S')
                    except ValueError:
                        created_at = record.created_at
                else:
                    created_at = record.created_at.strftime('%Y-%m-%d %H:%M:%S')
            else:
                created_at = None

            result.append({
                "id": record.id,
                "created_at": created_at,
                "clerk_id": record.clerk_id,
                "username": username,
                "shop_id": record.shop_id,
                "shop_name": shopname,
                "item": record.item,
                "quantity": record.quantity,
                "unit": record.unit,
                "disposal_method": record.disposal_method,
                "collector_name": record.collector_name,
                "comment": record.comment
            })

        return make_response(jsonify(result), 200)


    @jwt_required()
    def put(self, id):
        data = request.get_json()

        record = SpoiltStock.query.get(id)
        if not record:
            return {"message": "Spoilt stock record not found"}, 404

        record.item = data.get('item', record.item)
        record.quantity = data.get('quantity', record.quantity)
        record.unit = data.get('unit', record.unit)
        record.disposal_method = data.get('disposal_method', record.disposal_method)
        record.collector_name = data.get('collector_name', record.collector_name)
        record.comment = data.get('comment', record.comment)

        db.session.commit()

        return {"message": "Spoilt stock record updated successfully"}, 200

    @jwt_required()
    def delete(self, id):
        record = SpoiltStock.query.get(id)
        if not record:
            return {"message": "Spoilt stock record not found"}, 404

        db.session.delete(record)
        db.session.commit()

        return {"message": "Spoilt stock record deleted successfully"}, 200
