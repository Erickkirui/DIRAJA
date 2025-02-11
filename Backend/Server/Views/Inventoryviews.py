from  flask_restful import Resource
from Server.Models.Inventory import Inventory, db
# from Server.Models.Distribution import Distribution
from Server.Models.Transfer import Transfer
from Server.Models.Shops import Shops
from Server.Models.Shopstock import ShopStock
from Server.Models.Users import Users
from app import db
from functools import wraps
from flask import request,make_response,jsonify
from flask_jwt_extended import jwt_required,get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from sqlalchemy.orm import joinedload
import logging

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

class DistributeInventory(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()
        current_user_id = get_jwt_identity()

        # Validate required fields
        required_fields = ['shop_id', 'inventory_id', 'quantity', 'itemname', 'unitCost', 'amountPaid', 'BatchNumber']
        if not all(field in data for field in required_fields):
            return jsonify({'message': 'Missing required fields'}), 400

        # Extract data
        shop_id = data['shop_id']
        inventory_id = data['inventory_id']
        quantity = data['quantity']
        metric = data['metric']
        itemname = data['itemname']
        unitCost = data['unitCost']
        amountPaid = data['amountPaid']
        BatchNumber = data['BatchNumber']

        # Fetch inventory item to check quantity and get unitPrice
        inventory_item = Inventory.query.get(inventory_id)
        if not inventory_item:
            return jsonify({'message': 'Inventory item not found'}), 404

        if inventory_item.quantity < quantity:
            return jsonify({'message': 'Insufficient inventory quantity'}), 400

        # Calculate total cost and get the unit price from inventory
        total_cost = unitCost * quantity
        unitPrice = inventory_item.unitPrice  # Use the inventory's unit price

        # Create new transfer record
        new_transfer = Transfer(
            shop_id=shop_id,
            inventory_id=inventory_id,
            quantity=quantity,
            metric=metric,
            total_cost=total_cost,
            BatchNumber=BatchNumber,
            user_id=current_user_id,
            itemname=itemname,
            amountPaid=amountPaid,
            unitCost=unitCost
        )

        # Update the inventory quantity
        inventory_item.quantity -= quantity

        # Save the transfer record first
        try:
            db.session.add(new_transfer)
            db.session.commit()  # Commit to get the transfer_id
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': 'Error creating transfer', 'error': str(e)}), 500

        # Create new shop stock record
        new_shop_stock = ShopStock(
            shop_id=shop_id,
            transfer_id=new_transfer.transfer_id,
            inventory_id=inventory_id,
            quantity=quantity,
            total_cost=total_cost,
            itemname=itemname,
            metric=metric,
            BatchNumber=BatchNumber,
            unitPrice=unitPrice  # Use the inventory's unit price
        )

        # Save the shop stock record
        try:
            db.session.add(new_shop_stock)
            db.session.commit()
            return {'message': 'Inventory distributed successfully'}, 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': 'Error creating shop stock', 'error': str(e)}), 500


class DeleteShopStock(Resource):
    @jwt_required()
    def delete(self, shop_stock_id):
        # Get the current user ID from the JWT token
        current_user_id = get_jwt_identity()

        # Fetch the ShopStock record using the stock ID
        shop_stock = ShopStock.query.get(shop_stock_id)
        if not shop_stock:
            return jsonify({'message': 'ShopStock record not found'}), 404

        # Fetch the related Transfer record using the transfer ID from ShopStock
        transfer = Transfer.query.get(shop_stock.transfer_id)
        if not transfer:
            return jsonify({'message': 'Related Transfer record not found'}), 404

        # Fetch the related Inventory record using the inventory ID from ShopStock
        inventory_item = Inventory.query.get(shop_stock.inventory_id)
        if not inventory_item:
            return jsonify({'message': 'Related Inventory item not found'}), 404

        # Reverse the chain of distribution
        try:
            # Revert inventory quantity
            inventory_item.quantity += shop_stock.quantity

            # Log the reversal action (optional)
            print(f"Reverted inventory quantity for Inventory ID {inventory_item.inventory_id}. New quantity: {inventory_item.quantity}")

            # Delete the Transfer record
            db.session.delete(transfer)

            # Delete the ShopStock record
            db.session.delete(shop_stock)

            # Commit the changes to the database
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
            # Roll back in case of an error
            db.session.rollback()
            return jsonify({'message': 'Error deleting ShopStock', 'error': str(e)}), 500

class GetTransfer(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        transfers = Transfer.query.all()
        all_transfers = []

        for transfer in transfers:
            # Fetch username and shop name manually using user_id and shop_id
            user = Users.query.filter_by(users_id=transfer.user_id).first()
            shop = Shops.query.filter_by(shops_id=transfer.shop_id).first()
            
            # Handle cases where user or shop may not be found
            username = user.username if user else "Unknown User"
            shopname = shop.shopname if shop else "Unknown Shop"
        
            # Append the data for each transfer
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
                "created_at": transfer.created_at,
            })

        return make_response(jsonify(all_transfers), 200)



