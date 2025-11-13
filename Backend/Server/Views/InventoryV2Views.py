from flask_restful import Resource
from Server.Models.InventoryV2 import InventoryV2
from Server.Models.TransferV2 import TransfersV2
from Server.Models.StoreReturn import ReturnsV2
from Server.Models.Shops import Shops
from Server.Models.ShopstockV2 import ShopStockV2
from Server.Models.BankAccounts import BankAccount, BankingTransaction
from Server.Models.Users import Users
from app import db
import json
from functools import wraps
from pywebpush import webpush, WebPushException
from flask import request, make_response, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from dateutil import parser
from flask_restful import reqparse
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
import logging
from Server.Models.PushSubscription import PushSubscription
from Server.Models.Supplier import SupplierHistory , Suppliers
from flask import current_app
import re

def check_role(required_role):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = Users.query.get(current_user_id)
            if user and user.role != required_role:
                 return make_response( jsonify({"error": "Unauthorized access"}), 403 )       
            current_user_id = get_jwt_identity()
            user = Users.query.get(current_user_id)
            if user and user.role != required_role:
                 return make_response( jsonify({"error": "Unauthorized access"}), 403 )       
            return fn(*args, **kwargs)
        return decorator
    return wrapper
# def check_role(required_role):
#     def wrapper(fn):
#         @wraps(fn)
#         def decorator(*args, **kwargs):
#             verify_jwt_in_request()
#             user_role = request.headers.get('X-User-Role', None)
            
#             if user_role != required_role:
#                 return jsonify({"message": "Access denied: insufficient permissions"}), 403
#             return fn(*args, **kwargs)
#         return decorator
#     return wrapper


