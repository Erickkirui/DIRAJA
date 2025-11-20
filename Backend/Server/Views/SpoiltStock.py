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
from datetime import datetime
import datetime
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

        # Record spoilt stock as PENDING (but inventory is already deducted)
        record = SpoiltStock(
            clerk_id=user_id,
            shop_id=shop_id,
            item=item,
            quantity=quantity,
            unit=unit,
            disposal_method=disposal_method,
            collector_name=collector_name,
            comment=comment,
            status='pending',  # Set as pending - needs approval
            approved_by=None,
            approved_at=None,
            livestock_deduction=livestock_deduction
        )

        # Store batch deduction information
        if batch_deductions:
            batches_info = ', '.join([f"Batch {d['batch']}: -{d['deducted']}{unit}" for d in batch_deductions])
            record.batches_affected = batches_info

        db.session.add(record)
        
        try:
            db.session.commit()
            return {
                "message": "Spoilt stock deducted from inventory and recorded as pending approval",
                "details": {
                    "record_id": record.id,
                    "item": item,
                    "quantity": quantity,
                    "unit": unit,
                    "status": "pending",
                    "disposal_method": disposal_method,
                    "batches_affected": batch_deductions,
                    "livestock_deduction": livestock_deduction,
                    "created_at": record.created_at.isoformat()
                }
            }, 201
        except Exception as e:
            db.session.rollback()
            return {
                "message": "Failed to record spoilt stock",
                "error": str(e)
            }, 500

class ApproveSpoiltStock(Resource):
    @jwt_required()
    def post(self, record_id):
        # Get approving user from JWT
        user_id = get_jwt_identity()
        approver = Users.query.get(user_id)
        if not approver:
            return {"message": "Invalid user"}, 400

        # Find the spoilt stock record
        spoilt_record = SpoiltStock.query.get(record_id)
        if not spoilt_record:
            return {"message": "Spoilt stock record not found"}, 404

        if spoilt_record.status != 'pending':
            return {"message": f"Record already {spoilt_record.status}"}, 400

        # Update the spoilt stock record to approved
        spoilt_record.status = 'approved'
        spoilt_record.approved_by = user_id
        spoilt_record.approved_at = datetime.datetime.utcnow()

        try:
            db.session.commit()
            return {
                "message": "Spoilt stock approved",
                "details": {
                    "record_id": spoilt_record.id,
                    "item": spoilt_record.item,
                    "quantity": spoilt_record.quantity,
                    "approved_by": user_id,
                    "approved_at": spoilt_record.approved_at.isoformat()
                }
            }, 200
        except Exception as e:
            db.session.rollback()
            return {
                "message": "Failed to approve spoilt stock",
                "error": str(e)
            }, 500

