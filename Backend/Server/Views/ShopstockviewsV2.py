# Server/Views/ShopstockviewsV2.py

from flask_restful import Resource, reqparse
from Server.Models.Shops import Shops
from Server.Models.ShopstockV2 import ShopStockV2
from Server.Models.TransferV2 import TransfersV2
from Server.Models.Users import Users
from Server.Models.InventoryV2 import InventoryV2
from Server.Models.StoreReturn import ReturnsV2
from Server.Models.Expenses import Expenses
from Server.Models.Sales import Sales
from app import db
from flask import current_app
from functools import wraps
from flask import request, make_response, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import joinedload
import datetime 
from datetime import datetime
from sqlalchemy import func

def check_role(required_role):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = Users.query.get(current_user_id)
            if user and user.role != required_role:
                return make_response(jsonify({"error": "Unauthorized access"}), 403)
            return fn(*args, **kwargs)
        return decorator
    return wrapper

class AvailableBatchesByShopResourceV2(Resource):
    @jwt_required()
    def get(self):
        shop_id = request.args.get('shop_id')
        if not shop_id:
            return jsonify({"error": "shop_id parameter is required"}), 400

        batches = db.session.query(ShopStockV2.BatchNumber).filter(
            ShopStockV2.shop_id == shop_id,
            ShopStockV2.quantity > 0
        ).distinct().all()

        batch_numbers = [batch.BatchNumber for batch in batches]
        return jsonify(batch_numbers)

class AvailableBatchesResourceV2(Resource):
    @jwt_required()
    def get(self):
        batches = (
            db.session.query(ShopStockV2.BatchNumber)
            .group_by(ShopStockV2.BatchNumber)
            .having(func.sum(ShopStockV2.quantity) > 0)
            .all()
        )

        batch_numbers = [batch.BatchNumber for batch in batches]
        return jsonify(batch_numbers)

class BatchDetailsResourceForShopV2(Resource):
    @jwt_required()
    def get(self):
        batch_number = request.args.get('BatchNumber')
        shop_id = request.args.get('shop_id')
        
        if not batch_number or not shop_id:
            return {'message': 'Batch number and shop ID are required'}, 400
        
        shop_stock_items = ShopStockV2.query.filter_by(
            BatchNumber=batch_number, 
            shop_id=shop_id
        ).filter(ShopStockV2.quantity > 0).all()
        
        if not shop_stock_items:
            return {'message': 'No available stock for the given batch number and shop ID'}, 404

        shop_stock_item = shop_stock_items[0]
        inventory_item = InventoryV2.query.get(shop_stock_item.inventoryv2_id)

        sales_details = {
            'itemname': shop_stock_item.itemname,
            'metric': inventory_item.metric if inventory_item else shop_stock_item.metric,
            'unit_price': shop_stock_item.unitPrice,
            'BatchNumber': shop_stock_item.BatchNumber,
            'stockv2_id': shop_stock_item.stockv2_id,
            'quantity': shop_stock_item.quantity
        }
        
        return sales_details, 200

class BatchDetailsResourceV2(Resource):
    @jwt_required()
    def get(self):
        batch_number = request.args.get('BatchNumber')
        if not batch_number:
            return {'message': 'Batch number is required'}, 400
        
        shop_stock_items = ShopStockV2.query.filter_by(
            BatchNumber=batch_number
        ).filter(ShopStockV2.quantity > 0).all()
        
        if not shop_stock_items:
            return {'message': 'No available stock for the given batch number'}, 404

        shop_stock_item = shop_stock_items[0]
        inventory_item = InventoryV2.query.get(shop_stock_item.inventoryv2_id)

        sales_details = {
            'itemname': shop_stock_item.itemname,
            'metric': inventory_item.metric if inventory_item else shop_stock_item.metric,
            'unit_price': shop_stock_item.unitPrice,
            'BatchNumber': shop_stock_item.BatchNumber,
            'stockv2_id': shop_stock_item.stockv2_id,
            'quantity': shop_stock_item.quantity
        }
        
        return sales_details, 200

