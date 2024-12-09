from app import db
from flask_restful import Resource
from Server.Models.Sales import Sales
from Server.Models.Users import Users
from Server.Models.Shops import Shops
from Server.Models.Expenses import Expenses
from Server.Models.Inventory import Inventory
from Server.Models.Customers import Customers
from Server.Utils import get_sales_filtered, serialize_sales
from flask import jsonify,request,make_response
from Server.Models.Shopstock import ShopStock
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError
from flask import jsonify, request
from functools import wraps
from datetime import datetime


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

        # Validate required fields for sale
        required_fields = [
            'shop_id', 'customer_name', 'customer_number', 'item_name', 
            'quantity', 'metric', 'unit_price', 'amount_paid', 
            'payment_method', 'BatchNumber', 'stock_id'
        ]
        if not all(field in data for field in required_fields):
            return jsonify({'message': 'Missing required fields'}), 400

        # Extract and convert data
        shop_id = data.get('shop_id')
        customer_name = data.get('customer_name')
        customer_number = data.get('customer_number')
        item_name = data.get('item_name')
        
        # Convert to float or int where necessary
        try:
            quantity = int(data.get('quantity', 0))  # Default to 0 if not provided
            metric = data.get('metric')
            unit_price = float(data.get('unit_price', 0.0))  # Default to 0.0 if not provided
            amount_paid = float(data.get('amount_paid', 0.0))  # Default to 0.0 if not provided
            payment_method = data.get('payment_method')
            batch_number = data.get('BatchNumber')
            stock_id = data.get('stock_id')  # Use stock_id from shop stock
            status = data.get('status', 'unpaid')  # Optional field, defaults to 'unpaid'
            created_at = datetime.utcnow()
        except ValueError:
            return jsonify({'message': 'Invalid input for quantity, unit price, or amount paid'}), 400

        # Calculate total price based on unit price and quantity
        total_price = unit_price * quantity
        
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
            total_price=total_price,  # Use calculated total_price
            payment_method=payment_method,
            BatchNumber=batch_number,
            stock_id=stock_id,  # Include stock_id in the sales record
            balance=balance,  # Store calculated balance
            status=status,
            created_at=created_at
        )

        # Check inventory availability
        shop_stock_item = ShopStock.query.filter_by(stock_id=stock_id).first()
        if not shop_stock_item or shop_stock_item.quantity < quantity:
            return {'message': 'Insufficient inventory quantity'}, 400

        # Update the shop stock quantity
        shop_stock_item.quantity -= quantity  # Subtract sold quantity from shop stock

        # Create new customer record
        new_customer = Customers(
            customer_name=customer_name,
            customer_number=customer_number,
            shop_id=shop_id,
            sales_id=new_sale.sales_id,  # Link the sale to the customer
            user_id=current_user_id,
            item=item_name,
            amount_paid=amount_paid,
            payment_method=payment_method,
            created_at=created_at
        )
                                                
        try:
            # Save both sale and customer to the database
            db.session.add(new_sale)
            db.session.add(new_customer)
            db.session.commit()
            return {'message': 'Sale and customer added successfully'}, 201
        except Exception as e:
            db.session.rollback()
            return {'message': 'Error adding sale and customer', 'error': str(e)}, 500
        
class GetSales(Resource):
    @jwt_required()
    def get(self):
        try:
            # Query all sales from the Sales table in descending order by created_at
            sales = Sales.query.order_by(Sales.created_at.desc()).all()

            # If no sales found
            if not sales:
                return {"message": "No sales found"}, 404

            # Format sales data into a list of dictionaries
            sales_data = []
            for sale in sales:
                # Fetch username and shop name manually using user_id and shop_id
                user = Users.query.filter_by(users_id=sale.user_id).first()
                shop = Shops.query.filter_by(shops_id=sale.shop_id).first()
                
                # Handle cases where user or shop may not be found
                username = user.username if user else "Unknown User"
                shopname = shop.shopname if shop else "Unknown Shop"

                sales_data.append({
                    "sale_id": sale.sales_id,  # Assuming `sales_id` is the primary key
                    "user_id": sale.user_id,
                    "username": username,
                    "shop_id": sale.shop_id,
                    "shopname": shopname,
                    "customer_name": sale.customer_name,
                    "status": sale.status,
                    "customer_number": sale.customer_number,
                    "item_name": sale.item_name,
                    "quantity": sale.quantity,
                    "batchnumber": sale.BatchNumber,
                    "balance": sale.balance,
                    "metric": sale.metric,
                    "unit_price": sale.unit_price,
                    "amount_paid": sale.amount_paid,
                    "total_price": sale.total_price,
                    "payment_method": sale.payment_method,
                    "created_at": sale.created_at.strftime('%Y-%m-%d')  # Convert datetime to string
                })

            # Return the list of sales
            return make_response(jsonify(sales_data), 200)

        except Exception as e:
            return {"error": str(e)}, 500


