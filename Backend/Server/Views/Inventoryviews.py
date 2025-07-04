from flask_restful import Resource
from Server.Models.Inventory import Inventory, db
from Server.Models.Transfer import Transfer
from Server.Models.Shops import Shops
from Server.Models.Shopstock import ShopStock
from Server.Models.BankAccounts import BankAccount, BankingTransaction
from Server.Models.Users import Users
from app import db
from functools import wraps
from flask import request, make_response, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from dateutil import parser
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
import logging
from flask import current_app
import re


def check_role(required_role):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            user_role = request.headers.get('X-User-Role', None)
            
            if user_role != required_role:
                return jsonify({"message": "Access denied: insufficient permissions"}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper


class GetInventoryByBatch(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        try:
            inventories = Inventory.query.all()

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
                    'inventory_id': inv.inventory_id,
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


class DistributeInventory(Resource):
    @jwt_required()
    @check_role('manager')
    def post(self):
        data = request.get_json()
        current_user_id = get_jwt_identity()

        required_fields = ['shop_id', 'inventory_id', 'quantity', 'itemname', 'unitCost', 'amountPaid', 'BatchNumber', 'created_at', 'metric']
        if not all(field in data for field in required_fields):
            return jsonify({'message': 'Missing required fields'}), 400

        shop_id = data['shop_id']
        inventory_id = data['inventory_id']
        quantity = data['quantity']
        metric = data['metric']
        itemname = data['itemname']
        unitCost = data['unitCost']
        amountPaid = data['amountPaid']
        BatchNumber = data['BatchNumber']

        try:
            distribution_date = parser.isoparse(data['created_at'])
        except ValueError:
            return jsonify({'message': 'Invalid date format'}), 400

        inventory_item = Inventory.query.get(inventory_id)
        if not inventory_item:
            return jsonify({'message': 'Inventory item not found'}), 404

        if inventory_item.quantity < quantity:
            return jsonify({'message': 'Insufficient inventory quantity'}), 400

        new_transfer = Transfer(
            shop_id=shop_id,
            inventory_id=inventory_id,
            quantity=quantity,
            metric=metric,
            total_cost=unitCost * quantity,
            BatchNumber=BatchNumber,
            user_id=current_user_id,
            itemname=itemname,
            amountPaid=amountPaid,
            unitCost=unitCost,
            created_at=distribution_date
        )

        inventory_item.quantity -= quantity

        try:
            db.session.add(new_transfer)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': 'Error creating transfer', 'error': str(e)}), 500

        new_shop_stock = ShopStock(
            shop_id=shop_id,
            transfer_id=new_transfer.transfer_id,
            inventory_id=inventory_id,
            quantity=quantity,
            total_cost=unitCost * quantity,
            itemname=itemname,
            metric=metric,
            BatchNumber=BatchNumber,
            unitPrice=inventory_item.unitPrice,
        )

        try:
            db.session.add(new_shop_stock)
            db.session.commit()
            return {'message': 'Inventory distributed successfully'}, 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': 'Error creating shop stock', 'error': str(e)}), 500


class DeleteShopStock(Resource):
    @jwt_required()
    @check_role('manager')
    def delete(self, shop_stock_id):
        current_user_id = get_jwt_identity()

        shop_stock = ShopStock.query.get(shop_stock_id)
        if not shop_stock:
            return jsonify({'message': 'ShopStock record not found'}), 404

        transfer = Transfer.query.get(shop_stock.transfer_id)
        if not transfer:
            return jsonify({'message': 'Related Transfer record not found'}), 404

        inventory_item = Inventory.query.get(shop_stock.inventory_id)
        if not inventory_item:
            return jsonify({'message': 'Related Inventory item not found'}), 404

        try:
            inventory_item.quantity += shop_stock.quantity
            print(f"Reverted inventory quantity for Inventory ID {inventory_item.inventory_id}. New quantity: {inventory_item.quantity}")
            db.session.delete(transfer)
            db.session.delete(shop_stock)
            db.session.commit()

            return {
                'message': 'ShopStock and associated records deleted successfully',
                'details': {
                    'shop_stock_id': shop_stock_id,
                    'inventory_id': inventory_item.inventory_id,
                    'transfer_id': transfer.transfer_id
                }
            }, 200

        except Exception as e:
            db.session.rollback()
            return jsonify({'message': 'Error deleting ShopStock', 'error': str(e)}), 500


class GetTransfer(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        transfers = Transfer.query.all()
        all_transfers = []

        for transfer in transfers:
            user = Users.query.filter_by(users_id=transfer.user_id).first()
            shop = Shops.query.filter_by(shops_id=transfer.shop_id).first()
            
            username = user.username if user else "Unknown User"
            shopname = shop.shopname if shop else "Unknown Shop"
        
            all_transfers.append({
                "transfer_id": transfer.transfer_id,
                "shop_id": transfer.shop_id,
                "inventory_id": transfer.inventory_id,      
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
                "created_at": transfer.created_at.strftime('%Y-%m-%d %H:%M:%S') if transfer.created_at else None,
            })

        return jsonify({
            "status": "success",
            "data": all_transfers,
            "count": len(all_transfers),
            "message": "Transfers retrieved successfully"
        })


class GetTransferById(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self, transfer_id):
        transfer = Transfer.query.filter_by(transfer_id=transfer_id).first()
        
        if not transfer:
            return make_response(jsonify({"message": "Transfer not found"}), 404)
        
        user = Users.query.filter_by(users_id=transfer.user_id).first()
        shop = Shops.query.filter_by(shops_id=transfer.shop_id).first()
        
        username = user.username if user else "Unknown User"
        shopname = shop.shopname if shop else "Unknown Shop"
    
        transfer_data = {
            "transfer_id": transfer.transfer_id,
            "shop_id": transfer.shop_id,
            "inventory_id": transfer.inventory_id,      
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


class UpdateTransfer(Resource):
    @jwt_required()
    @check_role('manager')
    def put(self, transfer_id):
        data = request.get_json()
        transfer = Transfer.query.filter_by(transfer_id=transfer_id).first()

        if not transfer:
            return make_response(jsonify({"message": "Transfer not found"}), 404)

        transfer.shop_id = data.get("shop_id", transfer.shop_id)
        transfer.inventory_id = data.get("inventory_id", transfer.inventory_id)
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


class AddInventory(Resource):
    @jwt_required()
    @check_role('manager')
    def post(self):
        data = request.get_json()
        current_user_id = get_jwt_identity()

        required_fields = ['itemname', 'quantity', 'metric', 'unitCost', 'amountPaid', 'unitPrice',
                           'Suppliername', 'Supplier_location', 'created_at']
        if not all(field in data for field in required_fields):
            return {'message': 'Missing required fields'}, 400

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

        Trasnaction_type_credit = data.get('Trasnaction_type_credit')
        Transcation_type_debit = data.get('Transcation_type_debit')

        try:
            created_at = datetime.strptime(created_at_str, "%Y-%m-%d")
        except ValueError:
            return {'message': 'Invalid date format. Please use YYYY-MM-DD for created_at.'}, 400

        totalCost = unitCost * quantity
        balance = totalCost - amountPaid

        last_inventory = Inventory.query.order_by(Inventory.inventory_id.desc()).first()
        next_batch_number = 1 if not last_inventory else last_inventory.inventory_id + 1
        batch_code = Inventory.generate_batch_code(Suppliername, Supplier_location, itemname, created_at, next_batch_number)
        debit_account_value = unitPrice * quantity

        if not source or len(source.strip()) == 0:
            source = "Unknown"

        transaction = None
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

        new_inventory = Inventory(
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

        try:
            db.session.add(new_inventory)
            db.session.commit()
            return {'message': 'Inventory added successfully', 'BatchNumber': batch_code}, 201
        except Exception as e:
            db.session.rollback()
            return {'message': 'Error adding inventory', 'error': str(e)}, 500


class GetAllInventory(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        inventories = Inventory.query.order_by(Inventory.created_at.desc()).all()

        all_inventory = [{
            "inventory_id": inventory.inventory_id,
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


class InventoryResourceById(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self, inventory_id):
        inventory = Inventory.query.get(inventory_id)
   
        if inventory:
            return {
                "inventory_id": inventory.inventory_id,
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
    @check_role('manager')
    def delete(self, inventory_id):
        inventory = Inventory.query.get(inventory_id)

        if not inventory:
            return {"error": "Inventory not found"}, 404
        
        try:
            transfers = Transfer.query.filter_by(inventory_id=inventory_id).all()
            for transfer in transfers:
                db.session.delete(transfer)
            
            shop_stocks = ShopStock.query.filter_by(inventory_id=inventory_id).all()
            for stock in shop_stocks:
                db.session.delete(stock)

            db.session.delete(inventory)
            db.session.commit()

            return {"message": "Inventory deleted successfully"}, 200
        
        except Exception as e:
            db.session.rollback()
            return {"message": "Error deleting inventory", "error": str(e)}, 500

    @jwt_required()
    @check_role('manager')
    def put(self, inventory_id):
        data = request.get_json()
        inventory = Inventory.query.get(inventory_id)
        if not inventory:
            return jsonify({'message': 'Inventory not found'}), 404

        try:
            itemname = data.get('itemname', inventory.itemname)
            initial_quantity = int(data.get('initial_quantity', inventory.initial_quantity))
            unitCost = float(data.get('unitCost', inventory.unitCost))
            unitPrice = float(data.get('unitPrice', inventory.unitPrice))
            totalCost = unitCost * initial_quantity
            amountPaid = float(data.get('amountPaid', inventory.amountPaid))
            balance = totalCost - amountPaid
            Suppliername = data.get('Suppliername', inventory.Suppliername)
            Supplier_location = data.get('Supplier_location', inventory.Supplier_location)
            note = data.get('note', inventory.note)

            created_at_str = data.get('created_at', None)
            if created_at_str:
                try:
                    created_at = datetime.strptime(created_at_str, '%Y-%m-%d')
                except ValueError:
                    return jsonify({'message': 'Invalid date format for created_at, expected YYYY-MM-DD'}), 400
            else:
                created_at = inventory.created_at

            inventory.itemname = itemname
            inventory.initial_quantity = initial_quantity
            inventory.unitCost = unitCost
            inventory.unitPrice = unitPrice
            inventory.totalCost = totalCost
            inventory.amountPaid = amountPaid
            inventory.balance = balance
            inventory.Suppliername = Suppliername
            inventory.Supplier_location = Supplier_location
            inventory.note = note
            inventory.created_at = created_at

            transfers = Transfer.query.filter_by(inventory_id=inventory_id).all()
            for transfer in transfers:
                transfer.itemname = itemname
                transfer.unitCost = unitCost
                transfer.amountPaid = amountPaid

            shop_stocks = ShopStock.query.filter_by(inventory_id=inventory_id).all()
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


class StockDeletionResource(Resource):     
    @jwt_required()
    @check_role('manager')
    def delete(self, stock_id):
        stock = ShopStock.query.get(stock_id)

        if not stock:
            return {"error": "Stock not found"}, 404

        try:
            if stock.inventory_id == 0:
                related_transfers = Transfer.query.filter_by(shop_id=stock.shop_id, itemname=stock.itemname).all()
            else:
                related_transfers = Transfer.query.filter_by(stock_id=stock_id).all()

            if related_transfers:
                for transfer in related_transfers:
                    db.session.delete(transfer)

            if stock.inventory_id != 0:
                inventory = Inventory.query.get(stock.inventory_id)
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


class ManualTransfer(Resource):
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

            new_transfer = Transfer(
                shop_id=MANUAL_TRANSFER_SHOP_ID,
                inventory_id=None,
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

            existing_stock = ShopStock.query.filter_by(
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
                new_shop_stock = ShopStock(
                    shop_id=MANUAL_TRANSFER_SHOP_ID,
                    inventory_id=None,
                    transfer_id=new_transfer.transfer_id,
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