from  flask_restful import Resource
from Server.Models.Inventory import Inventory, db
# from Server.Models.Distribution import Distribution
from Server.Models.Transfer import Transfer
from Server.Models.Shops import Shops
from Server.Models.Shopstock import ShopStock
from Server.Models.BankAccounts import BankAccount, BankingTransaction
from Server.Models.Users import Users
from app import db
from functools import wraps
from flask import request,make_response,jsonify
from flask_jwt_extended import jwt_required,get_jwt_identity
from dateutil import parser
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from sqlalchemy.orm import joinedload
import logging
from flask import jsonify
from flask import current_app
import re



def check_role(allowed_roles):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = Users.query.get(current_user_id)
            if user and user.role not in allowed_roles:
                return make_response(jsonify({"error": "Unauthorized access"}), 403)
            return fn(*args, **kwargs)
        return decorator
    return wrapper




class GetInventoryByBatch(Resource):
    @jwt_required()
    @check_role(['manager', 'procurement'])
    def get(self):
        try:
            # Fetch all inventory items
            inventories = Inventory.query.all()

            # Custom sorting function for batch numbers
            def batch_sort_key(inventory):
                match = re.match(r"^.*-(?P<letter>[A-Z])(?P<number>\d+)$", inventory.BatchNumber)
                if match:
                    letter = match.group("letter")
                    number = int(match.group("number"))
                    return (letter, number)  # Sort first by letter, then by number
                return ("Z", 9999)  # Fallback for unexpected formats

            # Sort inventory items based on custom BatchNumber logic
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
    @check_role(['manager', 'procurement'])
    def post(self):
        data = request.get_json()
        current_user_id = get_jwt_identity()

        # Validate required fields
        required_fields = ['shop_id', 'inventory_id', 'quantity', 'itemname', 'unitCost', 'amountPaid', 'BatchNumber', 'created_at', 'metric']
        if not all(field in data for field in required_fields):
            return jsonify({'message': 'Missing required fields'}), 400

        # Extract fields
        shop_id = data['shop_id']
        inventory_id = data['inventory_id']
        quantity = data['quantity']
        metric = data['metric']
        itemname = data['itemname']
        unitCost = data['unitCost']
        amountPaid = data['amountPaid']
        BatchNumber = data['BatchNumber']

        # Parse created_at date
        try:
            distribution_date = parser.isoparse(data['created_at'])  # ✅ Handles 'Z' suffix
        except ValueError:
            return jsonify({'message': 'Invalid date format'}), 400

        # Fetch inventory item
        inventory_item = Inventory.query.get(inventory_id)
        if not inventory_item:
            return jsonify({'message': 'Inventory item not found'}), 404

        if inventory_item.quantity < quantity:
            return jsonify({'message': 'Insufficient inventory quantity'}), 400

        # Create transfer record
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
            created_at=distribution_date  # ✅ Use parsed date
        )

        # Update inventory quantity
        inventory_item.quantity -= quantity

        # Save transfer record
        try:
            db.session.add(new_transfer)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': 'Error creating transfer', 'error': str(e)}), 500

        # Create shop stock record
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

        # Save shop stock record
        try:
            db.session.add(new_shop_stock)
            db.session.commit()
            return {'message': 'Inventory distributed successfully'}, 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': 'Error creating shop stock', 'error': str(e)}), 500


class DeleteShopStock(Resource):
    @jwt_required()
    @check_role(['manager', 'procurement'])
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
    @check_role(['manager', 'procurement'])
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