class ShopStockDeleteV2(Resource):
    parser = reqparse.RequestParser()
    parser.add_argument('quantity_to_delete', type=int, required=True, help="Quantity to delete cannot be blank!")

    @jwt_required()
    @check_role('manager')
    def delete(self, shop_id, inventoryV2_id):
        args = self.parser.parse_args()
        quantity_to_delete = args['quantity_to_delete']

        try:
            with db.session.begin_nested():
                shop_stock = ShopStockV2.query.filter_by(
                    shop_id=shop_id, 
                    inventoryv2_id=inventoryV2_id
                ).first()
                
                if not shop_stock:
                    return {"error": f"Stock for InventoryV2 ID {inventoryV2_id} in Shop ID {shop_id} not found"}, 404

                if quantity_to_delete <= 0:
                    return {"error": "Quantity to delete must be positive"}, 400

                if quantity_to_delete > shop_stock.quantity:
                    return {"error": f"Cannot delete {quantity_to_delete} units, only {shop_stock.quantity} available"}, 400

                inventory_item = InventoryV2.query.get(inventoryV2_id)
                if not inventory_item:
                    return {"error": f"InventoryV2 item {inventoryV2_id} not found"}, 404

                unit_cost = shop_stock.total_cost / shop_stock.quantity if shop_stock.quantity > 0 else 0
                remaining_quantity = shop_stock.quantity - quantity_to_delete
                new_total_cost = unit_cost * remaining_quantity

                if remaining_quantity > 0:
                    shop_stock.quantity = remaining_quantity
                    shop_stock.total_cost = new_total_cost
                    db.session.add(shop_stock)
                else:
                    db.session.delete(shop_stock)

                inventory_item.quantity += quantity_to_delete
                db.session.add(inventory_item)

                transfer = TransfersV2.query.filter_by(
                    shop_id=shop_id,
                    inventoryV2_id=inventoryV2_id
                ).first()

                if transfer:
                    if remaining_quantity > 0:
                        transfer.quantity = remaining_quantity
                        transfer.total_cost = new_total_cost
                        db.session.add(transfer)
                    else:
                        db.session.delete(transfer)

                db.session.commit()

            response = {
                "message": "Shop stock deleted successfully",
                "inventory_item": {
                    "inventoryV2_id": inventoryV2_id,
                    "updated_quantity": inventory_item.quantity
                },
                "deleted_stock": {
                    "shop_id": shop_id,
                    "quantity_deleted": quantity_to_delete,
                    "quantity_remaining": remaining_quantity
                }
            }

            return response, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            current_app.logger.error(f"Database error: {str(e)}")
            return {"error": "Database error occurred"}, 500
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Unexpected error: {str(e)}")
            return {"error": "Unexpected error occurred"}, 500

class GetShopStockV2(Resource):
    @jwt_required()
    def get(self):
        try:
            shop_id = request.args.get('shop_id', type=int)
            inventoryV2_id = request.args.get('inventoryV2_id', type=int)

            query = ShopStockV2.query.options(
                joinedload(ShopStockV2.inventory),
                joinedload(ShopStockV2.shop)
            )

            if shop_id:
                query = query.filter_by(shop_id=shop_id)
            if inventoryV2_id:
                query = query.filter_by(inventoryv2_id=inventoryV2_id)

            shop_stocks = query.all()

            shop_stock_list = []
            for stock in shop_stocks:
                shop = stock.shop
                inventory = stock.inventory

                shop_stock_list.append({
                    "stockv2_id": stock.stockv2_id,
                    "shop_id": stock.shop_id,
                    "shop_name": shop.shopname if shop else "Unknown",
                    "inventoryV2_id": stock.inventoryv2_id,
                    "itemname": stock.itemname,
                    "batchnumber": stock.BatchNumber,
                    "metric": inventory.metric if inventory else stock.metric,
                    "quantity": stock.quantity,
                    "total_cost": stock.total_cost,
                    "unitPrice": stock.unitPrice,
                    "stock_type": "InventoryV2" if stock.inventoryv2_id else "transfer" if stock.transferv2_id else "direct"
                })

            return make_response(jsonify({"shop_stocks": shop_stock_list}), 200)

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "Database error occurred"}, 500

