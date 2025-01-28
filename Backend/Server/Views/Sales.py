from app import db
from flask_restful import Resource
from Server.Models.Sales import Sales
from Server.Models.Paymnetmethods import SalesPaymentMethods
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
            'quantity', 'metric', 'unit_price', 'payment_methods', 
            'BatchNumber', 'stock_id'
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
            payment_methods = data.get('payment_methods')  # List of payment methods
            batch_number = data.get('BatchNumber')
            stock_id = data.get('stock_id')  # Use stock_id from shop stock
            status = data.get('status', 'unpaid')  # Optional field, defaults to 'unpaid'
            created_at = datetime.utcnow()
        except ValueError:
            return jsonify({'message': 'Invalid input for quantity or unit price'}), 400

        # Validate payment methods format
        if not isinstance(payment_methods, list) or not all(
            'method' in pm and 'amount' in pm for pm in payment_methods
        ):
            return jsonify({'message': 'Invalid payment methods format'}), 400

        # Calculate total price based on unit price and quantity
        total_price = unit_price * quantity

        # Calculate total amount paid
        try:
            total_amount_paid = sum(float(pm['amount']) for pm in payment_methods)
        except ValueError as e:
            return {"message": f"Invalid amount value in payment methods: {e}"}, 400


        # Calculate balance
        balance = total_amount_paid - total_price

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
            total_price=total_price,
            BatchNumber=batch_number,
            stock_id=stock_id,
            balance=balance,
            status=status,
            created_at=created_at
        )

        # Check inventory availability
        shop_stock_item = ShopStock.query.filter_by(stock_id=stock_id).first()
        if not shop_stock_item or shop_stock_item.quantity < quantity:
            return {'message': 'Insufficient inventory quantity'}, 400

        # Update the shop stock quantity
        shop_stock_item.quantity -= quantity  # Subtract sold quantity from shop stock

        try:
            # Save the sale to the database
            db.session.add(new_sale)
            db.session.flush()  # Flush to get the sale ID
            
            # Save payment methods to the database
            for payment in payment_methods:
                payment_record = SalesPaymentMethods(
                    sale_id=new_sale.sales_id,
                    payment_method=payment['method'],
                    amount_paid=payment['amount']
                )
                db.session.add(payment_record)
            
            # Create new customer record
            new_customer = Customers(
                customer_name=customer_name,
                customer_number=customer_number,
                shop_id=shop_id,
                sales_id=new_sale.sales_id,  # Link the sale to the customer
                user_id=current_user_id,
                item=item_name,
                amount_paid=total_amount_paid,
                payment_method=", ".join(pm['method'] for pm in payment_methods),  # Concatenate methods for display
                created_at=created_at
            )
            db.session.add(new_customer)

            db.session.commit()
            return {'message': 'Sale and customer added successfully with multiple payment methods'}, 201
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

                # Process multiple payment methods using the `payment` relationship
                payment_data = [
                    {
                        "payment_method": payment.payment_method,
                        "amount_paid": payment.amount_paid,
                        "balance": payment.balance,  # Include balance field
                    }
                    for payment in sale.payment  # Updated to use the correct relationship
                ]

                # Calculate total amount paid
                total_amount_paid = sum(payment["amount_paid"] for payment in payment_data)

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
                    "metric": sale.metric,
                    "unit_price": sale.unit_price,
                    "total_price": sale.total_price,
                    "total_amount_paid": total_amount_paid,  # Include total amount paid
                    "payment_methods": payment_data,  # Include multiple payments
                    "created_at": sale.created_at.strftime('%Y-%m-%d'),  # Convert datetime to string
                    "balance": sale.balance,  # Include balance at the sale level
                    "note": sale.note,  # Include note field
                })

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
                return {"message": "No sales found for this shop"}, 404

            # Format sales data into a list of dictionaries
            sales_data = []
            for sale in sales:
                # Fetch username and shop name using relationships
                username = sale.users.username if sale.users else "Unknown User"
                shopname = sale.shops.shopname if sale.shops else "Unknown Shop"

                # Process multiple payment methods and calculate total amount paid
                payment_data = [
                    {
                        "payment_method": payment.payment_method,
                        "amount_paid": payment.amount_paid,
                        "balance": payment.balance,
                    }
                    for payment in sale.payment  # Using the defined relationship in the Sales model
                ]
                total_amount_paid = sum(payment["amount_paid"] for payment in payment_data)

                # Append the formatted sale data
                sales_data.append({
                    "sale_id": sale.sales_id,
                    "user_id": sale.user_id,
                    "username": username,
                    "shop_id": sale.shop_id,
                    "shop_name": shopname,
                    "customer_name": sale.customer_name,
                    "status": sale.status,
                    "customer_number": sale.customer_number,
                    "item_name": sale.item_name,
                    "quantity": sale.quantity,
                    "batch_number": sale.BatchNumber,
                    "metric": sale.metric,
                    "unit_price": sale.unit_price,
                    "total_price": sale.total_price,
                    "total_amount_paid": total_amount_paid,
                    "payment_methods": payment_data,
                    "created_at": sale.created_at.strftime('%Y-%m-%d %H:%M:%S')  # Convert datetime to string
                })

            return {"sales": sales_data}, 200

        except Exception as e:
            return {"error": f"An error occurred while processing the request: {str(e)}"}, 500


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

            # Fetch related payment methods
            payment_data = [
                {
                    "payment_method": payment.payment_method,
                    "amount_paid": payment.amount_paid,
                    "balance": payment.balance,
                }
                for payment in sale.payment  # 'payment' is the relationship with SalesPaymentMethods
            ]
            
            # Calculate total amount paid from the related payments
            total_amount_paid = sum(payment['amount_paid'] for payment in payment_data)

            # Prepare sale data
            sale_data = {
                "sale_id": sale.sales_id,
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
                "metric": sale.metric,
                "unit_price": sale.unit_price,
                "total_price": sale.total_price,
                "total_amount_paid": total_amount_paid,  # Add total amount paid
                "payment_methods": payment_data,
                "created_at": sale.created_at.strftime('%Y-%m-%d')  # Convert datetime to string
            }

            return {"sale": sale_data}, 200

        except Exception as e:
            return {"error": str(e)}, 500

    @jwt_required()
    def put(self, sales_id):
        try:
            # Fetch the sale by sales_id
            sale = Sales.query.get(sales_id)

            if not sale:
                return {"message": "Sale not found"}, 404

            # Get the updated data from the request
            data = request.get_json()

            # Update sale details
            if 'customer_name' in data:
                sale.customer_name = data['customer_name']
            if 'status' in data:
                sale.status = data['status']
            if 'customer_number' in data:
                sale.customer_number = data['customer_number']
            if 'item_name' in data:
                sale.item_name = data['item_name']
            if 'quantity' in data:
                sale.quantity = data['quantity']
            if 'metric' in data:
                sale.metric = data['metric']
            if 'unit_price' in data:
                sale.unit_price = data['unit_price']
            if 'total_price' in data:
                sale.total_price = data['total_price']
            if 'BatchNumber' in data:
                sale.BatchNumber = data['BatchNumber']

            # Handle payment methods update
            if 'payment_methods' in data:
                # First, delete the old payment methods
                for payment in sale.payment:
                    db.session.delete(payment)

                # Add updated payment methods
                for payment_data in data['payment_methods']:
                    # Create new payment method records and associate them with the sale
                    payment = SalesPaymentMethods(
                        sale_id=sale.sales_id,
                        payment_method=payment_data.get('payment_method'),
                        amount_paid=payment_data.get('amount_paid'),
                        balance=payment_data.get('balance')
                    )
                    db.session.add(payment)

            # Commit changes to the database
            db.session.commit()

            return {"message": "Sale updated successfully"}, 200

        except Exception as e:
            return {"error": str(e)}, 500


    @jwt_required()
    def delete(self, sales_id):
        try:
            # Fetch the sale by sales_id
            sale = Sales.query.get(sales_id)

            if not sale:
                return {"message": "Sale not found"}, 404

            # Delete related payment records
            for payment in sale.payment:
                db.session.delete(payment)
            
            # Delete the sale record
            db.session.delete(sale)

            # Commit changes to the database
            db.session.commit()

            return {"message": "Sale deleted successfully"}, 200

        except Exception as e:
            return {"error": str(e)}, 500

        

    
