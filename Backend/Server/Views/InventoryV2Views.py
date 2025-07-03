from flask_restful import Resource
from Server.Models.InventoryV2 import InventoryV2, db
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
from sqlalchemy.orm import joinedload
import logging
from flask import current_app
import re


def check_role(roles):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            current_user = get_jwt_identity()
            user_role = request.headers.get('X-User-Role', None)
            
            if user_role not in roles:
                return jsonify({"message": "Access denied: insufficient permissions"}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper


class InventoryDataParser:
    base_required_fields = [
        'itemname', 'quantity', 'metric', 'unitCost', 
        'amountPaid', 'unitPrice', 'Suppliername', 
        'Supplier_location', 'created_at'
    ]
    
    base_optional_fields = {
        'note': '',
        'source': 'Unknown',
        'paymentRef': None,
        'Trasnaction_type_credit': None,
        'Transcation_type_debit': None
    }

    @classmethod
    def parse_add_inventory(cls, json_data):
        missing = [f for f in cls.base_required_fields if f not in json_data]
        if missing:
            raise ValueError(f"Missing required fields: {', '.join(missing)}")

        data = {f: json_data.get(f) for f in cls.base_required_fields}
        for k, v in cls.base_optional_fields.items():
            data[k] = json_data.get(k, v)
            
        data['totalCost'] = data['unitCost'] * data['quantity']
        data['balance'] = data['totalCost'] - data['amountPaid']
        
        try:
            data['created_at'] = datetime.strptime(data['created_at'], "%Y-%m-%d")
        except ValueError:
            raise ValueError("Invalid date format. Please use YYYY-MM-DD for created_at.")
            
        return data

    @classmethod
    def serialize_inventory(cls, inventory):
        return {
            "inventoryV2_id": inventory.inventoryV2_id,
            "itemname": inventory.itemname,
            "initial_quantity": inventory.initial_quantity,
            "quantity": inventory.quantity,
            "metric": inventory.metric,
            "unitCost": inventory.unitCost,
            "totalCost": inventory.totalCost,
            "amountPaid": inventory.amountPaid,
            "unitPrice": inventory.unitPrice,
            "BatchNumber": inventory.BatchNumber,
            "Suppliername": inventory.Suppliername,
            "Supplier_location": inventory.Supplier_location,
            "balance": inventory.ballance,
            "note": inventory.note,
            "created_at": inventory.created_at.strftime('%Y-%m-%d') if inventory.created_at else None,
            "source": inventory.source,
            "paymentRef": inventory.paymentRef
        }


class GetInventoryByBatch(Resource):
    @jwt_required()
    @check_role(['manager', 'procurement'])
    def get(self):
        try:
            inventories = InventoryV2.query.all()

            def batch_sort_key(inventory):
                match = re.match(r"^.*-(?P<letter>[A-Z])(?P<number>\d+)$", inventory.BatchNumber)
                if match:
                    return (match.group("letter"), int(match.group("number")))
                return ("Z", 9999)

            sorted_inventories = sorted(inventories, key=batch_sort_key)
            inventory_list = [InventoryDataParser.serialize_inventory(inv) for inv in sorted_inventories]

            return make_response(jsonify({'inventories': inventory_list})), 200
        except Exception as e:
            return make_response(jsonify({'message': 'Error fetching inventory', 'error': str(e)}), 500)


class DistributeInventory(Resource):
    @jwt_required()
    @check_role(['manager', 'procurement'])
    def post(self):
        data = request.get_json()
        current_user_id = get_jwt_identity()

        required_fields = ['shop_id', 'inventoryV2_id', 'quantity', 'itemname', 'unitCost', 'amountPaid', 'BatchNumber', 'created_at', 'metric']
        if not all(field in data for field in required_fields):
            return jsonify({'message': 'Missing required fields'}), 400

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
            return jsonify({'message': 'Invalid date format'}), 400

        inventory_item = InventoryV2.query.get(inventoryV2_id)
        if not inventory_item:
            return jsonify({'message': 'Inventory item not found'}), 404

        if inventory_item.quantity < quantity:
            return jsonify({'message': 'Insufficient inventory quantity'}), 400

        new_transfer = Transfer(
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
            inventoryV2_id=inventoryV2_id,
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


class GetAllInventory(Resource):
    @jwt_required()
    @check_role(['manager', 'procurement'])
    def get(self):
        inventories = InventoryV2.query.order_by(InventoryV2.created_at.desc()).all()
        all_inventory = [InventoryDataParser.serialize_inventory(inventory) for inventory in inventories]
        return make_response(jsonify(all_inventory), 200)


class InventoryResourceById(Resource):
    @jwt_required()
    @check_role(['manager', 'procurement'])
    def get(self, inventoryV2_id):
        inventory = InventoryV2.query.get(inventoryV2_id)
   
        if inventory:
            return InventoryDataParser.serialize_inventory(inventory), 200
        else:
            return {"error": "Inventory not found"}, 404
        
    @jwt_required()
    @check_role(['manager', 'procurement'])
    def delete(self, inventoryV2_id):
        inventory = InventoryV2.query.get(inventoryV2_id)

        if not inventory:
            return {"error": "Inventory not found"}, 404
        
        try:
            transfers = Transfer.query.filter_by(inventoryV2_id=inventoryV2_id).all()
            for transfer in transfers:
                db.session.delete(transfer)
            
            shop_stocks = ShopStock.query.filter_by(inventoryV2_id=inventoryV2_id).all()
            for stock in shop_stocks:
                db.session.delete(stock)

            db.session.delete(inventory)
            db.session.commit()
            return {"message": "Inventory deleted successfully"}, 200
        
        except Exception as e:
            db.session.rollback()
            return {"message": "Error deleting inventory", "error": str(e)}, 500

    @jwt_required()
    @check_role(['manager', 'procurement'])
    def put(self, inventoryV2_id):
        data = request.get_json()
        inventory = InventoryV2.query.get(inventoryV2_id)
        if not inventory:
            return jsonify({'message': 'Inventory not found'}), 404

        try:
            inventory.itemname = data.get('itemname', inventory.itemname)
            inventory.initial_quantity = int(data.get('initial_quantity', inventory.initial_quantity))
            inventory.unitCost = float(data.get('unitCost', inventory.unitCost))
            inventory.unitPrice = float(data.get('unitPrice', inventory.unitPrice))
            inventory.totalCost = inventory.unitCost * inventory.initial_quantity
            inventory.amountPaid = float(data.get('amountPaid', inventory.amountPaid))
            inventory.balance = inventory.totalCost - inventory.amountPaid
            inventory.Suppliername = data.get('Suppliername', inventory.Suppliername)
            inventory.Supplier_location = data.get('Supplier_location', inventory.Supplier_location)
            inventory.note = data.get('note', inventory.note)

            if 'created_at' in data:
                try:
                    inventory.created_at = datetime.strptime(data['created_at'], '%Y-%m-%d')
                except ValueError:
                    return jsonify({'message': 'Invalid date format for created_at, expected YYYY-MM-DD'}), 400

            transfers = Transfer.query.filter_by(inventoryV2_id=inventoryV2_id).all()
            for transfer in transfers:
                transfer.itemname = inventory.itemname
                transfer.unitCost = inventory.unitCost
                transfer.amountPaid = inventory.amountPaid

            shop_stocks = ShopStock.query.filter_by(inventoryV2_id=inventoryV2_id).all()
            for stock in shop_stocks:
                stock.itemname = inventory.itemname
                stock.unitPrice = inventory.unitPrice

            db.session.commit()
            return {'message': 'Inventory and related records updated successfully'}, 200

        except ValueError as e:
            db.session.rollback()
            return {'message': 'Invalid data type', 'error': str(e)}, 400
        except Exception as e:
            db.session.rollback()
            return {'message': 'Error updating inventory', 'error': str(e)}, 500


# ... (other resources would follow the same pattern of updating inventory_id to inventoryV2_id)