class GetShopStockByShopIdV2(Resource):
    @jwt_required()
    def get(self, shop_id):
        try:
            shop = Shops.query.get(shop_id)
            if not shop:
                return {"error": f"Shop {shop_id} not found"}, 404
            
            shop_stocks = ShopStockV2.query.filter_by(shop_id=shop_id).options(
                joinedload(ShopStockV2.inventory)
            ).all()
            
            stock_list = []
            for stock in shop_stocks:
                inventory = stock.inventory
                stock_list.append({
                    "shop_id": stock.shop_id,
                    "shop_name": shop.shopname,
                    "inventoryV2_id": stock.inventoryv2_id,
                    "item_name": stock.itemname,
                    "batchnumber": stock.BatchNumber,
                    "metric": inventory.metric if inventory else stock.metric,
                    "quantity": stock.quantity,
                    "total_cost": stock.total_cost,
                    "unitPrice": stock.unitPrice
                })
            
            return make_response(jsonify({
                "shop_id": shop_id,
                "shop_name": shop.shopname,
                "shop_stocks": stock_list
            }), 200)
        
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "Database error occurred"}, 500

class GetAllStockV2(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        try:
            shop_stocks = ShopStockV2.query.options(
                joinedload(ShopStockV2.shop),
                joinedload(ShopStockV2.inventory)
            ).all()

            shop_stock_list = []
            for stock in shop_stocks:
                shop = stock.shop
                inventory = stock.inventory
                
                shop_stock_list.append({
                    "stockv2_id": stock.stockv2_id,
                    "shop_id": stock.shop_id,
                    "shop_name": shop.shopname if shop else "Unknown",
                    "inventoryV2_id": stock.inventoryv2_id,
                    "item_name": stock.itemname,
                    "batchnumber": stock.BatchNumber,
                    "metric": inventory.metric if inventory else stock.metric,
                    "quantity": stock.quantity,
                    "total_cost": stock.total_cost,
                    "unitPrice": stock.unitPrice
                })

            return make_response(jsonify({
                "total_shop_stocks": len(shop_stock_list),
                "shop_stocks": shop_stock_list
            }), 200)

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "Database error occurred"}, 500

class GetItemsByShopIdV2(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self, shop_id):
        try:
            items = ShopStockV2.query.filter_by(shop_id=shop_id).options(
                joinedload(ShopStockV2.inventory)
            ).all()
            
            item_list = []
            for stock in items:
                inventory = stock.inventory
                item_list.append({
                    "itemname": stock.itemname,
                    "BatchNumber": stock.BatchNumber,
                    "metric": inventory.metric if inventory else stock.metric,
                    "unitPrice": stock.unitPrice,
                    "stockv2_id": stock.stockv2_id
                })
            
            return make_response(jsonify({
                "shop_id": shop_id,
                "items": item_list
            }), 200)
        
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "Database error occurred"}, 500

class GetStockValueByShopV2(Resource):
    @jwt_required()
    def get(self, shop_id):
        try:
            shop = Shops.query.get(shop_id)
            if not shop:
                return {"error": f"Shop {shop_id} not found"}, 404

            total_stock_value = db.session.query(
                func.sum(ShopStockV2.total_cost)
            ).filter_by(shop_id=shop_id).scalar() or 0.0

            return make_response(jsonify({
                "shop_id": shop_id,
                "shop_name": shop.shopname,
                "total_stock_value": total_stock_value
            }), 200)

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "Database error occurred"}, 500

class TotalStockValueV2(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        try:
            shop_stocks = ShopStockV2.query.options(
                joinedload(ShopStockV2.shop)
            ).all()

            shop_stock_values = {}
            for stock in shop_stocks:
                shop_id = stock.shop_id
                shop_name = stock.shop.shopname if stock.shop else "Unknown"
                stock_value = stock.quantity * stock.unitPrice

                if shop_id not in shop_stock_values:
                    shop_stock_values[shop_id] = {
                        "shop_name": shop_name,
                        "total_stock_value": 0
                    }

                shop_stock_values[shop_id]["total_stock_value"] += stock_value

            return make_response(jsonify({
                "shop_stock_values": shop_stock_values
            }), 200)

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "Database error occurred"}, 500

