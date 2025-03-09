from app import db
from flask_restful import Resource
from Server.Models.Sales import Sales
from Server.Models.LiveStock import LiveStock
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
from datetime import datetime, timedelta



# def check_role(allowed_roles):
#     def wrapper(fn):
#         @wraps(fn)
#         def decorator(*args, **kwargs):
#             current_user_id = get_jwt_identity()
#             user = Users.query.get(current_user_id)
#             if user and user.role not in allowed_roles:
#                 return make_response(jsonify({"error": "Unauthorized access"}), 403)
#             return fn(*args, **kwargs)
#         return decorator
#     return wrapper


# class TotalBalanceSummary(Resource):
#     @jwt_required()
#     @check_role(['manager', 'clerk'])
#     def get(self):
#         # Your endpoint logic here
#         return jsonify({"message": "Success"})



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

        required_fields = [
            'shop_id', 'customer_name', 'customer_number', 'item_name', 
            'quantity', 'metric', 'unit_price', 'payment_methods', 'status'
        ]
        if not all(field in data for field in required_fields):
            return {'message': 'Missing required fields'}, 400

        shop_id = data.get('shop_id')
        customer_name = data.get('customer_name')
        customer_number = data.get('customer_number')
        item_name = data.get('item_name')

        try:
            quantity = float(data.get('quantity', 0))
            metric = data.get('metric')
            unit_price = float(data.get('unit_price', 0.0))
            payment_methods = data.get('payment_methods')
            status = data.get('status', 'unpaid')
            created_at = data.get('sale_date')

            if not created_at or created_at.strip() == "":
                return {'message': 'Sale date is required'}, 400

            try:
                created_at = datetime.strptime(created_at, "%Y-%m-%d")
            except ValueError:
                return {'message': 'Invalid date format. Use YYYY-MM-DD'}, 400

        except ValueError:
            return {'message': 'Invalid input for quantity or unit price'}, 400

        if status.lower() != "unpaid" and (not isinstance(payment_methods, list) or not all(
            isinstance(pm, dict) and 'method' in pm and 'amount' in pm for pm in payment_methods
        )):
            return {'message': 'Invalid payment methods format'}, 400

        total_price = unit_price * quantity
        total_amount_paid = 0

        if status.lower() != "unpaid":
            try:
                total_amount_paid = sum(float(pm['amount']) for pm in payment_methods)
            except ValueError as e:
                return {'message': f'Invalid amount value in payment methods: {e}'}, 400

        balance = total_price - total_amount_paid

        # ✅ **Check if Sale Date is Today or Yesterday**
        today = datetime.today().date()
        yesterday = today - timedelta(days=1)

        # ✅ **Deduct from LiveStock only if the sale date is today or yesterday**
        live_stock = None
        if created_at.date() in [today, yesterday]:  
            live_stock = (
                LiveStock.query
                .filter_by(shop_id=shop_id, item_name=item_name)
                .order_by(LiveStock.created_at.desc())  # Get latest stock entry
                .first()
            )

            if live_stock:
                if live_stock.current_quantity < quantity:
                    return {'message': 'Insufficient stock quantity in LiveStock table'}, 400

                live_stock.current_quantity -= quantity
                remaining_stock = live_stock.current_quantity
            else:
                remaining_stock = None
        else:
            remaining_stock = None  # Don't track LiveStock updates for old sales

        # ✅ **Deduct from ShopStock using FIFO logic**
        total_available_stock = db.session.query(db.func.sum(ShopStock.quantity)).filter(
            ShopStock.itemname == item_name,
            ShopStock.shop_id == shop_id,
            ShopStock.quantity > 0
        ).scalar() or 0

        if total_available_stock < quantity:
            return {'message': 'Insufficient inventory quantity in batches'}, 400

        remaining_quantity = quantity
        batches = ShopStock.query.filter(
            ShopStock.itemname == item_name,
            ShopStock.shop_id == shop_id,
            ShopStock.quantity > 0
        ).order_by(ShopStock.BatchNumber).all()

        batch_deductions = []  
        stock_ids_used = []  

        for batch in batches:
            if remaining_quantity <= 0:
                break  

            if batch.quantity >= remaining_quantity:
                batch.quantity -= remaining_quantity
                batch_deductions.append((batch.BatchNumber, remaining_quantity))
                stock_ids_used.append(str(batch.stock_id))  
                remaining_quantity = 0
            else:
                batch_deductions.append((batch.BatchNumber, batch.quantity))
                stock_ids_used.append(str(batch.stock_id))  
                remaining_quantity -= batch.quantity
                batch.quantity = 0

        # ✅ **Save sale record**
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
            BatchNumber=", ".join(f"{bn} ({q})" for bn, q in batch_deductions),
            stock_id=", ".join(stock_ids_used),  
            balance=balance,
            status=status,
            created_at=created_at
        )

        try:
            db.session.add(new_sale)
            db.session.flush()  # Flush to get sales_id for later use

            # ✅ Only add payment methods if status is NOT "unpaid"
            if status.lower() != "unpaid":
                for payment in payment_methods:
                    payment_method = payment['method']
                    transaction_code = payment.get('transaction_code')

                    # Ensure the transaction_code is not empty and convert it to uppercase
                    if not transaction_code or transaction_code.strip() == "":
                        transaction_code = "N/A"
                    else:
                        # Convert the transaction code to uppercase
                        transaction_code = transaction_code.upper()

                    payment_record = SalesPaymentMethods(
                        sale_id=new_sale.sales_id,
                        payment_method=payment_method,
                        amount_paid=payment['amount'],
                        transaction_code=transaction_code,
                        created_at=new_sale.created_at
                    )
                    db.session.add(payment_record)


            # ✅ Always add customer details
            new_customer = Customers(
                customer_name=customer_name,
                customer_number=customer_number,
                shop_id=shop_id,
                sales_id=new_sale.sales_id,
                user_id=current_user_id,
                item=item_name,
                amount_paid=total_amount_paid if status.lower() != "unpaid" else 0,  # Set amount_paid to 0 if unpaid
                payment_method=", ".join(pm['method'] for pm in payment_methods) if status.lower() != "unpaid" else "N/A",
                created_at=created_at
            )
            db.session.add(new_customer)

            if live_stock:  # ✅ Only update LiveStock if it exists and sale is from today or yesterday
                db.session.add(live_stock)

            db.session.commit()
            return {
                'message': 'Sale and customer added successfully! Stock updated!',
            }, 201

        except Exception as e:
            db.session.rollback()
            return {'message': 'Error adding sale and updating stock', 'error': str(e)}, 500


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
                    "created_at": sale.created_at,  # Convert datetime to string
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

            # **Payment methods are no longer handled here**

            # Commit changes to the database
            db.session.commit()

            return {"message": "Sale updated successfully"}, 200

        except Exception as e:
            return {"error": str(e)}, 500

    @jwt_required()
    def delete(self, sales_id):
        # Fetch the sale record
        sale = Sales.query.filter_by(sales_id=sales_id).first()
        if not sale:
            return {'message': 'Sale not found'}, 404

        # Fetch the associated shop stock
        shop_stock_item = ShopStock.query.filter_by(stock_id=sale.stock_id).first()
        if shop_stock_item:
            shop_stock_item.quantity += sale.quantity  # Restore the stock

        # Delete associated payment methods
        SalesPaymentMethods.query.filter_by(sale_id=sales_id).delete()

        # Delete associated customer record
        customer = Customers.query.filter_by(sales_id=sales_id).first()
        if customer:
            db.session.delete(customer)

        # Delete the sale record
        db.session.delete(sale)

        try:
            db.session.commit()
            return {'message': 'Sale deleted, stock restored, and customer removed successfully'}, 200
        except Exception as e:
            db.session.rollback()
            return {'message': 'Error deleting sale', 'error': str(e)}, 500


        

    
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
       