class AddInventory(Resource):
    @jwt_required()
    @check_role('manager')
    def post(self):
        data = request.get_json()
        current_user_id = get_jwt_identity()

        # Validate required fields (including supplier fields)
        required_fields = ['itemname', 'quantity', 'metric', 'unitCost', 'amountPaid', 'unitPrice', 'Suppliername', 'Supplier_location', 'created_at']
        if not all(field in data for field in required_fields):
            return jsonify({'message': 'Missing required fields'}), 400

        # Extract data
        itemname = data.get('itemname')
        quantity = data.get('quantity')
        metric = data.get('metric')
        unitCost = data.get('unitCost')
        amountPaid = data.get('amountPaid')
        unitPrice = data.get('unitPrice')
        Suppliername = data.get('Suppliername')
        Supplier_location = data.get('Supplier_location')
        note = data.get('note', '')  # Optional field, default to empty String
        created_at = datetime.utcnow()

        # Calculate totalCost and balance
        totalCost = unitCost * quantity
        balance = totalCost - amountPaid

        # Generate the batch number based on previous records
        last_inventory = Inventory.query.order_by(Inventory.inventory_id.desc()).first()
        next_batch_number = 1 if not last_inventory else last_inventory.inventory_id + 1

        # Generate the batch code using the static method
        batch_code = Inventory.generate_batch_code(Suppliername, Supplier_location, itemname, created_at, next_batch_number)

        # Create new inventory record
        new_inventory = Inventory(
            itemname=itemname,
            initial_quantity=quantity,
            quantity=quantity,
            metric=metric,
            unitCost=unitCost,
            totalCost=totalCost,  # Auto-calculated
            amountPaid=amountPaid,
            unitPrice=unitPrice,
            BatchNumber=batch_code,
            user_id=current_user_id,
            Suppliername=Suppliername,
            Supplier_location=Supplier_location,
            ballance=balance,  # Balance calculated as totalCost - amountPaid
            note=note,
            created_at=created_at
        )

        # Save to database
        try:
            db.session.add(new_inventory)
            db.session.commit()
            return {'message': 'Inventory added successfully', 'BatchNumber': batch_code}, 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': 'Error adding inventory', 'error': str(e)}), 500

   
    