class ShopStockByDateV2(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        try:
            start_date_str = request.args.get('start_date')
            end_date_str = request.args.get('end_date')

            start_date = datetime.strptime(start_date_str, '%Y-%m-%d') if start_date_str else None
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d') if end_date_str else None

            transfers_query = TransfersV2.query
            sales_query = Sales.query

            if start_date:
                transfers_query = transfers_query.filter(TransfersV2.created_at >= start_date)
                sales_query = sales_query.filter(Sales.created_at >= start_date)
            if end_date:
                transfers_query = transfers_query.filter(TransfersV2.created_at <= end_date)
                sales_query = sales_query.filter(Sales.created_at <= end_date)

            transfers = transfers_query.all()
            sales = sales_query.all()

            shop_data = {}

            for transfer in transfers:
                shop_id = transfer.shop_id
                inventoryV2_id = transfer.inventoryV2_id

                if shop_id not in shop_data:
                    shop_data[shop_id] = {
                        "shop_name": transfer.shop.shopname if transfer.shop else "Unknown",
                        "total_value": 0,
                        "stock_breakdown": {}
                    }

                if inventoryV2_id not in shop_data[shop_id]["stock_breakdown"]:
                    shop_data[shop_id]["stock_breakdown"][inventoryV2_id] = {
                        "item_name": transfer.itemname,
                        "quantity": 0,
                        "unitCost": transfer.unitCost,
                        "total_value": 0
                    }

                shop_data[shop_id]["stock_breakdown"][inventoryV2_id]["quantity"] += transfer.quantity
                shop_data[shop_id]["stock_breakdown"][inventoryV2_id]["total_value"] += transfer.quantity * transfer.unitCost
                shop_data[shop_id]["total_value"] += transfer.quantity * transfer.unitCost

            for sale in sales:
                shop_id = sale.shop_id
                stockv2_id = sale.stockv2_id

                if shop_id in shop_data:
                    for inventoryV2_id, stock in shop_data[shop_id]["stock_breakdown"].items():
                        if stockv2_id == inventoryV2_id:
                            stock["quantity"] -= sale.quantity
                            stock["total_value"] -= sale.quantity * stock["unitCost"]
                            shop_data[shop_id]["total_value"] -= sale.quantity * stock["unitCost"]

            return make_response(jsonify({
                "start_date": start_date.strftime('%Y-%m-%d') if start_date else None,
                "end_date": end_date.strftime('%Y-%m-%d') if end_date else None,
                "shop_stocks": [
                    {
                        "shop_id": shop_id,
                        "shop_name": data["shop_name"],
                        "total_value": data["total_value"],
                        "stock_breakdown": list(data["stock_breakdown"].values())
                    } for shop_id, data in shop_data.items()
                ]
            }), 200)

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "Database error occurred"}, 500
        except Exception as e:
            return {"error": "Unexpected error occurred"}, 500

class UpdateShopStockUnitPriceV2(Resource):
    @jwt_required()
    def put(self, stockv2_id):
        parser = reqparse.RequestParser()
        parser.add_argument('unitPrice', type=float, required=True, help='unitPrice is required')
        args = parser.parse_args()

        shop_stock = ShopStockV2.query.get(stockv2_id)
        
        if not shop_stock:
            return jsonify({'error': 'ShopStock not found'}), 404

        shop_stock.unitPrice = args['unitPrice']
        db.session.commit()

        return jsonify({
            'message': 'unitPrice updated successfully',
            'stockv2_id': stockv2_id,
            'new_unitPrice': args['unitPrice']
        })

class AvailableItemsByShopResourceV2(Resource):
    @jwt_required()
    def get(self):
        shop_id = request.args.get('shop_id')
        if not shop_id:
            return jsonify({"error": "shop_id parameter is required"}), 400

        items = db.session.query(ShopStockV2.itemname).filter(
            ShopStockV2.shop_id == shop_id,
            ShopStockV2.quantity > 0
        ).distinct().all()

        item_names = [item.itemname for item in items]
        return jsonify(item_names)

class ItemDetailsResourceForShopV2(Resource):
    @jwt_required()
    def get(self):
        item_name = request.args.get('item_name')
        shop_id = request.args.get('shop_id')

        if not item_name or not shop_id:
            return {'message': 'Item name and shop ID are required'}, 400

        shop_stock_items = ShopStockV2.query.filter_by(
            itemname=item_name, 
            shop_id=shop_id
        ).filter(ShopStockV2.quantity > 0).all()

        if not shop_stock_items:
            return {'message': 'No available stock for the given item'}, 404

        total_quantity = sum(stock.quantity for stock in shop_stock_items)
        first_batch = shop_stock_items[0]
        inventory_item = InventoryV2.query.get(first_batch.inventoryv2_id)

        sales_details = {
            'itemname': first_batch.itemname,
            'metric': inventory_item.metric if inventory_item else first_batch.metric,
            'unit_price': first_batch.unitPrice,
            'stockv2_id': first_batch.stockv2_id,
            'BatchNumber': first_batch.BatchNumber,
            'quantity': total_quantity
        }

        return sales_details, 200