class UpdateSalePayment(Resource):
    
    @jwt_required()
    @check_role('manager')

    def put(self, sale_id):
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # Check if sale exists
        sale = Sales.query.filter_by(sales_id=sale_id).first()
        if not sale:
            return make_response(jsonify({"message": "Sale not found"}), 404)

        payment_methods = data.get("payment_methods", [])
        payment_date = data.get("payment_date", datetime.utcnow().strftime("%Y-%m-%d"))  # Allow manual input or default to today

        # Validate payment methods format
        if not isinstance(payment_methods, list) or not all(
            isinstance(pm, dict) and 'method' in pm and 'amount' in pm for pm in payment_methods
        ):
            return make_response(jsonify({"message": "Invalid payment methods format"}), 400)

        try:
            # Convert payment_date string to datetime object
            try:
                payment_date_obj = datetime.strptime(payment_date, "%Y-%m-%d")
            except ValueError:
                return make_response(jsonify({"message": "Invalid date format. Use YYYY-MM-DD"}), 400)

            # ✅ Step 1: Fetch Existing Payments for the Sale
            existing_payments = SalesPaymentMethods.query.filter_by(sale_id=sale_id).all()
            total_paid = sum(payment.amount_paid for payment in existing_payments)  # Get total already paid

            # ✅ Step 2: Process new payment methods
            new_total_paid = total_paid  # Start with previous total

            for payment in payment_methods:
                payment_method = payment["method"]
                amount_paid = float(payment["amount"])
                transaction_code = payment.get("transaction_code", "N/A")  # Default transaction code

                # ✅ If the new payment amount is zero, update an existing payment method
                if amount_paid == 0 and existing_payments:
                    for existing_payment in existing_payments:
                        if existing_payment.payment_method == payment_method:
                            existing_payment.transaction_code = transaction_code  # Update only transaction_code
                            existing_payment.created_at = payment_date_obj  # Update payment date
                            db.session.add(existing_payment)  # Save changes
                            break  # Stop once an update is done
                else:
                    new_total_paid += amount_paid  # Add new payment amount

                    # ✅ Step 3: Insert new payment if it's greater than 0
                    new_payment = SalesPaymentMethods(
                        sale_id=sale_id,
                        payment_method=payment_method,
                        amount_paid=amount_paid,
                        transaction_code=transaction_code,
                        created_at=payment_date_obj  # Use the provided payment date
                    )
                    db.session.add(new_payment)

            # ✅ Step 4: Update Sale Balance
            new_balance = sale.total_price - new_total_paid
            sale.balance = new_balance
            sale.status = "paid" if sale.balance <= 0 else "unpaid"

            db.session.commit()

            return make_response(jsonify({
                "message": "Payment updated successfully",
                "new_balance": sale.balance,
                "status": sale.status,
                "updated_payment_date": payment_date  # ✅ Return updated payment date
            }), 200)

        except Exception as e:
            db.session.rollback()
            return make_response(jsonify({"message": "Error updating payment method", "error": str(e)}), 500)
        