class GetSalesByShop(Resource):
    @jwt_required()
    def get(self, shop_id):
        try:
            # Query the Sales table for sales related to the given shop_id
            sales = Sales.query.filter_by(shop_id=shop_id).order_by(Sales.created_at.asc()).all()


            # If no sales found for the shop
            if not sales:
                return jsonify({"message": "No sales found for this shop"}), 404

            # Format sales data into a list of dictionaries
            sales_data = []
            for sale in sales:
                # Fetch username and shop name manually using user_id and shop_id
                user = Users.query.filter_by(users_id=sale.user_id).first()
                shop = Shops.query.filter_by(shops_id=sale.shop_id).first()
                
                # Handle cases where user or shop may not be found
                username = user.username if user else "Unknown User"
                shopname = shop.shopname if shop else "Unknown Shop"
                
                sales_data.append({
                    "sale_id": sale.sales_id,  # Assuming `sales_id` is the primary key
                    "user_id": sale.user_id,
                    "username": username,
                    "shop_id": sale.shop_id,
                    "shop_name": shopname,
                    "customer_name": sale.customer_name,
                    "status": sale.status,
                    "customer_number": sale.customer_number,
                    "item_name": sale.item_name,
                    "quantity": sale.quantity,
                    "batchnumber": sale.BatchNumber,
                    "balance": sale.balance,
                    "metric": sale.metric,
                    "unit_price": sale.unit_price,
                    "amount_paid": sale.amount_paid,
                    "total_price": sale.total_price,
                    "payment_method": sale.payment_method,
                    "created_at": sale.created_at.strftime('%Y-%m-%d')  # Convert datetime to String
                })

            # Return the list of sales
            return {"sales": sales_data}, 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500


class SalesResources(Resource):
    @jwt_required()
    def get(self, sales_id):
        try:
            # Fetch sale by sales_id
            sale = Sales.query.get(sales_id)

            if not sale:
                return {"message": "Sale not found"}, 404
            
            # Fetch username and shop name using user_id and shop_id
            user = Users.query.filter_by(users_id=sale.user_id).first()
            shop = Shops.query.filter_by(shops_id=sale.shop_id).first()
            
            # Handle cases where user or shop may not be found
            username = user.username if user else "Unknown User"
            shopname = shop.shopname if shop else "Unknown Shop"

            # Prepare sale data
            sale_data = {
                "sale_id": sale.sales_id,  # Assuming `sale_id` is the primary key
                "user_id": sale.user_id,
                "username": username,
                "shop_id": sale.shop_id,
                "shop_name": shopname,
                "customer_name": sale.customer_name,
                "status": sale.status,
                "customer_number": sale.customer_number,
                "item_name": sale.item_name,
                "quantity": sale.quantity,
                "batchnumber": sale.BatchNumber,  # Ensure attribute name matches your model
                "balance": sale.balance,          
                "metric": sale.metric,
                "unit_price": sale.unit_price,
                "amount_paid": sale.amount_paid,
                "total_price": sale.total_price,
                "payment_method": sale.payment_method,
                "created_at": sale.created_at.strftime('%Y-%m-%d')  # Convert datetime to String
            }

            return {"sale": sale_data}, 200

        except Exception as e:
            return {"error": str(e)}, 500

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
            return ({"error": str(e)}), 500

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
        

    
#Geting cash at hand, bank and mpesa
class GetPaymentTotals(Resource):
    @jwt_required()
    def get(self):
        try:
            # Get the 'start_date' and 'end_date' query parameters
            start_date_str = request.args.get('start_date')
            end_date_str = request.args.get('end_date')

            # Convert date strings to datetime objects if provided
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d') if start_date_str else None
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d') if end_date_str else None

            # Get the distinct payment methods
            query_methods = db.session.query(Sales.payment_method).distinct()
            payment_methods = [row.payment_method for row in query_methods]

            # Initialize a dictionary to store totals for each payment method
            totals = {}

            for method in payment_methods:
                query = db.session.query(
                    db.func.coalesce(db.func.sum(Sales.amount_paid), 0).label('total')
                ).filter(
                    Sales.status == 'unpaid',
                    Sales.payment_method.ilike(method)
                )

                # Apply date filters if specified, using 'created_at' instead of 'date'
                if start_date:
                    query = query.filter(Sales.created_at >= start_date)
                if end_date:
                    query = query.filter(Sales.created_at <= end_date)

                result = query.scalar()

                totals[method] = f"ksh. {float(result):,.2f}"

            return totals, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return jsonify({"error": "Database error occurred", "details": str(e)}), 500

        except Exception as e:
            return jsonify({"error": "An unexpected error occurred", "details": str(e)}), 500