class GetTransferById(Resource):
    @jwt_required()
    @check_role(['manager', 'procurement'])
    def get(self, transfer_id):
        transfer = Transfer.query.filter_by(transfer_id=transfer_id).first()
        
        if not transfer:
            return make_response(jsonify({"message": "Transfer not found"}), 404)
        
        # Fetch username and shop name manually using user_id and shop_id
        user = Users.query.filter_by(users_id=transfer.user_id).first()
        shop = Shops.query.filter_by(shops_id=transfer.shop_id).first()
        
        # Handle cases where user or shop may not be found
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
    @check_role(['manager', 'procurement'])
    def put(self, transfer_id):
        data = request.get_json()
        transfer = Transfer.query.filter_by(transfer_id=transfer_id).first()

        if not transfer:
            return make_response(jsonify({"message": "Transfer not found"}), 404)

        # Update transfer fields if they exist in the request data
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

        # Handle the date field update (if provided)
        if 'date' in data:
            try:
                transfer.created_at = datetime.strptime(data['date'], '%Y-%m-%d')  # Update the date field
            except ValueError:
                return make_response(jsonify({"message": "Invalid date format. Use YYYY-MM-DD."}), 400)

        db.session.commit()

        return make_response(jsonify({"message": "Transfer updated successfully"}), 200)




class AddInventory(Resource):
    @jwt_required()
    @check_role(['manager', 'procurement'])
    def post(self):
        data = request.get_json()
        current_user_id = get_jwt_identity()

        required_fields = ['itemname', 'quantity', 'metric', 'unitCost', 'amountPaid', 'unitPrice',
                           'Suppliername', 'Supplier_location', 'created_at']
        if not all(field in data for field in required_fields):
            return {'message': 'Missing required fields'}, 400

        # Extract and process fields
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

        # Generate batch number
        last_inventory = Inventory.query.order_by(Inventory.inventory_id.desc()).first()
        next_batch_number = 1 if not last_inventory else last_inventory.inventory_id + 1
        batch_code = Inventory.generate_batch_code(Suppliername, Supplier_location, itemname, created_at, next_batch_number)

        if not source:
            source = "Unknown"

        # === Deduct amount from bank account and log the transaction ===
        if source != "Unknown":
            account = BankAccount.query.filter_by(Account_name=source).first()
            if not account:
                return {'message': f'Bank account with name "{source}" not found'}, 404

            # if account.Account_Balance < amountPaid:
            #     return {'message': f'Insufficient balance in account "{source}"'}, 400

            # Deduct the amount from the account balance
            account.Account_Balance -= amountPaid
            db.session.add(account)

            # Log the banking transaction
            transaction = BankingTransaction(
                account_id=account.id,
                Transaction_type_debit=amountPaid,
                Transaction_type_credit=None
            )
            db.session.add(transaction)

        # === Create Inventory Record ===
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
    @check_role(['manager', 'procurement'])
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
            "unitPrice": inventory.unitPrice,
            "source":inventory.source,
            "paymentRef":inventory.paymentRef
        } for inventory in inventories]

        return make_response(jsonify(all_inventory), 200)
    
