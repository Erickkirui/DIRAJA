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
        total_cost = data['total_cost']
        batch_number = data['BatchNumber']
        user_id = data['user_id']

        itemname = data['itemname']
        unitCost = data['unitCost']
        amountPaid = data['amountPaid']
        BatchNumber = data['BatchNumber']

        # Calculate total cost
        total_cost = unitCost * quantity

        # Check if there is enough quantity in inventory
        inventory_item = Inventory.query.get(inventory_id)
        if not inventory_item or inventory_item.quantity < quantity:
            return jsonify({'message': 'Insufficient inventory quantity'}), 400

        # Create new transfer record
        new_transfer = Transfer(
            shop_id=shop_id,
            inventory_id=inventory_id,
            quantity=quantity,
            total_cost=total_cost,

            BatchNumber=BatchNumber,
            user_id=current_user_id,

            metric = metric,
            # BatchNumber=batch_number,
            # user_id=user_id,

            itemname=itemname,
            amountPaid=amountPaid,
            unitCost=unitCost
        )

        # Update the inventory quantity
        inventory_item.quantity -= quantity  # Subtract the transferred quantity

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
            transfer_id=new_transfer.transfer_id,  # Now this will have the correct transfer_id
            inventory_id=inventory_id,
            quantity=quantity,
            total_cost=total_cost,
            itemname=itemname,
            BatchNumber=BatchNumber,
            unitPrice=unitCost  # Assuming unit price is the same as unit cost for stock
        )

        # Create a record in the ShopStock table
        new_shop_stock = ShopStock(
            shop_id=shop_id,
            inventory_id=inventory_id,
            transfer_id=new_transfer.transfer_id,  # Link to the transfer
            total_cost=total_cost,
            itemname=itemname,
            metric=metric,
            quantity=quantity,
            BatchNumber=batch_number,
            unitPrice=total_cost / quantity if quantity else 0  # Calculate unit price if quantity > 0
        )

        # Add the new shop stock record to the session
        db.session.add(new_shop_stock)


        # Save the shop stock record
        try:
            db.session.add(new_shop_stock)
            db.session.commit()
            return {'message': 'Inventory distributed successfully'}, 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': 'Error creating shop stock', 'error': str(e)}), 500

   
class AddInventory(Resource):
    @jwt_required()
    @check_role('manager')
    def post(self):
        data = request.get_json()
        current_user_id = get_jwt_identity() 

        # Validate required fields (removed 'totalCost' from required fields)
        required_fields = ['itemname', 'quantity', 'metric', 'unitCost', 'amountPaid', 'unitPrice', 'created_at']
        if not all(field in data for field in required_fields):
            return jsonify({'message': 'Missing required fields'}), 400

        # Extract data
        itemname = data.get('itemname')
        quantity = data.get('quantity')
        metric = data.get('metric')
        unitCost = data.get('unitCost')
        amountPaid = data.get('amountPaid')
        unitPrice = data.get('unitPrice')
        created_at = data.get('created_at')

        # Calculate totalCost by multiplying unitCost and quantity
        totalCost = unitCost * quantity

        # Generate the batch number based on previous records
        last_inventory = Inventory.query.order_by(Inventory.inventory_id.desc()).first()
        next_batch_number = 1 if not last_inventory else last_inventory.inventory_id + 1

        # Generate the batch code using the static method
        batch_code = Inventory.generate_batch_code(itemname, created_at, next_batch_number)

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
            created_at=datetime.strptime(created_at, '%Y-%m-%d')
        )

        # Save to database
        try:
            db.session.add(new_inventory)
            db.session.commit()
            return {'message': 'Inventory added successfully', 'BatchNumber': batch_code}, 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': 'Error adding inventory', 'error': str(e)}), 500


    
# class AddInventory(Resource):
#     @jwt_required()
#     @check_role('manager')
#     def post(self):
#         data = request.get_json()
        
#         required_fields = ['itemname', 'quantity', 'metric', 'unitCost', 'totalCost', 'amountPaid', 'unitPrice']
#         if not all(field in data for field in required_fields):
#             return {'message': 'Missing itemname, quantity, metric, unitCost, totalCost, amountPaid, or unitPrice'}, 400

#         itemname = data.get('itemname')
#         quantity = data.get('quantity') 
#         metric = data.get('metric')
#         totalCost = data.get('totalCost')
#         unitCost = data.get('unitCost')
#         amountPaid = data.get('amountPaid')
#         unitPrice = data.get('unitPrice')
        
        
         
#         # Convert the 'created_at' string to a datetime object
#         created_at = data.get('created_at')
#         if created_at:
#             created_at = datetime.strptime(created_at, '%Y-%m-%d')
        
#         inventory = Inventory(
#             itemname=itemname, 
#             quantity=quantity,  # Set initial_quantity
#             remaining_quantity=quantity,          # Set remaining quantity
#             metric=metric, 
#             totalCost=totalCost, 
#             unitCost=unitCost, 
#             amountPaid=amountPaid, 
#             unitPrice=unitPrice,
#             created_at=created_at
#         )
#         db.session.add(inventory)
#         db.session.commit()
        
#         return {'message': 'Inventory added successfully'}, 201

    
    
class GetAllInventory(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
    
        inventories = Inventory.query.all()

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
            "created_at": inventory.created_at.strftime('%Y-%m-%d %H:%M:%S') if inventory.created_at else None,
            "unitPrice": inventory.unitPrice
        } for inventory in inventories]

        return make_response(jsonify(all_inventory), 200)


class InventoryResourceById(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self, inventory_id):

        inventory = Inventory.query.get(inventory_id)
   
        if inventory :
            return {
            "inventory_id": inventory.inventory_id,
            "itemname": inventory.itemname,
            "quantity": inventory.quantity,
            "metric": inventory.metric,
            "totalCost" : inventory.totalCost,
            "unitCost": inventory.unitCost,
            "batchnumber": inventory.BatchNumber,
            "amountPaid": inventory.amountPaid,
            "created_at": inventory.created_at.strftime('%Y-%m-%d %H:%M:%S') if inventory.created_at else None,
            "unitPrice": inventory.unitPrice
        }, 200
        else:
             return {"error": "Inventory not found"}, 400


    @jwt_required()
    @check_role('manager')
    def put(self, inventory_id):
        inventory = Inventory.query.get(inventory_id)
        if not inventory:
            return {"error": "Item not found"}, 404
        
        data = request.get_json()
        
        # Update the shop's fields
        if 'itemname' in data:
            inventory.itemname = data['itemname']
        if 'quantity' in data:
            inventory.quantity = data['quantity']
        if 'metric' in data:
            inventory.metric = data['metric']
        if 'unitCost' in data:
            inventory.unitCost = data['unitCost']
        if 'totalCost' in data:
            inventory.totalcost = data['totalCost']
        if 'amountPaid' in data:
            inventory.amountPaid = data['amountPaid']
        if 'unitPrice' in data:
            inventory.metric = data['unitPrice']
        
        db.session.commit()
        
        return {"message": "Invemtory updated successfully"}, 200
    

    @jwt_required()
    @check_role('manager')
    def delete(self, inventory_id):

        inventory = Inventory.query.get(inventory_id)
        
        if inventory:
            db.session.delete(inventory)  
            db.session.commit()  
            return {"message": "item deleted successfully"}, 200
        else:
            return {"error": "item not found"}, 404


