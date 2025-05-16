from flask import request, jsonify
from flask_restful import Resource
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError
from flask_jwt_extended import get_jwt_identity, jwt_required
from Server.Models.Users import Users
from Server.Models.Shops import Shops
from Server.Models.SpoiltStock import SpoiltStock
from Server.Models.Shopstock import ShopStock

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

        # Find matching shop stock item(s), sorted by oldest batch (optional)
        shop_stock_entries = ShopStock.query.filter_by(shop_id=shop_id, itemname=item).order_by(ShopStock.stock_id).all()

        if not shop_stock_entries:
            return {"message": "Item not found in shop stock"}, 400

        remaining_to_deduct = float(quantity)

        for stock in shop_stock_entries:
            if remaining_to_deduct <= 0:
                break
            if stock.quantity <= 0:
                continue

            if stock.quantity >= remaining_to_deduct:
                stock.quantity -= remaining_to_deduct
                remaining_to_deduct = 0
            else:
                remaining_to_deduct -= stock.quantity
                stock.quantity = 0

        if remaining_to_deduct > 0:
            return {"message": "Not enough stock to deduct spoilt quantity"}, 400

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

        db.session.add(record)
        db.session.commit()

        return {"message": "Spoilt stock recorded and deducted from shop stock"}, 201
    
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