class GetPaymentTotals(Resource):
    @jwt_required()
    def get(self):
        try:
            # Get query parameters for date range
            start_date_str = request.args.get('start_date')
            end_date_str = request.args.get('end_date')

            # Parse date strings to datetime objects if provided
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d') if start_date_str else None
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d') if end_date_str else None

            # Initialize totals dictionary
            totals = {"cash": 0, "bank": 0, "mpesa": 0, "sasapay": 0}

            # Build the query to calculate payment totals
            query = db.session.query(
                SalesPaymentMethods.payment_method,
                db.func.sum(SalesPaymentMethods.amount_paid).label('total_paid')
            ).join(
                Sales, Sales.sales_id == SalesPaymentMethods.sale_id
            ).filter(
                Sales.status != 'paid'  # Include unpaid and partially paid sales
            )

            # Apply date filters if provided
            if start_date:
                query = query.filter(Sales.created_at >= start_date)
            if end_date:
                query = query.filter(Sales.created_at <= end_date)

            # Group by payment method
            query = query.group_by(SalesPaymentMethods.payment_method)

            # Execute query and process results
            results = query.all()
            for payment_method, total_paid in results:
                if payment_method in totals:
                    totals[payment_method] = round(total_paid, 2)

            # Format the totals with currency
            formatted_totals = {method: f"ksh. {amount:,.2f}" for method, amount in totals.items()}

            return {"totals": formatted_totals}, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "Database error occurred", "details": str(e)}, 500

        except Exception as e:
            return {"error": "An unexpected error occurred", "details": str(e)}, 500



class SalesBalanceResource(Resource):
    @jwt_required()
    def get(self):
        try:
            # Fetch all sales records
            all_sales = Sales.query.all()

            # Sum up all balances, ensuring non-None values, and ensure the result is positive
            total_balance = abs(sum(sale.balance for sale in all_sales if sale.balance is not None))

            return {"total_balance": f"ksh. {total_balance:,.2f}"}, 200

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

            # Parse dates if provided
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

            # Return the total balance as JSON with currency format
            return {"total_balance": f"ksh. {total_balance:,.2f}"}, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "Database error occurred", "details": str(e)}, 500
        except Exception as e:
            return {"error": "An unexpected error occurred", "details": str(e)}, 500


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