class InventoryResourceById(Resource):
    @jwt_required()
    @check_role(['manager', 'procurement'])
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
                "created_at": inventory.created_at.strftime('%Y-%m-%d') if inventory.created_at else None,
                "unitPrice": inventory.unitPrice,
                "source":inventory.source,
                "paymentRef":inventory.paymentRef,
                "Suppliername": inventory.Suppliername,
                "Supplier_location": inventory.Supplier_location
            }, 200
        else:
            return {"error": "Inventory not found"}, 404
        
    @jwt_required()
    @check_role(['manager', 'procurement'])
    def delete(self, inventory_id):
        # Fetch inventory by ID
        inventory = Inventory.query.get(inventory_id)

        if not inventory:
            return {"error": "Inventory not found"}, 404
        
        try:
            # You can add logic here to check for related records like transfers, shop stocks, etc., and delete them as necessary
            # For example, if there are related `Transfer` records, delete them too
            transfers = Transfer.query.filter_by(inventory_id=inventory_id).all()
            for transfer in transfers:
                db.session.delete(transfer)
            
            # Similarly, if there are related `ShopStock` records, delete them
            shop_stocks = ShopStock.query.filter_by(inventory_id=inventory_id).all()
            for stock in shop_stocks:
                db.session.delete(stock)

            # Finally, delete the inventory record
            db.session.delete(inventory)
            db.session.commit()

            return {"message": "Inventory deleted successfully"}, 200
        
        except Exception as e:
            db.session.rollback()
            return {"message": "Error deleting inventory", "error": str(e)}, 500

    @jwt_required()
    @check_role(['manager', 'procurement'])
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
            balance = totalCost - amountPaid  # Calculate balance
            Suppliername = data.get('Suppliername', inventory.Suppliername)
            Supplier_location = data.get('Supplier_location', inventory.Supplier_location)
            note = data.get('note', inventory.note)

            # Handle 'created_at' field
            created_at_str = data.get('created_at', None)
            if created_at_str:
                # Ensure the date string is in the correct format
                try:
                    created_at = datetime.strptime(created_at_str, '%Y-%m-%d')  # Parse as datetime object
                except ValueError:
                    return jsonify({'message': 'Invalid date format for created_at, expected YYYY-MM-DD'}), 400
            else:
                created_at = inventory.created_at  # Use the original 'created_at' if not provided

            # Update inventory details
            inventory.itemname = itemname
            inventory.initial_quantity = initial_quantity
            inventory.unitCost = unitCost
            inventory.unitPrice = unitPrice
            inventory.totalCost = totalCost
            inventory.amountPaid = amountPaid
            inventory.balance = balance  # Update the balance with the correct spelling
            inventory.Suppliername = Suppliername
            inventory.Supplier_location = Supplier_location
            inventory.note = note
            inventory.created_at = created_at  # Update the created_at field

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

    
class StockDeletionResource(Resource):     
    @jwt_required()
    @check_role(['manager', 'procurement'])
    def delete(self, stock_id):
        stock = ShopStock.query.get(stock_id)

        if not stock:
            return {"error": "Stock not found"}, 404

        try:
            # Fetch all transfer records related to this stock, checking by shop_id and itemname for manual transfer
            if stock.inventory_id == 0:
                related_transfers = Transfer.query.filter_by(shop_id=stock.shop_id, itemname=stock.itemname).all()
            else:
                related_transfers = Transfer.query.filter_by(stock_id=stock_id).all()

            # Delete related transfer records
            if related_transfers:
                for transfer in related_transfers:
                    db.session.delete(transfer)

            # If stock originated from normal inventory transfer (not manual transfer)
            if stock.inventory_id != 0:
                inventory = Inventory.query.get(stock.inventory_id)
                if inventory:
                    inventory.quantity += stock.quantity  # Return stock to inventory instead of deleting

            # Delete the stock record
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
    def post(self):
        data = request.get_json()
        current_user_id = get_jwt_identity()

        # Define the allowed shop ID for manual transfers
        MANUAL_TRANSFER_SHOP_ID = 12  # Replace with the actual shop ID

        # Validate required fields
        required_fields = ['itemname', 'quantity', 'metric', 'unitCost', 'unitPrice', 'amountPaid']
        if not all(field in data for field in required_fields):
            return {'message': 'Missing required fields'}, 400

        try:
            # Extract and convert data
            itemname = data['itemname']
            quantity = float(data['quantity'])
            metric = data['metric'].strip().lower()
            unitCost = float(data['unitCost'])
            unitPrice = float(data['unitPrice'])
            amountPaid = float(data['amountPaid'])
            batch_number = itemname  # Set batch number to item name

            # Convert trays to eggs if metric is "tray"
            if metric == "tray":
                quantity *= 30  # Convert trays to eggs
                metric = "egg"

            # Create new transfer record with inventory_id set to None
            new_transfer = Transfer(
                shop_id=MANUAL_TRANSFER_SHOP_ID,
                inventory_id= None,  # Set to None to avoid foreign key constraint issue
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

            # Check if the item already exists in shop stock
            existing_stock = ShopStock.query.filter_by(
                shop_id=MANUAL_TRANSFER_SHOP_ID,
                itemname=itemname,
                metric=metric,
                BatchNumber=batch_number
            ).first()

            if existing_stock:
                # Update existing stock
                existing_stock.quantity += quantity
                existing_stock.total_cost += unitCost * quantity
                existing_stock.unitPrice = unitPrice  # Update price if necessary
            else:
                # Create new shop stock record
                new_shop_stock = ShopStock(
                    shop_id=MANUAL_TRANSFER_SHOP_ID,
                    inventory_id=None,  # Ensure consistency in related tables
                    transfer_id=new_transfer.transfer_id,  # Link to transfer
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