class SalesBalanceResource(Resource):
    @jwt_required()
    def get(self):
        try:
            # Fetch all sales records
            all_sales = Sales.query.all()

            # Sum up all balances and ensure the result is positive
            total_balance = abs(sum(sale.ballance for sale in all_sales if sale.ballance is not None))

            return {"total_balance": total_balance}, 200

        except Exception as e:
            return {"error": str(e)}, 500
        
class TotalBalanceSummary(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        try:
            # Get start_date and end_date from query parameters
            start_date_str = request.args.get('start_date')
            end_date_str = request.args.get('end_date')

            # Remove any leading or trailing spaces and convert date strings to datetime objects if provided
            start_date = datetime.strptime(start_date_str.strip(), '%Y-%m-%d') if start_date_str else None
            end_date = datetime.strptime(end_date_str.strip(), '%Y-%m-%d') if end_date_str else None

            # Query expenses and filter by date range if specified
            query = Expenses.query
            if start_date:
                query = query.filter(Expenses.created_at >= start_date)
            if end_date:
                query = query.filter(Expenses.created_at <= end_date)

            expenses = query.all()
            total_expense_balance = sum(max(expense.totalPrice - expense.amountPaid, 0) for expense in expenses)

            # Query inventory items and filter by date range if specified
            inventory_query = Inventory.query
            if start_date:
                inventory_query = inventory_query.filter(Inventory.created_at >= start_date)
            if end_date:
                inventory_query = inventory_query.filter(Inventory.created_at <= end_date)

            inventory_items = inventory_query.all()
            total_inventory_balance = sum(max(item.totalCost - item.amountPaid, 0) for item in inventory_items)

            # Aggregate both balances
            total_balance = total_expense_balance + total_inventory_balance

            # Return the total balance as JSON
            return make_response(jsonify({
                "total_balance": total_balance
            }), 200)

        except SQLAlchemyError as e:
            db.session.rollback()
            return make_response(jsonify({"error": "Database error occurred", "details": str(e)}), 500)
        except Exception as e:
            return make_response(jsonify({"error": "An unexpected error occurred", "details": str(e)}), 500)


class TotalBalance(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        try:
            # Get start_date and end_date from query parameters
            start_date_str = request.args.get('start_date')
            end_date_str = request.args.get('end_date')

            # Convert date strings to datetime objects if provided
            if start_date_str:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            else:
                start_date = None

            if end_date_str:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
            else:
                end_date = None

            # Query expenses, possibly filtering by date range using created_at
            query = Expenses.query
            if start_date:
                query = query.filter(Expenses.created_at >= start_date)
            if end_date:
                query = query.filter(Expenses.created_at <= end_date)

            expenses = query.all()

            # Calculate the total balance
            total_balance = sum(max(expense.totalPrice - expense.amountPaid, 0) for expense in expenses)

            # Return the total balance
            return make_response(jsonify({"total_balance": total_balance}), 200)

        except SQLAlchemyError as e:
            db.session.rollback()
            return make_response(jsonify({"error": "Database error occurred", "details": str(e)}), 500)
        except Exception as e:
            return make_response(jsonify({"error": "An unexpected error occurred", "details": str(e)}), 500)