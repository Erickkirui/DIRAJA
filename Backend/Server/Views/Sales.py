from app import db
from flask_restful import Resource
from Server.Models.Sales import Sales
from Server.Models.Users import Users
from Server.Models.Shops import Shops
from Server.Utils import get_sales_filtered, serialize_sales
from flask import jsonify,request,make_response
from Server.Models.Shopstock import ShopStock
from Server.Models.Inventory import Inventory 
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from flask import jsonify, request
from functools import wraps


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

class AddSale(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()  # Get the JSON data from the request
        current_user_id = get_jwt_identity()

        try:
            # Validate and extract data
            shop_id = data.get('shop_id')
            customer_name = data.get('customer_name')
            status = data.get('status', 'unpaid')  # Default to 'unpaid'
            customer_number = data.get('customer_number')
            inventory_id = data.get('inventory_id')  # Assuming you select items by inventory_id
            quantity = data.get('quantity')
            amount_paid = data.get('amount_paid')
            payment_method = data.get('payment_method')

            created_at = data.get('created_at')
            if created_at:
                created_at = datetime.strptime(created_at, '%Y-%m-%d')

            # Ensure required fields are present
            if not all([shop_id, customer_name, customer_number, inventory_id, quantity, amount_paid, payment_method]):
                return {"error": "Missing required fields"}, 400

            # Fetch the shop's stock information based on shop_id and inventory_id
            shop_stock = ShopStock.query.filter_by(shop_id=shop_id, inventory_id=inventory_id).first()
            if not shop_stock:
                return {"error": "Item not available in the shop"}, 400

            # Fetch the item name and unit cost from the Inventory table based on inventory_id
            inventory_item = Inventory.query.filter_by(inventory_id=inventory_id).first()
            if not inventory_item:
                return {"error": "Inventory item not found"}, 400

            # Check if enough stock is available in the shop's stock
            if shop_stock.quantity < quantity:
                return {"error": "Not enough stock available"}, 400

            # Update the stock quantity in ShopStock
            shop_stock.quantity -= quantity

            unit_price = shop_stock.unit_price
            total_price = quantity * unit_price

            # Update total_cost in ShopStock based on remaining quantity
            shop_stock.total_cost = shop_stock.quantity * inventory_item.unitCost

            # Create a new Sale object
            new_sale = Sales(
                user_id=current_user_id,
                shop_id=shop_id,
                customer_name=customer_name,
                status=status,
                customer_number=customer_number,
                item_name=inventory_item.itemname,  # Use item name from the Inventory table
                quantity=quantity,
                metric=inventory_item.metric,  # Assuming metric is stored in ShopStock
                unit_price=unit_price,
                amount_paid=amount_paid,
                total_price=total_price,
                payment_method=payment_method,
                created_at=created_at
            )

            # Add the new sale to the database
            db.session.add(new_sale)
            db.session.commit()

            return {"message": "Sale added successfully"}, 201

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500


        
class GetSales(Resource):
    @jwt_required()
    def get(self):
        try:
            # Query all sales from the Sales table
            sales = Sales.query.all()

            # If no sales found
            if not sales:
                return jsonify({"message": "No sales found"}), 404

            # Format sales data into a list of dictionaries
            sales_data = []
            for sale in sales:
                sales_data.append({
                    "sale_id": sale.sale_id,  # Assuming `sale_id` is the primary key
                    "user_id": sale.user_id,
                    "shop_id": sale.shop_id,
                    "customer_name": sale.customer_name,
                    "status": sale.status,
                    "customer_number": sale.customer_number,
                    "item_name": sale.item_name,
                    "quantity": sale.quantity,
                    "metric": sale.metric,
                    "unit_price": sale.unit_price,
                    "amount_paid": sale.amount_paid,
                    "total_price": sale.total_price,
                    "payment_method": sale.payment_method,
                    "created_at": sale.created_at.strftime('%Y-%m-%d')  # Convert datetime to string
                })

            # Return the list of sales
            return jsonify({"sales": sales_data}), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500
        

class GetSalesByShop(Resource):
    @jwt_required()
    def get(self, shop_id):
        try:
            # Query the Sales table for sales related to the given shop_id
            sales = Sales.query.filter_by(shop_id=shop_id).all()

            # If no sales found for the shop
            if not sales:
                return jsonify({"message": "No sales found for this shop"}), 404

            # Format sales data into a list of dictionaries
            sales_data = []
            for sale in sales:
                sales_data.append({
                    "sale_id": sale.sale_id,  # Assuming `sale_id` is the primary key
                    "user_id": sale.user_id,
                    "shop_id": sale.shop_id,
                    "customer_name": sale.customer_name,
                    "status": sale.status,
                    "customer_number": sale.customer_number,
                    "item_name": sale.item_name,
                    "quantity": sale.quantity,
                    "metric": sale.metric,
                    "unit_price": sale.unit_price,
                    "amount_paid": sale.amount_paid,
                    "total_price": sale.total_price,
                    "payment_method": sale.payment_method,
                    "created_at": sale.created_at.strftime('%Y-%m-%d')  # Convert datetime to string
                })

            # Return the list of sales
            return jsonify({"sales": sales_data}), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500
        

class SalesResources(Resource):
    @jwt_required()
    def get(self, sales_id):
        try:
            # Fetch sale by sales_id
            sale = Sales.query.get(sales_id)

            if not sale:
                return jsonify({"message": "Sale not found"}), 404

            # Prepare sale data
            sale_data = {
                "sale_id": sale.sale_id,  # Assuming `sale_id` is the primary key
                "user_id": sale.user_id,
                "shop_id": sale.shop_id,
                "customer_name": sale.customer_name,
                "status": sale.status,
                "customer_number": sale.customer_number,
                "item_name": sale.item_name,
                "quantity": sale.quantity,
                "metric": sale.metric,
                "unit_price": sale.unit_price,
                "amount_paid": sale.amount_paid,
                "total_price": sale.total_price,
                "payment_method": sale.payment_method,
                "created_at": sale.created_at.strftime('%Y-%m-%d')  # Convert datetime to string
            }

            return jsonify({"sale": sale_data}), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @jwt_required()
    def put(self, sales_id):
        try:
            sale = Sales.query.get(sales_id)

            if not sale:
                return jsonify({"message": "Sale not found"}), 404

            # Get JSON data from request
            data = request.get_json()

            # Update fields if provided
            sale.customer_name = data.get('customer_name', sale.customer_name)
            sale.status = data.get('status', sale.status)
            sale.customer_number = data.get('customer_number', sale.customer_number)
            sale.item_name = data.get('item_name', sale.item_name)
            sale.quantity = data.get('quantity', sale.quantity)
            sale.metric = data.get('metric', sale.metric)
            sale.unit_price = data.get('unit_price', sale.unit_price)
            sale.amount_paid = data.get('amount_paid', sale.amount_paid)
            sale.total_price = data.get('total_price', sale.total_price)
            sale.payment_method = data.get('payment_method', sale.payment_method)
            
            created_at = data.get('created_at')
            if created_at:
                sale.created_at = datetime.strptime(created_at, '%Y-%m-%d')

            # Commit the changes
            db.session.commit()

            return jsonify({"message": "Sale updated successfully"}), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500

    @jwt_required()
    def delete(self, sales_id):
        try:
            sale = Sales.query.get(sales_id)

            if not sale:
                return jsonify({"message": "Sale not found"}), 404

            # Delete the sale
            db.session.delete(sale)
            db.session.commit()

            return jsonify({"message": "Sale deleted successfully"}), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500


class TodaysSales(Resource):

    @jwt_required()
    @check_role('manager')
    def get(self):
        sales = get_sales_filtered('today').all()
        return make_response(jsonify(serialize_sales(sales)), 200)

class WeeksSales(Resource):

    @jwt_required()
    @check_role('manager')
    def get(self):
        sales = get_sales_filtered('week').all()
        return make_response(jsonify(serialize_sales(sales)), 200)

class MonthsSales(Resource):

    @jwt_required()
    @check_role('manager')
    def get(self):
        sales = get_sales_filtered('month').all()
        return make_response(jsonify(serialize_sales(sales)), 200)
    
    