class GetAllInventory(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
    
        inventories = Inventory.query.order_by(Inventory.created_at.desc()).all()

        all_inventory = [{
            "inventory_id": inventory.inventory_id,
            "itemname": inventory.itemname,
            "initial_quantity": inventory.initial_quantity,      # Initial Quantity
            "remaining_quantity": inventory.quantity,             # Remaining Quantity
            "metric": inventory.metric,
            "totalCost": inventory.totalCost,
            "unitCost": inventory.unitCost,
            "batchnumber": inventory.BatchNumber,
            "amountPaid": inventory.amountPaid,
            "balance":inventory.ballance,
            "note":inventory.note,
            "created_at": inventory.created_at,
            "unitPrice": inventory.unitPrice
        } for inventory in inventories]

        return make_response(jsonify(all_inventory), 200)
    


class InventoryResourceById(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self, inventory_id):
        # Fetch inventory by ID
        inventory = Inventory.query.get(inventory_id)
   
        if inventory:
            return {
                "inventory_id": inventory.inventory_id,
                "itemname": inventory.itemname,
                "initial_quantity":inventory.initial_quantity,
                "quantity": inventory.quantity,
                "metric": inventory.metric,
                "totalCost": inventory.totalCost,
                "unitCost": inventory.unitCost,
                "batchnumber": inventory.BatchNumber,
                "amountPaid": inventory.amountPaid,
                "balance": inventory.ballance,  # Corrected typo f'
                "note": inventory.note,
                "created_at": inventory.created_at,
                "unitPrice": inventory.unitPrice,
                "Suppliername": inventory.Suppliername,
                "Supplier_location": inventory.Supplier_location
            }, 200
        else:
            return {"error": "Inventory not found"}, 404

    @jwt_required()
    @check_role('manager')
    def put(self, inventory_id):
        data = request.get_json()

        # Fetch the inventory record
        inventory = Inventory.query.get(inventory_id)
        if not inventory:
            return jsonify({'message': 'Inventory not found'}), 404

        try:
            # Extract and Convert Data
            itemname = data.get('itemname', inventory.itemname)
            initial_quantity = int(data.get('initial_quantity', inventory.initial_quantity))  # Convert to int
            unitCost = float(data.get('unitCost', inventory.unitCost))  # Convert to float
            unitPrice = float(data.get('unitPrice', inventory.unitPrice))  # Convert to float
            totalCost = unitCost * initial_quantity  # Ensure this is a valid number
            amountPaid = float(data.get('amountPaid', inventory.amountPaid))  # Convert to float
            ballance = totalCost - amountPaid  # Calculate balance
            Suppliername = data.get('Suppliername', inventory.Suppliername)
            Supplier_location = data.get('Supplier_location', inventory.Supplier_location)
            note = data.get('note', inventory.note)
            created_at = data.get('created_at', inventory.created_at)

            # Update inventory details
            inventory.itemname = itemname
            inventory.initial_quantity = initial_quantity
            inventory.unitCost = unitCost
            inventory.unitPrice = unitPrice
            inventory.totalCost = totalCost
            inventory.amountPaid = amountPaid
            inventory.ballance = ballance  # Update the balance
            inventory.Suppliername = Suppliername
            inventory.Supplier_location = Supplier_location
            inventory.note = note
            inventory.created_at = created_at

            # Update related transfer records
            transfers = Transfer.query.filter_by(inventory_id=inventory_id).all()
            for transfer in transfers:
                transfer.itemname = itemname
                transfer.unitCost = unitCost
                transfer.amountPaid = amountPaid

            # Update related shop stock records
            shop_stocks = ShopStock.query.filter_by(inventory_id=inventory_id).all()
            for stock in shop_stocks:
                stock.itemname = itemname
                stock.unitPrice = unitPrice

            # Commit changes to the database
            db.session.commit()
            return {'message': 'Inventory and related records updated successfully'}, 200

        except ValueError as e:
            db.session.rollback()
            return {'message': 'Invalid data type', 'error': str(e)}, 400
        except Exception as e:
            db.session.rollback()
            return {'message': 'Error updating inventory', 'error': str(e)}, 500

 
          
    @jwt_required()
    @check_role('manager')
    def delete(self, inventory_id):
        # Fetch inventory by ID
        inventory = Inventory.query.get(inventory_id)
        
        if inventory:
            try:
                db.session.delete(inventory)
                db.session.commit()
                return {"message": "Inventory deleted successfully"}, 200
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': 'Error deleting inventory', 'details': str(e)}), 500
        else:
            return {"error": "Inventory not found"}, 404


