from app import db
from flask_restful import Resource
from Server.Models.Sales import Sales
from Server.Models.Users import Users
from Server.Models.Shops import Shops
from Server.Utils import get_sales_filtered, serialize_sales
from flask import jsonify,request,make_response
from Server.Models.Shopstock import ShopStock
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
        data = request.get_json()
        current_user_id = get_jwt_identity()

        # Validate required fields
        required_fields = [
            'shop_id', 'customer_name', 'customer_number', 'item_name', 
            'quantity', 'metric', 'unit_price', 'amount_paid', 
            'total_price', 'payment_method', 'BatchNumber', 'stock_id'
        ]
        if not all(field in data for field in required_fields):
            return jsonify({'message': 'Missing required fields'}), 400

        # Extract data
        shop_id = data.get('shop_id')
        customer_name = data.get('customer_name')
        customer_number = data.get('customer_number')
        item_name = data.get('item_name')
        quantity = data.get('quantity')
        metric = data.get('metric')
        unit_price = data.get('unit_price')
        amount_paid = data.get('amount_paid')
        total_price = data.get('total_price')
        payment_method = data.get('payment_method')
        batch_number = data.get('BatchNumber')
        stock_id = data.get('stock_id')  # Use stock_id from shop stock
        status = data.get('status', 'unpaid')  # Optional field, defaults to 'unpaid'
        created_at = datetime.utcnow()

        # Calculate balance
        balance = amount_paid - total_price  # Calculate balance based on amount paid and total price

        # Create new sale record
        new_sale = Sales(
            user_id=current_user_id,
            shop_id=shop_id,
            customer_name=customer_name,
            customer_number=customer_number,
            item_name=item_name,
            quantity=quantity,
            metric=metric,
            unit_price=unit_price,
            amount_paid=amount_paid,
            total_price=total_price,
            payment_method=payment_method,
            BatchNumber=batch_number,
            stock_id=stock_id,  # Include stock_id in the sales record
            ballance=balance,  # Store calculated balance
            status=status,
            created_at=created_at
        )

        # Check inventory availability (if needed)
        shop_stock_item = ShopStock.query.filter_by(stock_id=stock_id).first()
        if not shop_stock_item or shop_stock_item.quantity < quantity:
            return {'message': 'Insufficient inventory quantity'}, 400

        # Update the shop stock quantity
        shop_stock_item.quantity -= quantity  # Subtract sold quantity from shop stock

        try:
            # Save to database
            db.session.add(new_sale)
            db.session.commit()
            return {'message': 'Sale added successfully'}, 201
        except Exception as e:
            db.session.rollback()
            return {'message': 'Error adding sale', 'error': str(e)}, 500


        
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
    
    
