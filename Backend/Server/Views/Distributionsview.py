from  flask_restful import Resource
from Server.Models.Inventory import Inventory, db, Distribution, Transfer
from Server.Models.Shops import ShopStock, Shops
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


class InventoryDistribute(Resource):
    @jwt_required()
    @check_role('manager')
    def post(self):
        data = request.get_json()

        # Validate input data
        if not data:
            return {"error": "No input data provided"}, 400

        inventory_id = data.get('inventory_id')
        transfers = data.get('transfers')
        # distributed_by = data.get('distributed_by')  # Optional

        if not inventory_id or not transfers:
            return {"error": "inventory_id and transfers are required fields"}, 400

        # Calculate total quantity to transfer
        total_transfer_qty = 0
        for transfer in transfers:
            qty = transfer.get('quantity')
            if qty is None or qty <= 0:
                return {"error": "Each transfer must have a positive quantity"}, 400
            total_transfer_qty += qty

        try:
            # Start a transaction
            with db.session.begin_nested():
                # Fetch the inventory item
                inventory_item = Inventory.query.get(inventory_id)
                if not inventory_item:
                    return {"error": f"Inventory item with ID {inventory_id} not found"}, 404

                if inventory_item.quantity < total_transfer_qty:
                    return {
                        "error": "Insufficient stock in inventory",
                        "available_quantity": inventory_item.quantity,
                        "requested_quantity": total_transfer_qty
                    }, 400

                # Deduct the total quantity from central inventory
                inventory_item.quantity -= total_transfer_qty
                db.session.add(inventory_item)

                # Create a distribution record
                distribution = Distribution(
                    inventory_id=inventory_id,
                    remaining_quantity=inventory_item.quantity,
                    # Convert the 'created_at' string to a datetime object
                    distributed_at=datetime.utcnow(),
                    # distributed_by=distributed_by
                )
                db.session.add(distribution)
                db.session.flush()  # To get distribution_id

                # Process each transfer
                transfer_responses = []
                for transfer in transfers:
                    shop_id = transfer.get('shop_id')
                    qty = transfer.get('quantity')

                    # Fetch the shop
                    shop = Shops.query.get(shop_id)
                    if not shop:
                        db.session.rollback()
                        return {"error": f"Shop with ID {shop_id} not found"}, 404

                    # Fetch or create ShopStock
                    shop_stock = ShopStock.query.filter_by(
                        shop_id=shop_id,
                        inventory_id=inventory_id
                    ).first()

                    # **New: Calculate total_cost and retrieve unit_price**
                    total_cost = inventory_item.unitCost * qty
                    unit_price = inventory_item.unitPrice

                    if shop_stock:
                        shop_stock.quantity += qty
                        # **New: Update total_cost in ShopStock**
                        shop_stock.total_cost += total_cost
                        # **Assuming unit_price remains the same; otherwise, handle accordingly**
                    else:
                        # **New: Create ShopStock with total_cost and unit_price**
                        shop_stock = ShopStock(
                            shop_id=shop_id,
                            inventory_id=inventory_id,
                            quantity=qty,
                            total_cost=total_cost,      # New Field
                            unit_price=unit_price       # New Field
                        )
                        db.session.add(shop_stock)

                    # **New: Create a transfer record with total_cost**
                    transfer_record = Transfer(
                        distribution_id=distribution.distribution_id,
                        shop_id=shop_id,
                        quantity=qty,
                        total_cost=total_cost          # New Field
                    )
                    db.session.add(transfer_record)

                    # **Updated: Include total_cost and unit_price in the response**
                    transfer_responses.append({
                        "shop_id": shop_id,
                        "shop_name": shop.shopname,
                        "transferred_quantity": qty,
                        "total_cost": total_cost,      # New Field
                        "unit_price": unit_price       # New Field
                    })

                # Commit the transaction
                db.session.commit()

            # Prepare the response
            response = {
                "message": "Stock distributed successfully",
                "distribution_id": distribution.distribution_id,
                "inventory_item": {
                    "inventory_id": inventory_item.inventory_id,
                    "item_name": inventory_item.itemname,
                    "remaining_quantity": inventory_item.quantity
                },
                "transfers": transfer_responses,
                "distributed_at": distribution.distributed_at.isoformat()
            }

            return response, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "An error occurred during the distribution process"}, 500


#Getting distributions made
class GetAllDistributions(Resource):
    
    @jwt_required()
    @check_role('manager')  # Adjust role as needed
    def get(self):
        try:
            # Optional: Implement pagination
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 10, type=int)
            
            # Query all distributions with pagination
            distributions = Distribution.query.options(joinedload(Distribution.transfers).joinedload(Transfer.shop)).order_by(Distribution.distributed_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
            
            distribution_list = []
            for dist in distributions.items:
                transfer_details = []
                for transfer in dist.transfers:
                    transfer_details.append({
                        "transfer_id": transfer.transfer_id,
                        "shop_id": transfer.shop_id,
                        "shopname": transfer.shop.shopname,
                        "quantity_transferred": transfer.quantity
                    })
                
                distribution_list.append({
                    "distribution_id": dist.distribution_id,
                    "inventory_id": dist.inventory_id,
                    "item_name": dist.inventory.itemname,
                    "distributed_at": dist.distributed_at.isoformat(),
                    "remaining_quantity": dist.remaining_quantity,
                    # "distributed_by": dist.distributed_by,
                    "transfers": transfer_details
                })
            
            response = {
                # "current_page": distributions.page,
                # "per_page": distributions.per_page,
                # "total_pages": distributions.pages,
                "total_distributions": distributions.total,
                "distributions": distribution_list
            }
            
            return response, 200
        
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "An error occurred while fetching distributions"}, 500


class GetDistributionById(Resource):
    @jwt_required()
    @check_role('manager')  
    def get(self, distribution_id):
        try:
            distribution = Distribution.query.options(joinedload(Distribution.transfers).joinedload(Transfer.shop)).get(distribution_id)
            
            if not distribution:
                return {"error": f"Distribution with ID {distribution_id} not found"}, 404
            
            transfer_details = []
            for transfer in distribution.transfers:
                transfer_details.append({
                    "transfer_id": transfer.transfer_id,
                    "shop_id": transfer.shop_id,
                    "shopname": transfer.shop.shopname,
                    "quantity_transferred": transfer.quantity
                })
            
            response = {
                "distribution_id": distribution.distribution_id,
                "inventory_id": distribution.inventory_id,
                "item_name": distribution.inventory.itemname,
                "distributed_at": distribution.distributed_at.isoformat(),
                "remaining_quantity": distribution.remaining_quantity,
                # "distributed_by": distribution.distributed_by,
                "transfers": transfer_details
            }
            
            return response, 200
        
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "An error occurred while fetching the distribution"}, 500