class GetUnpaidSales(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        try:
            # Query for all unpaid and partially paid sales
            unpaid_sales = Sales.query.filter(Sales.status.in_(["unpaid", "partially_paid"])).all()
            
            if not unpaid_sales:
                return {'message': 'No unpaid or partially paid sales found'}, 404
            
            sales_list = []
            for sale in unpaid_sales:
                # Fetch user and shop details
                user = Users.query.filter_by(users_id=sale.user_id).first()
                shop = Shops.query.filter_by(shops_id=sale.shop_id).first()

                # Handle cases where user or shop may not be found
                username = user.username if user else "Unknown User"
                shopname = shop.shopname if shop else "Unknown Shop"
                
                # Fetch payment methods related to the sale
                payments = SalesPaymentMethods.query.filter_by(sale_id=sale.sales_id).all()
                payment_details = [
                    {
                        "method": payment.payment_method,
                        "amount_paid": payment.amount_paid
                    }
                    for payment in payments
                ]
                
                # Append sale data with user and shop info
                sales_list.append({
                    "sales_id": sale.sales_id,
                    "user_id": sale.user_id,
                    "username": username,  # Added username
                    "shop_id": sale.shop_id,
                    "shopname": shopname,  # Added shopname
                    "customer_name": sale.customer_name,
                    "customer_number": sale.customer_number,
                    "item_name": sale.item_name,
                    "quantity": sale.quantity,
                    "metric": sale.metric,
                    "unit_price": sale.unit_price,
                    "total_price": sale.total_price,
                    "balance": sale.balance,
                    "status": sale.status,
                    "created_at": sale.created_at.strftime("%Y-%m-%d"),
                    "payment_methods": payment_details
                })
            
            return {"unpaid_sales": sales_list}, 200
        
        except Exception as e:
            return {"message": f"An error occurred: {str(e)}"}, 500