class RejectSpoiltStock(Resource):
    @jwt_required()
    def post(self, record_id):
        user_id = get_jwt_identity()
        rejector = Users.query.get(user_id)
        if not rejector:
            return {"message": "Invalid user"}, 400

        spoilt_record = SpoiltStock.query.get(record_id)
        if not spoilt_record:
            return {"message": "Spoilt stock record not found"}, 404

        if spoilt_record.status != 'pending':
            return {"message": f"Record already {spoilt_record.status}"}, 400

        # RESTORE the deducted stock before rejecting
        shop_id = spoilt_record.shop_id
        quantity = spoilt_record.quantity
        item = spoilt_record.item

        # Restore to shop stock (add back to batches)
        if spoilt_record.batches_affected:
            # Parse the batches_affected string to get batch info
            # Format: "Batch X: -Yunit, Batch Z: -Wunit"
            batch_deductions = []
            for part in spoilt_record.batches_affected.split(', '):
                if 'Batch' in part:
                    batch_info = part.replace('Batch ', '').split(': -')
                    if len(batch_info) == 2:
                        batch_number = batch_info[0].strip()
                        deducted_amount = float(batch_info[1].replace(spoilt_record.unit, '').strip())
                        batch_deductions.append({
                            'batch': batch_number,
                            'deducted': deducted_amount
                        })
            
            # Restore to each batch
            for deduction in batch_deductions:
                stock_entry = ShopStockV2.query.filter_by(
                    shop_id=shop_id,
                    itemname=item,
                    BatchNumber=deduction['batch']
                ).first()
                
                if stock_entry:
                    stock_entry.quantity += deduction['deducted']
                    db.session.add(stock_entry)

        # Restore to livestock if applicable
        if spoilt_record.livestock_deduction and spoilt_record.livestock_deduction > 0:
            livestock_entry = LiveStock.query.filter_by(
                shop_id=shop_id,
                item_name=item
            ).first()
            
            if livestock_entry:
                livestock_entry.current_quantity += spoilt_record.livestock_deduction
                db.session.add(livestock_entry)

        # Update the spoilt stock record to rejected
        spoilt_record.status = 'rejected'
        spoilt_record.approved_by = user_id
        spoilt_record.approved_at = datetime.datetime.utcnow()

        try:
            db.session.commit()
            return {
                "message": "Spoilt stock rejected and inventory restored",
                "details": {
                    "record_id": spoilt_record.id,
                    "item": spoilt_record.item,
                    "quantity": spoilt_record.quantity,
                    "restored_stock": quantity,
                    "rejected_by": user_id,
                    "rejected_at": spoilt_record.approved_at.isoformat()
                }
            }, 200
        except Exception as e:
            db.session.rollback()
            return {
                "message": "Failed to reject spoilt stock",
                "error": str(e)
            }, 500

class GetPendingSpoiltStock(Resource):
    @jwt_required()
    def get(self):
        # Join with Users and Shops tables to get names
        pending_records = db.session.query(
            SpoiltStock,
            Users.username,
            Shops.shopname
        ).join(
            Users, SpoiltStock.clerk_id == Users.users_id
        ).join(
            Shops, SpoiltStock.shop_id == Shops.shops_id
        ).filter(
            SpoiltStock.status == 'pending'
        ).order_by(SpoiltStock.created_at.desc()).all()
        
        result = []
        for record, username, shopname in pending_records:
            result.append({
                'id': record.id,
                'created_at': record.created_at.isoformat(),
                'clerk_id': record.clerk_id,
                'clerk_username': username,  # Add username
                'shop_id': record.shop_id,
                'shop_name': shopname,  # Add shop name
                'item': record.item,
                'quantity': record.quantity,
                'unit': record.unit,
                'disposal_method': record.disposal_method,
                'collector_name': record.collector_name,
                'comment': record.comment,
                'batches_affected': record.batches_affected,
                'livestock_deduction': record.livestock_deduction
            })
        
        return {"pending_records": result}, 200

class SpoiltStockHistory(Resource):
    @jwt_required()
    def get(self):
        # Get query parameters for filtering
        shop_id = request.args.get('shop_id')
        status = request.args.get('status')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = SpoiltStock.query
        
        if shop_id:
            query = query.filter_by(shop_id=shop_id)
        if status:
            query = query.filter_by(status=status)
        if start_date:
            query = query.filter(SpoiltStock.created_at >= start_date)
        if end_date:
            query = query.filter(SpoiltStock.created_at <= end_date)
            
        records = query.order_by(SpoiltStock.created_at.desc()).all()
        
        result = []
        for record in records:
            result.append({
                'id': record.id,
                'created_at': record.created_at.isoformat(),
                'clerk_id': record.clerk_id,
                'shop_id': record.shop_id,
                'item': record.item,
                'quantity': record.quantity,
                'unit': record.unit,
                'disposal_method': record.disposal_method,
                'status': record.status,
                'approved_by': record.approved_by,
                'approved_at': record.approved_at.isoformat() if record.approved_at else None,
                'batches_affected': record.batches_affected,
                'livestock_deduction': record.livestock_deduction
            })
        
        return {"spoilt_stock_history": result}, 200
    
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
                'batches_affected': record.batches_affected,
                'status': record.status,
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