class TransferSystemStockV2(Resource):
    @jwt_required()
    def post(self):
        try:
            data = request.get_json()
            from_shop_id = data.get("from_shop_id")
            to_shop_id = data.get("to_shop_id")
            stockv2_id = data.get("stockv2_id")
            transfer_quantity = data.get("quantity")
            current_user_id = get_jwt_identity()

            stock = ShopStockV2.query.filter_by(
                stockv2_id=stockv2_id, 
                shop_id=from_shop_id
            ).first()
            
            if not stock:
                return {"error": "Stock not found in source shop"}, 404

            if stock.quantity < transfer_quantity:
                return {"error": "Insufficient stock"}, 400

            stock.quantity -= transfer_quantity
            db.session.add(stock)

            dest_stock = ShopStockV2.query.filter_by(
                shop_id=to_shop_id, 
                BatchNumber=stock.BatchNumber
            ).first()

            if dest_stock:
                dest_stock.quantity += transfer_quantity
                db.session.add(dest_stock)
            else:
                new_stock = ShopStockV2(
                    shop_id=to_shop_id,
                    inventoryv2_id=stock.inventoryv2_id,
                    BatchNumber=stock.BatchNumber,
                    quantity=transfer_quantity,
                    total_cost=stock.unitPrice * transfer_quantity,
                    unitPrice=stock.unitPrice,
                    itemname=stock.itemname,
                    metric=stock.metric
                )
                db.session.add(new_stock)

            transfer_record = TransfersV2(
                shop_id=from_shop_id,
                user_id=current_user_id,
                itemname=stock.itemname,
                inventoryV2_id=stock.inventoryv2_id,
                quantity=transfer_quantity,
                BatchNumber=stock.BatchNumber,
                created_at=datetime.utcnow(),
                total_cost=stock.unitPrice * transfer_quantity,
                unitCost=stock.unitPrice
            )
            db.session.add(transfer_record)

            db.session.commit()

            return {
                "message": "Stock transferred successfully",
                "transfer_details": {
                    "from_shop_id": from_shop_id,
                    "to_shop_id": to_shop_id,
                    "itemname": stock.itemname,
                    "quantity": transfer_quantity,
                    "batch_number": stock.BatchNumber,
                    "transfer_date": transfer_record.created_at.isoformat()
                }
            }, 200

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500

class GetBatchStockV2(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        try:
            batch_stock = db.session.query(
                ShopStockV2.BatchNumber, 
                func.sum(ShopStockV2.quantity).label("total_quantity"),
                InventoryV2.metric
            ).join(InventoryV2, ShopStockV2.inventoryv2_id == InventoryV2.inventoryV2_id) \
            .group_by(ShopStockV2.BatchNumber, InventoryV2.metric).all()

            batch_stock_list = [
                {
                    "batch_number": batch,
                    "total_quantity": round(total_quantity, 2),
                    "metric": metric
                }
                for batch, total_quantity, metric in batch_stock
            ]

            return make_response(jsonify({
                "total_batches": len(batch_stock_list),
                "batch_stocks": batch_stock_list
            }), 200)

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e)}, 500