class GetInventoryByBatchV2(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        try:
            inventories = InventoryV2.query.all()

            def batch_sort_key(inventory):
                match = re.match(r"^.*-(?P<letter>[A-Z])(?P<number>\d+)$", inventory.BatchNumber)
                if match:
                    letter = match.group("letter")
                    number = int(match.group("number"))
                    return (letter, number)
                return ("Z", 9999)

            sorted_inventories = sorted(inventories, key=batch_sort_key)

            inventory_list = []
            for inv in sorted_inventories:
                inventory_list.append({
                    'inventoryV2_id': inv.inventoryV2_id,
                    'itemname': inv.itemname,
                    'quantity': inv.quantity,
                    'metric': inv.metric,
                    'unitCost': inv.unitCost,
                    'totalCost': inv.totalCost,
                    'amountPaid': inv.amountPaid,
                    'unitPrice': inv.unitPrice,
                    'BatchNumber': inv.BatchNumber,
                    'Suppliername': inv.Suppliername,
                    'Supplier_location': inv.Supplier_location,
                    'ballance': inv.ballance,
                    'note': inv.note,
                    'created_at': inv.created_at.strftime('%Y-%m-%d')
                })

            return make_response(jsonify({'inventories': inventory_list}), 200)

        except Exception as e:
            return make_response(jsonify({'message': 'Error fetching inventory', 'error': str(e)}), 500)


class ProcessInventoryV2(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()
        current_user_id = get_jwt_identity()

        # Required fields for processing inventory
        required_fields = [
            'source_inventory_id', 'processed_items', 'note'
        ]
        if not all(field in data for field in required_fields):
            return {'message': 'Missing required fields'}, 400

        source_inventory_id = data['source_inventory_id']
        processed_items = data['processed_items']  # List of processed items
        note = data['note']

        try:
            # ✅ Fetch source inventory item
            source_item = InventoryV2.query.get(source_inventory_id)
            if not source_item:
                return {'message': 'Source inventory item not found'}, 404

            # ✅ Validate processed items
            total_processed_quantity = 0
            for item in processed_items:
                if not all(field in item for field in ['itemname', 'quantity', 'metric', 'unitPrice']):
                    return {'message': 'Missing fields in processed items'}, 400
                total_processed_quantity += item['quantity']

            # ✅ Ensure we're not processing more than available
            if source_item.quantity < total_processed_quantity:
                return {'message': 'Insufficient inventory quantity for processing'}, 400

            # ✅ Calculate cost allocation based on quantity ratio
            processed_inventory_items = []
            
            for item_data in processed_items:
                # Calculate the cost allocation for this processed item
                quantity_ratio = item_data['quantity'] / total_processed_quantity
                allocated_cost = source_item.totalCost * quantity_ratio
                allocated_amount_paid = source_item.amountPaid * quantity_ratio
                
                # Calculate unit cost based on allocated cost
                unit_cost = allocated_cost / item_data['quantity'] if item_data['quantity'] > 0 else 0

                # Create new inventory item for the processed product
                new_processed_item = InventoryV2(
                    itemname=item_data['itemname'],
                    initial_quantity=item_data['quantity'],
                    quantity=item_data['quantity'],
                    metric=item_data['metric'],
                    unitCost=unit_cost,
                    totalCost=allocated_cost,
                    amountPaid=allocated_amount_paid,
                    unitPrice=item_data['unitPrice'],
                    BatchNumber=source_item.BatchNumber,  # Same batch number
                    user_id=current_user_id,
                    Trasnaction_type_credit=item_data['quantity'],  # Credit for new items
                    Transcation_type_debit=0.0,
                    paymentRef=source_item.paymentRef,
                    Suppliername=source_item.Suppliername,
                    Supplier_location=source_item.Supplier_location,
                    ballance=item_data['quantity'],
                    note=f"Processed from {source_item.itemname}.",
                    source=source_item.source
                )

                db.session.add(new_processed_item)
                processed_inventory_items.append({
                    'itemname': item_data['itemname'],
                    'quantity': item_data['quantity'],
                    'metric': item_data['metric'],
                    'new_item_id': new_processed_item.inventoryV2_id
                })

            # ✅ Deduct the processed quantity from source item
            source_item.quantity -= total_processed_quantity
            source_item.ballance = source_item.quantity
            source_item.Transcation_type_debit = total_processed_quantity
            source_item.note = f"Processed into multiple items. {note}"

            db.session.commit()

            return {
                'message': 'Inventory processed successfully',
                'processed_items': processed_inventory_items,
                'source_item_remaining_quantity': source_item.quantity
            }, 201

        except Exception as e:
            db.session.rollback()
            return {'message': 'Error processing inventory', 'error': str(e)}, 500


class DistributeInventoryV2(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()
        current_user_id = get_jwt_identity()

        required_fields = [
            'shop_id', 'inventoryV2_id', 'quantity', 'itemname',
            'unitCost', 'amountPaid', 'BatchNumber', 'created_at', 'metric'
        ]
        if not all(field in data for field in required_fields):
            return {'message': 'Missing required fields'}, 400

        shop_id = data['shop_id']
        inventoryV2_id = data['inventoryV2_id']
        quantity = data['quantity']
        metric = data['metric']
        itemname = data['itemname']
        unitCost = data['unitCost']
        amountPaid = data['amountPaid']
        BatchNumber = data['BatchNumber']

        try:
            distribution_date = parser.isoparse(data['created_at'])
        except ValueError:
            return {'message': 'Invalid date format'}, 400

        # ✅ Fetch inventory item
        inventory_item = InventoryV2.query.get(inventoryV2_id)
        if not inventory_item:
            return {'message': 'Inventory item not found'}, 404

        # ✅ Ensure enough stock is available
        if inventory_item.quantity < quantity:
            return {'message': 'Insufficient inventory quantity'}, 400

        try:
            # ✅ Deduct stock immediately
            inventory_item.quantity -= quantity

            # ✅ Create transfer record
            new_transfer = TransfersV2(
                shop_id=shop_id,
                inventoryV2_id=inventoryV2_id,
                quantity=quantity,
                metric=metric,
                total_cost=unitCost * quantity,
                BatchNumber=BatchNumber,
                user_id=current_user_id,
                itemname=itemname,
                amountPaid=amountPaid,
                unitCost=unitCost,
                created_at=distribution_date,
                status="Not Received"
            )

            db.session.add(new_transfer)
            db.session.commit()

            # ✅ Send push notification
            self.send_push_to_shop(shop_id, itemname)

            return {
                'message': 'Transfer created successfully and notification sent.',
                'transfer_id': new_transfer.transferv2_id
            }, 201

        except Exception as e:
            db.session.rollback()
            return {'message': 'Error creating transfer', 'error': str(e)}, 500


    def send_push_to_shop(self, shop_id, itemname):
        """Send push notification to all subscriptions for a shop."""
        subscriptions = PushSubscription.query.filter_by(shop_id=shop_id).all()
        if not subscriptions:
            print(f"No push subscriptions found for shop {shop_id}")
            return

        # ✅ Fetch VAPID keys from app config
        vapid_private_key = current_app.config.get("VAPID_PRIVATE_KEY")
        vapid_email = current_app.config.get("VAPID_EMAIL")

        payload = {
            "title": "New Stock Alert",
            "body": f"New stock of {itemname} has been distributed to your shop. Please receive it.",
            "icon": "/logo192.png",
        }

        for sub in subscriptions:
            try:
                webpush(
                    subscription_info={
                        "endpoint": sub.endpoint,
                        "keys": {
                            "p256dh": sub.p256dh,
                            "auth": sub.auth,
                        },
                    },
                    data=json.dumps(payload),
                    vapid_private_key=vapid_private_key,
                    vapid_claims={"sub": vapid_email},
                )
                print(f"Push sent to shop {shop_id} subscriber {sub.id}")
            except WebPushException as e:
                print(f"Push failed for {sub.id}: {repr(e)}")


class ReceiveTransfer(Resource):
    @jwt_required()
    def patch(self, transfer_id):
        transfer = TransfersV2.query.get(transfer_id)
        if not transfer:
            return {'message': 'Transfer not found'}, 404

        if transfer.status == "Received":
            return {'message': 'Transfer already received'}, 400

        try:
            # ✅ Add to shop stock (inventory already deducted earlier)
            new_shop_stock = ShopStockV2(
                shop_id=transfer.shop_id,
                transferv2_id=transfer.transferv2_id,
                inventoryv2_id=transfer.inventoryV2_id,
                quantity=transfer.quantity,
                total_cost=transfer.unitCost * transfer.quantity,
                itemname=transfer.itemname,
                metric=transfer.metric,
                BatchNumber=transfer.BatchNumber,
                unitPrice=transfer.unitCost
            )

            transfer.status = "Received"

            db.session.add(new_shop_stock)
            db.session.commit()

            return {'message': 'Transfer received successfully and stock added to shop.'}, 200

        except Exception as e:
            db.session.rollback()
            return {'message': 'Error receiving transfer', 'error': str(e)}, 500

class DeclineTransfer(Resource):
    @jwt_required()
    def patch(self, transfer_id):
        transfer = TransfersV2.query.get(transfer_id)
        if not transfer:
            return {'message': 'Transfer not found'}, 404

        # 🚫 Ensure only "Not Received" transfers can be declined
        if transfer.status != "Not Received":
            return {'message': f'Transfer cannot be declined. Current status: {transfer.status}'}, 400

        try:
            # ✅ Return stock to inventory
            inventory_item = InventoryV2.query.get(transfer.inventoryV2_id)
            if not inventory_item:
                return {'message': 'Original inventory item not found'}, 404

            inventory_item.quantity += transfer.quantity

            # ✅ Update transfer status
            transfer.status = "Declined"

            db.session.commit()

            return {
                'message': 'Transfer declined successfully. Stock returned to inventory.',
                'transfer_id': transfer.transferv2_id,
                'restored_quantity': transfer.quantity
            }, 200

        except Exception as e:
            db.session.rollback()
            return {'message': 'Error declining transfer', 'error': str(e)}, 500


class PendingTransfers(Resource):
    @jwt_required()
    def get(self):
        try:
            # Get shop_id from query params
            shop_id = request.args.get("shop_id", type=int)
            if not shop_id:
                return {"message": "shop_id is required"}, 400

            # Filter only pending transfers for this shop
            pending = TransfersV2.query.filter_by(
                status="Not Received",
                shop_id=shop_id
            ).all()

            result = []
            for t in pending:
                result.append({
                    "transferv2_id": t.transferv2_id,
                    "shop_id": t.shop_id,
                    "inventoryV2_id": t.inventoryV2_id,
                    "itemname": t.itemname,
                    "quantity": t.quantity,
                    "metric": t.metric,
                    "unitCost": t.unitCost,
                    "amountPaid": t.amountPaid,
                    "total_cost": t.total_cost,
                    "BatchNumber": t.BatchNumber,
                    "created_at": t.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    "status": t.status
                })

            return {"pending_transfers": result}, 200

        except Exception as e:
            return {"message": "Error fetching pending transfers", "error": str(e)}, 500

# class DeleteShopStockV2(Resource):
#     @jwt_required()
#     # @check_role('manager')
#     def delete(self, shop_stockV2_id):
#         current_user_id = get_jwt_identity()

#         shop_stock = ShopStockV2.query.get(shop_stockV2_id)
#         if not shop_stock:
#             return {'message': 'ShopStock record not found'}, 404

#         # 🔁 Use the correct attribute name based on your model
#         transfer = TransfersV2.query.get(shop_stock.transferv2_id)
#         if not transfer:
#             return {'message': 'Related Transfer record not found'}, 404

#         inventory_item = InventoryV2.query.get(shop_stock.inventoryv2_id)
#         if not inventory_item:
#             return {'message': 'Related Inventory item not found'}, 404

#         try:
#             # Restore quantity
#             inventory_item.quantity += shop_stock.quantity
#             print(f"Reverted inventory quantity for Inventory ID {inventory_item.inventoryV2_id}. New quantity: {inventory_item.quantity}")

#             db.session.delete(transfer)
#             db.session.delete(shop_stock)
#             db.session.commit()

#             return {
#                 'message': 'ShopStock and associated records deleted successfully',
#                 'details': {
#                     'shop_stockV2_id': int(shop_stockV2_id),
#                     'inventoryV2_id': int(inventory_item.inventoryV2_id),
#                     'transferV2_id': int(transfer.transferv2_id)
#                 }
#             }, 200

#         except Exception as e:
#             db.session.rollback()
#             return {'message': 'Error deleting ShopStock', 'error': str(e)}, 500

class DeleteShopStockV2(Resource):
    @jwt_required()
    def delete(self, stockv2_id):
        current_user_id = get_jwt_identity()
        
        try:
            # Get JSON data from request
            data = request.get_json()
            if not data:
                return {'message': 'Request body must be JSON'}, 400
                
            quantity_to_delete = data.get('quantity')
            if quantity_to_delete is None:
                return {'message': 'Quantity is required'}, 400
            
            try:
                quantity_to_delete = int(quantity_to_delete)
            except (ValueError, TypeError):
                return {'message': 'Quantity must be an integer'}, 400

            # Start a new session to avoid conflicts
            db.session.begin_nested()

            shop_stock = ShopStockV2.query.get(stockv2_id)
            if not shop_stock:
                db.session.rollback()
                return {'message': 'ShopStock record not found'}, 404

            # Validate the quantity to delete
            if quantity_to_delete <= 0:
                db.session.rollback()
                return {'message': 'Quantity to delete must be positive'}, 400
                
            if quantity_to_delete > shop_stock.quantity:
                db.session.rollback()
                return {
                    'message': f'Cannot delete more than available quantity ({shop_stock.quantity})',
                    'available_quantity': shop_stock.quantity
                }, 400

            # Check if transfer exists, but don't fail if it doesn't
            transfer = None
            if shop_stock.transferv2_id:
                transfer = TransfersV2.query.get(shop_stock.transferv2_id)
                if not transfer:
                    current_app.logger.warning(f"Transfer record {shop_stock.transferv2_id} not found for stock {stockv2_id}")

            # Check if inventory item exists
            inventory_item = None
            if shop_stock.inventoryv2_id:
                inventory_item = InventoryV2.query.get(shop_stock.inventoryv2_id)
                if not inventory_item:
                    current_app.logger.warning(f"Inventory record {shop_stock.inventoryv2_id} not found for stock {stockv2_id}")

            # If inventory item doesn't exist, we can't restore quantity to inventory
            # But we can still process the return/delete operation
            if not inventory_item:
                # Create a log entry or alternative handling for missing inventory
                current_app.logger.warning(f"Processing return without inventory restoration for stock {stockv2_id}")
                
                if quantity_to_delete < shop_stock.quantity:
                    # Partial deletion without inventory restoration
                    shop_stock.quantity -= quantity_to_delete
                    
                    return_record = ReturnsV2(
                        stockv2_id=shop_stock.stockv2_id,
                        inventoryv2_id=shop_stock.inventoryv2_id,  # Use the ID even if record doesn't exist
                        shop_id=shop_stock.shop_id,
                        quantity=quantity_to_delete,
                        returned_by=current_user_id,
                        return_date=datetime.utcnow(),
                        reason="Partial return - inventory item not available"
                    )
                    db.session.add(return_record)
                else:
                    # Full deletion without inventory restoration
                    return_record = ReturnsV2(
                        stockv2_id=shop_stock.stockv2_id,
                        inventoryv2_id=shop_stock.inventoryv2_id,  # Use the ID even if record doesn't exist
                        shop_id=shop_stock.shop_id,
                        quantity=shop_stock.quantity,
                        returned_by=current_user_id,
                        return_date=datetime.utcnow(),
                        reason="Full return - inventory item not available"
                    )
                    db.session.add(return_record)
                    
                    # Delete related return records first
                    ReturnsV2.query.filter_by(stockv2_id=shop_stock.stockv2_id).delete()
                    
                    # Only delete transfer if it exists and has no other dependencies
                    if transfer:
                        other_stocks = ShopStockV2.query.filter(
                            ShopStockV2.transferv2_id == transfer.transferv2_id,
                            ShopStockV2.stockv2_id != shop_stock.stockv2_id
                        ).count()
                        
                        if other_stocks == 0:
                            db.session.delete(transfer)
                    
                    db.session.delete(shop_stock)
            else:
                # Original logic with inventory restoration
                if quantity_to_delete < shop_stock.quantity:
                    shop_stock.quantity -= quantity_to_delete
                    inventory_item.quantity += quantity_to_delete
                    
                    return_record = ReturnsV2(
                        stockv2_id=shop_stock.stockv2_id,
                        inventoryv2_id=inventory_item.inventoryV2_id,
                        shop_id=shop_stock.shop_id,
                        quantity=quantity_to_delete,
                        returned_by=current_user_id,
                        return_date=datetime.utcnow(),
                        reason="Partial return to inventory"
                    )
                    db.session.add(return_record)
                else:
                    inventory_item.quantity += shop_stock.quantity
                    
                    return_record = ReturnsV2(
                        stockv2_id=shop_stock.stockv2_id,
                        inventoryv2_id=inventory_item.inventoryV2_id,
                        shop_id=shop_stock.shop_id,
                        quantity=shop_stock.quantity,
                        returned_by=current_user_id,
                        return_date=datetime.utcnow(),
                        reason="Full return to inventory"
                    )
                    db.session.add(return_record)
                    
                    ReturnsV2.query.filter_by(stockv2_id=shop_stock.stockv2_id).delete()
                    
                    if transfer:
                        other_stocks = ShopStockV2.query.filter(
                            ShopStockV2.transferv2_id == transfer.transferv2_id,
                            ShopStockV2.stockv2_id != shop_stock.stockv2_id
                        ).count()
                        
                        if other_stocks == 0:
                            db.session.delete(transfer)
                    
                    db.session.delete(shop_stock)

            db.session.commit()
            
            # Build response
            response_data = {
                'message': 'Return processed successfully',
                'details': {
                    'stockv2_id': int(stockv2_id),
                    'returned_quantity': quantity_to_delete,
                    'return_record_id': return_record.returnv2_id
                }
            }
            
            # Add optional details
            if transfer:
                response_data['details']['transferv2_id'] = int(transfer.transferv2_id)
            
            if inventory_item:
                response_data['details']['inventoryv2_id'] = int(inventory_item.inventoryV2_id)
                response_data['details']['inventory_restored'] = True
            else:
                response_data['details']['inventoryv2_id'] = shop_stock.inventoryv2_id
                response_data['details']['inventory_restored'] = False
                response_data['details']['note'] = 'Inventory item not found - quantity not restored to inventory'
            
            if quantity_to_delete < shop_stock.quantity:
                response_data['details']['remaining_quantity'] = shop_stock.quantity
            
            return response_data, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            current_app.logger.error(f"Database error in DeleteShopStockV2: {str(e)}")
            return {
                'message': 'Database operation failed',
                'error': str(e),
                'type': 'database_error'
            }, 500
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Unexpected error in DeleteShopStockV2: {str(e)}")
            return {
                'message': 'An unexpected error occurred',
                'error': str(e),
                'type': 'unexpected_error'
            }, 500


class GetTransferV2(Resource):
    @jwt_required()
    def get(self):
        transfers = TransfersV2.query.all()
        all_transfers = []

        for transfer in transfers:
            user = Users.query.filter_by(users_id=transfer.user_id).first()
            shop = Shops.query.filter_by(shops_id=transfer.shop_id).first()
            
            username = user.username if user else "Unknown User"
            shopname = shop.shopname if shop else "Unknown Shop"
        
            all_transfers.append({
                "transferv2_id": transfer.transferv2_id,  # lowercase to match model
                "shop_id": transfer.shop_id,
                "inventoryV2_id": transfer.inventoryV2_id,      
                "quantity": transfer.quantity,             
                "metric": transfer.metric,
                "total_cost": transfer.total_cost,  # lowercase to match model
                "BatchNumber": transfer.BatchNumber,
                "user_id": transfer.user_id,
                "username": username,
                "shop_name": shopname,
                "itemname": transfer.itemname,
                "status": transfer.status,
                "amountPaid": transfer.amountPaid,
                "status":transfer.status,
                "unitCost": transfer.unitCost,
                "created_at": transfer.created_at.strftime('%Y-%m-%d %H:%M:%S') if transfer.created_at else None,
            })

        return jsonify({
            "status": "success",
            "data": all_transfers,
            "count": len(all_transfers),
            "message": "Transfers retrieved successfully"
        })


class GetTransferByIdV2(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self, transferV2_id):
        transfer = TransfersV2.query.filter_by(transferV2_id=transferV2_id).first()
        
        if not transfer:
            return make_response(jsonify({"message": "Transfer not found"})), 404
        
        user = Users.query.filter_by(users_id=transfer.user_id).first()
        shop = Shops.query.filter_by(shops_id=transfer.shop_id).first()
        
        username = user.username if user else "Unknown User"
        shopname = shop.shopname if shop else "Unknown Shop"
    
        transfer_data = {
            "transferV2_id": transfer.transferV2_id,
            "shop_id": transfer.shop_id,
            "inventoryV2_id": transfer.inventoryV2_id,      
            "quantity": transfer.quantity,             
            "metric": transfer.metric,
            "totalCost": transfer.total_cost,
            "batchnumber": transfer.BatchNumber,
            "user_id": transfer.user_id,
            "username": username,
            "shop_name": shopname,
            "itemname": transfer.itemname,
            "amountPaid": transfer.amountPaid,
            "unitCost": transfer.unitCost,
            "created_at": transfer.created_at,
        }

        return make_response(jsonify(transfer_data), 200)


class UpdateTransferV2(Resource):
    @jwt_required()
    @check_role('manager')
    def put(self, transferV2_id):
        data = request.get_json()
        transfer = TransfersV2.query.filter_by(transferV2_id=transferV2_id).first()

        if not transfer:
            return make_response(jsonify({"message": "Transfer not found"}), 404)

        transfer.shop_id = data.get("shop_id", transfer.shop_id)
        transfer.inventoryV2_id = data.get("inventoryV2_id", transfer.inventoryV2_id)
        transfer.quantity = data.get("quantity", transfer.quantity)
        transfer.metric = data.get("metric", transfer.metric)
        transfer.total_cost = data.get("totalCost", transfer.total_cost)
        transfer.BatchNumber = data.get("batchnumber", transfer.BatchNumber)
        transfer.user_id = data.get("user_id", transfer.user_id)
        transfer.itemname = data.get("itemname", transfer.itemname)
        transfer.amountPaid = data.get("amountPaid", transfer.amountPaid)
        transfer.unitCost = data.get("unitCost", transfer.unitCost)

        if 'date' in data:
            try:
                transfer.created_at = datetime.strptime(data['date'], '%Y-%m-%d')
            except ValueError:
                return make_response(jsonify({"message": "Invalid date format. Use YYYY-MM-DD."}), 400)

        db.session.commit()

        return make_response(jsonify({"message": "Transfer updated successfully"}), 200)



class AddInventoryV2(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()
        current_user_id = get_jwt_identity()

        required_fields = [
            'itemname', 'quantity', 'metric', 'unitCost', 'amountPaid', 'unitPrice',
            'Suppliername', 'Supplier_location', 'created_at'
        ]
        if not all(field in data for field in required_fields):
            return {'message': 'Missing required fields'}, 400

        # Extract fields
        itemname = data.get('itemname')
        quantity = data.get('quantity')
        metric = data.get('metric')
        unitCost = data.get('unitCost')
        amountPaid = data.get('amountPaid')
        unitPrice = data.get('unitPrice')
        Suppliername = data.get('Suppliername')
        Supplier_location = data.get('Supplier_location')
        source = data.get('source')
        paymentRef = data.get('paymentRef')
        note = data.get('note', '')
        created_at_str = data.get('created_at')

        try:
            created_at = datetime.strptime(created_at_str, "%Y-%m-%d")
        except ValueError:
            return {'message': 'Invalid date format. Please use YYYY-MM-DD for created_at.'}, 400

        totalCost = unitCost * quantity
        balance = totalCost - amountPaid

        last_inventory = InventoryV2.query.order_by(InventoryV2.inventoryV2_id.desc()).first()
        next_batch_number = 1 if not last_inventory else last_inventory.inventoryV2_id + 1
        batch_code = InventoryV2.generate_batch_code(
            Suppliername, Supplier_location, itemname, created_at, next_batch_number
        )
        debit_account_value = unitPrice * quantity

        if not source or len(source.strip()) == 0:
            source = "Unknown"

        try:
            # ✅ Step 1: Check or create supplier
            supplier = Suppliers.query.filter_by(
                supplier_name=Suppliername,
                supplier_location=Supplier_location
            ).first()

            if not supplier:
                supplier = Suppliers(
                    supplier_name=Suppliername,
                    supplier_location=Supplier_location,
                    total_amount_received=amountPaid,
                    email=data.get('email'),
                    phone_number=data.get('phone_number'),
                    items_sold=json.dumps([itemname])  # store as JSON string
                )
                db.session.add(supplier)
                db.session.flush()  # ensures supplier_id is available immediately
            else:
                # Update totals and items
                supplier.total_amount_received += amountPaid

                # ✅ Ensure items_sold is a valid list
                if not supplier.items_sold:
                    items_list = []
                else:
                    try:
                        items_list = json.loads(supplier.items_sold)
                    except Exception:
                        items_list = supplier.items_sold.split(",") if isinstance(supplier.items_sold, str) else []

                # ✅ Add new item if not already there
                if itemname not in items_list:
                    items_list.append(itemname)

                supplier.items_sold = json.dumps(items_list)
                db.session.flush()  # ensure supplier_id is updated before history insert

            # ✅ Step 2: Add supplier history
            supplier_history = SupplierHistory(
                supplier_id=supplier.supplier_id,
                amount_received=amountPaid,
                transaction_date=datetime.utcnow(),
                item_bought=itemname
            )
            db.session.add(supplier_history)

            # ✅ Step 3: Handle bank transaction if applicable
            if source not in ["Unknown", "External funding"]:
                account = BankAccount.query.filter_by(Account_name=source).first()
                if not account:
                    return {'message': f'Bank account with name "{source}" not found'}, 404

                account.Account_Balance -= amountPaid
                db.session.add(account)

                transaction = BankingTransaction(
                    account_id=account.id,
                    Transaction_type_debit=amountPaid,
                    Transaction_type_credit=None
                )
                db.session.add(transaction)

            # ✅ Step 4: Add inventory record
            new_inventory = InventoryV2(
                itemname=itemname,
                initial_quantity=quantity,
                quantity=quantity,
                metric=metric,
                unitCost=unitCost,
                totalCost=totalCost,
                amountPaid=amountPaid,
                unitPrice=unitPrice,
                BatchNumber=batch_code,
                user_id=current_user_id,
                Suppliername=Suppliername,
                Supplier_location=Supplier_location,
                ballance=balance,
                note=note,
                created_at=created_at,
                source=source,
                Trasnaction_type_credit=amountPaid,
                Transcation_type_debit=debit_account_value,
                paymentRef=paymentRef
            )

            db.session.add(new_inventory)
            db.session.commit()

            return {
                'message': 'Inventory and supplier records added successfully',
                'BatchNumber': batch_code,
                'SupplierID': supplier.supplier_id
            }, 201

        except Exception as e:
            db.session.rollback()
            return {'message': 'Error adding inventory', 'error': str(e)}, 500


class GetAllInventoryV2(Resource):
    @jwt_required()
    # @check_role('manager')
    def get(self):
        inventories = InventoryV2.query.order_by(InventoryV2.created_at.desc()).all()

        all_inventory = [{
            "inventoryV2_id": inventory.inventoryV2_id,
            "itemname": inventory.itemname,
            "initial_quantity": inventory.initial_quantity,
            "remaining_quantity": inventory.quantity,
            "metric": inventory.metric,
            "totalCost": inventory.totalCost,
            "unitCost": inventory.unitCost,
            "batchnumber": inventory.BatchNumber,
            "amountPaid": inventory.amountPaid,
            "balance": inventory.ballance,
            "note": inventory.note,
            "created_at": inventory.created_at,
            "unitPrice": inventory.unitPrice,
            "source": inventory.source,
            "paymentRef": inventory.paymentRef
        } for inventory in inventories]

        return make_response(jsonify(all_inventory), 200)

class InventoryResourceByIdV2(Resource):
    @jwt_required()
    # @check_role('manager')
    def get(self, inventoryV2_id):
        inventory = InventoryV2.query.get(inventoryV2_id)
   
        if inventory:
            return {
                "inventoryV2_id": inventory.inventoryV2_id,
                "itemname": inventory.itemname,
                "initial_quantity": inventory.initial_quantity,
                "quantity": inventory.quantity,
                "metric": inventory.metric,
                "totalCost": inventory.totalCost,
                "unitCost": inventory.unitCost,
                "batchnumber": inventory.BatchNumber,
                "amountPaid": inventory.amountPaid,
                "balance": inventory.ballance,
                "note": inventory.note,
                "created_at": inventory.created_at.strftime('%Y-%m-%d') if inventory.created_at else None,
                "unitPrice": inventory.unitPrice,
                "source": inventory.source,
                "paymentRef": inventory.paymentRef,
                "Suppliername": inventory.Suppliername,
                "Supplier_location": inventory.Supplier_location
            }, 200
        else:
            return {"error": "Inventory not found"}, 404
        
    @jwt_required()
    def delete(self, inventoryV2_id):
        inventory = InventoryV2.query.get(inventoryV2_id)

        if not inventory:
            return {"error": "Inventory not found"}, 404
        
        try:
            # Check what the actual foreign key column name is in your models
            # Common options: inventory_id, inventoryv2_id, inventory_V2_id
            transfers = TransfersV2.query.filter_by(inventory_id=inventoryV2_id).all()
            # Check what the actual foreign key column name is in your models
            # Common options: inventory_id, inventoryv2_id, inventory_V2_id
            transfers = TransfersV2.query.filter_by(inventory_id=inventoryV2_id).all()
            for transfer in transfers:
                db.session.delete(transfer)
            
            # Check what the actual foreign key column name is in your models
            shop_stocks = ShopStockV2.query.filter_by(inventory_id=inventoryV2_id).all()
            # Check what the actual foreign key column name is in your models
            shop_stocks = ShopStockV2.query.filter_by(inventory_id=inventoryV2_id).all()
            for stock in shop_stocks:
                db.session.delete(stock)

            db.session.delete(inventory)
            db.session.commit()

            return {"message": "Inventory deleted successfully"}, 200
        
        except Exception as e:
            db.session.rollback()
            return {"message": "Error deleting inventory", "error": str(e)}, 500

    @jwt_required()
    def put(self, inventoryV2_id):
        data = request.get_json()
        inventory = InventoryV2.query.get(inventoryV2_id)
        if not inventory:
            return {'message': 'Inventory not found'}, 404

        try:
            itemname = data.get('itemname', inventory.itemname)
            initial_quantity = int(data.get('initial_quantity', inventory.initial_quantity))
            unitCost = float(data.get('unitCost', inventory.unitCost))
            unitPrice = float(data.get('unitPrice', inventory.unitPrice))
            totalCost = unitCost * initial_quantity
            amountPaid = float(data.get('amountPaid', inventory.amountPaid))
            balance = totalCost - amountPaid
            paymentRef = data.get('paymentRef', inventory.paymentRef)  # Added paymentRef
            Suppliername = data.get('Suppliername', inventory.Suppliername)
            Supplier_location = data.get('Supplier_location', inventory.Supplier_location)
            note = data.get('note', inventory.note)

            created_at_str = data.get('created_at', None)
            if created_at_str:
                try:
                    created_at = datetime.strptime(created_at_str, '%Y-%m-%d')
                except ValueError:
                    return {'message': 'Invalid date format for created_at, expected YYYY-MM-DD'}, 400
            else:
                created_at = inventory.created_at

            inventory.itemname = itemname
            inventory.initial_quantity = initial_quantity
            inventory.unitCost = unitCost
            inventory.unitPrice = unitPrice
            inventory.totalCost = totalCost
            inventory.amountPaid = amountPaid
            inventory.balance = balance
            inventory.paymentRef = paymentRef  # Added paymentRef assignment
            inventory.Suppliername = Suppliername
            inventory.Supplier_location = Supplier_location
            inventory.note = note
            inventory.created_at = created_at

            # Check what the actual foreign key column name is in your models
            transfers = TransfersV2.query.filter_by(inventoryV2_id=inventoryV2_id).all()
            for transfer in transfers:
                transfer.itemname = itemname
                transfer.unitCost = unitCost
                transfer.amountPaid = amountPaid
                transfer.paymentRef = paymentRef  # Added paymentRef update for transfers

            # Check what the actual foreign key column name is in your models
            shop_stocks = ShopStockV2.query.filter_by(inventoryv2_id=inventoryV2_id).all()
            for stock in shop_stocks:
                stock.itemname = itemname
                stock.unitPrice = unitPrice

            db.session.commit()
            return {'message': 'Inventory and related records updated successfully'}, 200

        except ValueError as e:
            db.session.rollback()
            return {'message': 'Invalid data type', 'error': str(e)}, 400
        except Exception as e:
            db.session.rollback()
            return {'message': 'Error updating inventory', 'error': str(e)}, 500

    # @jwt_required()
    # @check_role('manager')
    # def put(self, inventoryV2_id):
    #     data = request.get_json()
    #     inventory = InventoryV2.query.get(inventoryV2_id)
    #     if not inventory:
    #         return {'message': 'Inventory not found'}, 404

    #     try:
    #         itemname = data.get('itemname', inventory.itemname)
    #         initial_quantity = int(data.get('initial_quantity', inventory.initial_quantity))
    #         unitCost = float(data.get('unitCost', inventory.unitCost))
    #         unitPrice = float(data.get('unitPrice', inventory.unitPrice))
    #         totalCost = unitCost * initial_quantity
    #         amountPaid = float(data.get('amountPaid', inventory.amountPaid))
    #         balance = totalCost - amountPaid
    #         Suppliername = data.get('Suppliername', inventory.Suppliername)
    #         Supplier_location = data.get('Supplier_location', inventory.Supplier_location)
    #         note = data.get('note', inventory.note)

            # created_at_str = data.get('created_at', None)
            # if created_at_str:
            #     try:
            #         created_at = datetime.strptime(created_at_str, '%Y-%m-%d')
            #     except ValueError:
            #         return {'message': 'Invalid date format for created_at, expected YYYY-MM-DD'}, 400
            # else:
            #     created_at = inventory.created_at

    #         inventory.itemname = itemname
    #         inventory.initial_quantity = initial_quantity
    #         inventory.unitCost = unitCost
    #         inventory.unitPrice = unitPrice
    #         inventory.totalCost = totalCost
    #         inventory.amountPaid = amountPaid
    #         inventory.balance = balance
    #         inventory.Suppliername = Suppliername
    #         inventory.Supplier_location = Supplier_location
    #         inventory.note = note
    #         inventory.created_at = created_at

            # Check what the actual foreign key column name is in your models
            # transfers = TransfersV2.query.filter_by(inventoryV2_id=inventoryV2_id).all()
            # for transfer in transfers:
            #     transfer.itemname = itemname
            #     transfer.unitCost = unitCost
            #     transfer.amountPaid = amountPaid

            # # Check what the actual foreign key column name is in your models
            # shop_stocks = ShopStockV2.query.filter_by(inventoryv2_id=inventoryV2_id).all()
            # for stock in shop_stocks:
            #     stock.itemname = itemname
            #     stock.unitPrice = unitPrice

    #         db.session.commit()
    #         return {'message': 'Inventory and related records updated successfully'}, 200

    #     except ValueError as e:
    #         db.session.rollback()
    #         return {'message': 'Invalid data type', 'error': str(e)}, 400
    #     except Exception as e:
    #         db.session.rollback()
    #         return {'message': 'Error updating inventory', 'error': str(e)}, 500


class StockDeletionResourceV2(Resource):     
    @jwt_required()
    @check_role('manager')
    def delete(self, stockV2_id):
        stock = ShopStockV2.query.get(stockV2_id)

        if not stock:
            return {"error": "Stock not found"}, 404

        try:
            if stock.inventoryV2_id == 0:
                related_transfers = TransfersV2.query.filter_by(shop_id=stock.shop_id, itemname=stock.itemname).all()
            else:
                related_transfers = TransfersV2.query.filter_by(stockV2_id=stockV2_id).all()

            if related_transfers:
                for transfer in related_transfers:
                    db.session.delete(transfer)

            if stock.inventoryV2_id != 0:
                inventory = InventoryV2.query.get(stock.inventoryV2_id)
                if inventory:
                    inventory.quantity += stock.quantity

            db.session.delete(stock)
            db.session.commit()

            return make_response(jsonify({"message": "Stock deleted successfully"}), 200)

        except Exception as e:
            db.session.rollback()
            error_message = str(e)
            current_app.logger.error(f"Error occurred: {error_message}")
            return jsonify({'error': 'Error deleting stock', 'details': error_message}), 500


class ManualTransferV2(Resource):
    @jwt_required()
    @check_role('manager')
    def post(self):
        data = request.get_json()
        current_user_id = get_jwt_identity()

        MANUAL_TRANSFER_SHOP_ID = 12

        required_fields = ['itemname', 'quantity', 'metric', 'unitCost', 'unitPrice', 'amountPaid']
        if not all(field in data for field in required_fields):
            return {'message': 'Missing required fields'}, 400

        try:
            itemname = data['itemname']
            quantity = float(data['quantity'])
            metric = data['metric'].strip().lower()
            unitCost = float(data['unitCost'])
            unitPrice = float(data['unitPrice'])
            amountPaid = float(data['amountPaid'])
            batch_number = itemname

            if metric == "tray":
                quantity *= 30
                metric = "egg"

            new_transfer = TransfersV2(
                shop_id=MANUAL_TRANSFER_SHOP_ID,
                inventoryV2_id=None,
                quantity=quantity,
                metric=metric,
                total_cost=unitCost * quantity,
                BatchNumber=batch_number,
                user_id=current_user_id,
                itemname=itemname,
                amountPaid=amountPaid,
                unitCost=unitCost
            )

            db.session.add(new_transfer)
            db.session.commit()

            existing_stock = ShopStockV2.query.filter_by(
                shop_id=MANUAL_TRANSFER_SHOP_ID,
                itemname=itemname,
                metric=metric,
                BatchNumber=batch_number
            ).first()

            if existing_stock:
                existing_stock.quantity += quantity
                existing_stock.total_cost += unitCost * quantity
                existing_stock.unitPrice = unitPrice
            else:
                new_shop_stock = ShopStockV2(
                    shop_id=MANUAL_TRANSFER_SHOP_ID,
                    inventoryV2_id=None,
                    transferV2_id=new_transfer.transferV2_id,
                    quantity=quantity,
                    total_cost=unitCost * quantity,
                    itemname=itemname,
                    metric=metric,
                    BatchNumber=batch_number,
                    unitPrice=unitPrice
                )
                db.session.add(new_shop_stock)

            db.session.commit()

            return {'message': 'Manual stock added successfully'}, 201

        except ValueError:
            db.session.rollback()
            return {'message': 'Invalid data type provided'}, 400

        except Exception as e:
            db.session.rollback()
            return {'message': 'Error processing request', 'error': str(e)}, 500 