class GetItemStockV2(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        try:
            shop_id = request.args.get('shop_id', type=int)

            query = db.session.query(
                InventoryV2.itemname,
                InventoryV2.metric,
                func.sum(ShopStockV2.quantity).label("total_quantity")
            ).join(InventoryV2, ShopStockV2.inventoryv2_id == InventoryV2.inventoryV2_id)

            if shop_id:
                query = query.filter(ShopStockV2.shop_id == shop_id)

            item_stock = query.group_by(InventoryV2.itemname, InventoryV2.metric).all()

            item_stock_list = [
                {
                    "itemname": itemname,
                    "metric": metric,
                    "total_remaining": round(total_quantity, 2)
                }
                for itemname, metric, total_quantity in item_stock
            ]

            return make_response(jsonify({
                "shop_id": shop_id,
                "total_items": len(item_stock_list),
                "item_stocks": item_stock_list
            }), 200)

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": str(e)}, 500

class AddShopStockV2(Resource):
    @jwt_required()
    @check_role('manager')
    def post(self):
        data = request.get_json()
        current_user_id = get_jwt_identity()

        required_fields = ['shop_id', 'itemname', 'unitPrice', 'metric']
        if not all(field in data for field in required_fields):
            return {'message': 'Missing required fields'}, 400

        try:
            shop_id = data['shop_id']
            itemname = data['itemname']
            unitPrice = data['unitPrice']
            metric = data['metric']
            
            shop = Shops.query.get(shop_id)
            if not shop:
                return {'message': 'Shop not found'}, 404
            
            batch_number = self.generate_batch_code(
                Suppliername="Kukuzetu",
                Supplier_location=shop.shopname,
                itemname=itemname,
                created_at=datetime.utcnow()
            )
            
            LARGE_QUANTITY = 999999
            
            new_shop_stock = ShopStockV2(
                shop_id=shop_id,
                itemname=itemname,
                quantity=LARGE_QUANTITY,
                metric=metric,
                BatchNumber=batch_number,
                unitPrice=unitPrice,
                total_cost=0,
                inventoryv2_id=None
            )

            db.session.add(new_shop_stock)
            db.session.commit()
            
            return {
                'message': 'Item added to shop stock successfully',
                'stockv2_id': new_shop_stock.stockv2_id,
                'itemname': itemname,
                'unitPrice': unitPrice,
                'BatchNumber': batch_number,
                'quantity': LARGE_QUANTITY
            }, 201
            
        except ValueError as e:
            db.session.rollback()
            return {'message': str(e)}, 400
        except Exception as e:
            db.session.rollback()
            return {'message': str(e)}, 500

    @staticmethod
    def generate_batch_code(Suppliername, Supplier_location, itemname, created_at):
        if isinstance(created_at, str):
            created_at = datetime.strptime(created_at, '%Y-%m-%d')

        year = str(created_at.year)[-2:]
        month = f'{created_at.month:02d}'
        day = f'{created_at.day:02d}'

        item_code = itemname.upper().replace(' ', '')
        supplier_name_code = Suppliername.upper().replace(' ', '')
        supplier_location_code = Supplier_location.upper().replace(' ', '')

        batch_code = f"{supplier_name_code}-{supplier_location_code}-{item_code}-{year}{month}{day}"

        return batch_code
    
class StockReturns(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        # Fetch all returns ordered by return_date in descending order
        returns = ReturnsV2.query.order_by(ReturnsV2.return_date.desc()).all()
        all_returns = []

        for return_item in returns:
            # Get related data
            returned_by_user = Users.query.filter_by(users_id=return_item.returned_by).first()
            shop = Shops.query.filter_by(shops_id=return_item.shop_id).first()
            inventory_item = InventoryV2.query.filter_by(inventoryV2_id=return_item.inventoryv2_id).first()
            shop_stock = ShopStockV2.query.filter_by(stockv2_id=return_item.stockv2_id).first()

            # Format the data
            username = returned_by_user.username if returned_by_user else "Unknown User"
            shopname = shop.shopname if shop else "Unknown Shop"
            item_name = inventory_item.itemname if inventory_item else "Unknown Item"
            batch_number = shop_stock.BatchNumber if shop_stock else "N/A"

            # Format return date
            return_date = None
            if return_item.return_date:
                if isinstance(return_item.return_date, str):
                    try:
                        return_date = datetime.strptime(return_item.return_date, '%Y-%m-%d %H:%M:%S').strftime('%Y-%m-%d %H:%M:%S')
                    except ValueError:
                        return_date = return_item.return_date
                elif isinstance(return_item.return_date, datetime):
                    return_date = return_item.return_date.strftime('%Y-%m-%d %H:%M:%S')

            all_returns.append({
                "return_id": return_item.returnv2_id,
                "stock_id": return_item.stockv2_id,
                "inventory_id": return_item.inventoryv2_id,
                "item_name": item_name,
                "batch_number": batch_number,
                "shop_id": return_item.shop_id,
                "shop_name": shopname,
                "quantity": return_item.quantity,
                "returned_by": return_item.returned_by,
                "returned_by_username": username,
                "return_date": return_date,
                "reason": return_item.reason
            })

        return make_response(jsonify(all_returns), 200)