from app import db
from flask_restful import Resource
from Server.Models.Sales import Sales
from Server.Models.LiveStock import LiveStock
from Server.Models.SoldItems import SoldItem
from Server.Models.Paymnetmethods import SalesPaymentMethods
from Server.Models.Users import Users
from Server.Models.Shops import Shops
from Server.Models.Expenses import Expenses
from Server.Models.Transactions import TranscationType
from Server.Models.BankAccounts import BankAccount
from Server.Models.Inventory import Inventory
from Server.Models.InventoryV2 import InventoryV2
from Server.Models.ShopstockV2 import ShopStockV2
from Server.Models.Customers import Customers
from Server.Utils import get_sales_filtered, serialize_sales
from flask import jsonify,request,make_response
from Server.Models.Shopstock import ShopStock
from sqlalchemy import func, or_
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError
from flask import jsonify, request
from functools import wraps
from datetime import datetime, timedelta
from Server.Models.Transactions import TranscationType
from Server.Models.BankAccounts import BankAccount
from Server.Models.CashDeposit import CashDeposits

from fuzzywuzzy import process

from flask import send_file
from io import BytesIO
import pandas as pd




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
        new_sale = None

        # ===== VALIDATION =====
        required_fields = [
            'shop_id', 'customer_name', 'customer_number', 
            'items', 'payment_methods', 'status'
        ]
        if not all(field in data for field in required_fields):
            return {'message': 'Missing required fields', 'missing': [f for f in required_fields if f not in data]}, 400

        try:
            # Parse data with strict validation
            shop_id = int(data['shop_id'])
            payment_methods = data['payment_methods']
            promocode = data.get('promocode', '')
            status = data['status'].lower()
            created_at = datetime.strptime(data['sale_date'], "%Y-%m-%d") if 'sale_date' in data else datetime.utcnow()
            
            # Validate items
            if not isinstance(data['items'], list) or len(data['items']) == 0:
                return {'message': 'Items must be a non-empty list'}, 400
            
            items = []
            total_price = 0.0
            total_quantity = 0.0
            purchase_account = 0.0
            
            # First pass validation for items
            for item in data['items']:
                item_fields = ['item_name', 'quantity', 'metric', 'unit_price']
                if not all(field in item for field in item_fields):
                    return {'message': 'Missing required item fields', 'missing': [f for f in item_fields if f not in item]}, 400
                
                # Validate metric format before processing
                metric = item['metric'].strip().lower()
                if metric not in ['item', 'kg', 'ltrs']:
                    return {
                        'message': f'Invalid metric "{metric}" for item "{item["item_name"]}". Must be one of: item, kg, ltrs',
                        'invalid_item': item
                    }, 400
                
                items.append({
                    'item_name': item['item_name'],
                    'quantity': float(item['quantity']),
                    'metric': metric,  # Use the cleaned metric
                    'unit_price': float(item['unit_price']),
                    'total_price': float(item['quantity']) * float(item['unit_price'])
                })
                total_price += float(item['quantity']) * float(item['unit_price'])
                total_quantity += float(item['quantity'])
                
        except (ValueError, KeyError, TypeError) as e:
            return {'message': f'Invalid data format: {str(e)}'}, 400

        # ===== PAYMENT METHOD VALIDATION =====
        if status != "unpaid":
            if not isinstance(payment_methods, list):
                return {'message': 'Payment methods must be a list'}, 400
            
            for pm in payment_methods:
                if 'method' not in pm or 'amount' not in pm:
                    return {'message': 'Each payment method must have "method" and "amount"'}, 400
                try:
                    float(pm['amount'])
                except ValueError:
                    return {'message': f'Invalid amount for payment method {pm["method"]}'}, 400

        # ===== BANK MAPPING =====
        shop_to_bank_mapping = {
            1: 12, 2: 3, 3: 6, 4: 2, 5: 5, 6: 17,
            7: 15, 8: 9, 10: 18, 11: 8, 12: 7,
            14: 14, 16: 13
        }

        # ===== STOCK PROCESSING (UPDATED FOR ShopStockV2) =====
        stock_processing_errors = []
        batch_deductions = []
        stock_ids_used = []
        sold_items = []
        
        try:
            for item in items:
                # Get batches ordered by BatchNumber (oldest first)
                batches = ShopStockV2.query.filter(
                    ShopStockV2.itemname == item['item_name'],
                    ShopStockV2.shop_id == shop_id,
                    ShopStockV2.quantity > 0
                ).order_by(ShopStockV2.BatchNumber).all()

                if not batches:
                    stock_processing_errors.append(f"No stock available for item: {item['item_name']}")
                    continue

                remaining_qty = item['quantity']
                item_batch_deductions = []
                item_stock_ids = []
                item_purchase_account = 0.0

                for batch in batches:
                    if remaining_qty <= 0:
                        break

                    deduct_qty = min(batch.quantity, remaining_qty)
                    batch.quantity -= deduct_qty
                    remaining_qty -= deduct_qty
                    item_batch_deductions.append((batch.BatchNumber, deduct_qty))
                    item_stock_ids.append(str(batch.stockv2_id))

                    # Get unit cost from associated inventory
                    inventory = InventoryV2.query.filter_by(inventoryV2_id=batch.inventoryv2_id).first()
                    if inventory:
                        item_purchase_account += inventory.unitCost * deduct_qty

                    db.session.add(batch)

                if remaining_qty > 0:
                    stock_processing_errors.append(
                        f"Insufficient stock for {item['item_name']}. Needed {item['quantity']}, available {item['quantity'] - remaining_qty}"
                    )
                    continue

                batch_deductions.append({
                    'item_name': item['item_name'],
                    'deductions': item_batch_deductions
                })
                stock_ids_used.extend(item_stock_ids)
                purchase_account += item_purchase_account
                
                sold_items.append({
                    'item_name': item['item_name'],
                    'quantity': item['quantity'],
                    'metric': item['metric'],
                    'unit_price': item['unit_price'],
                    'total_price': item['total_price'],
                    'BatchNumber': ", ".join(f"{bn} ({q})" for bn, q in item_batch_deductions),
                    'stockv2_id': item_stock_ids[0],  # Take first stock_id as reference
                    'Cost_of_sale': item['total_price'],
                    'Purchase_account': item_purchase_account
                })

            if stock_processing_errors:
                db.session.rollback()
                return {'message': 'Stock processing failed', 'errors': stock_processing_errors}, 400

        except Exception as e:
            db.session.rollback()
            return {'message': 'Stock processing failed', 'error': str(e)}, 500

        # ===== PAYMENT PROCESSING =====
        total_amount_paid = sum(float(pm['amount']) for pm in payment_methods) if status != "unpaid" else 0
        balance = total_price - total_amount_paid
        sasapay_deposits = []

        try:
            # Create sale record (simplified to match your Sales model)
            new_sale = Sales(
                user_id=current_user_id,
                shop_id=shop_id,
                customer_name=data['customer_name'],
                customer_number=data['customer_number'],
                status=status,
                created_at=created_at,
                balance=balance,
                promocode=promocode
            )
            db.session.add(new_sale)
            db.session.flush()  # Generate sales_id without committing

            # Create sold item records
            for item in sold_items:
                sold_item = SoldItem(
                    sales_id=new_sale.sales_id,
                    item_name=item['item_name'],
                    quantity=item['quantity'],
                    metric=item['metric'],
                    unit_price=item['unit_price'],
                    total_price=item['total_price'],
                    BatchNumber=item['BatchNumber'],
                    stockv2_id=item['stockv2_id'],
                    Cost_of_sale=item['Cost_of_sale'],
                    Purchase_account=item['Purchase_account']
                )
                db.session.add(sold_item)

            # Process payments
            for payment in payment_methods:
                method = payment['method'].strip().lower()
                amount = float(payment['amount'])
                transaction_code = payment.get('transaction_code', 'N/A').strip().upper()

                if method == 'sasapay':
                    bank_id = shop_to_bank_mapping.get(shop_id)
                    if bank_id:
                        bank_account = BankAccount.query.get(bank_id)
                        if bank_account:
                            previous_balance = bank_account.Account_Balance
                            bank_account.Account_Balance += amount
                            db.session.add(bank_account)

                            transaction = TranscationType(
                                Transaction_type="Debit",
                                Transaction_amount=amount,
                                From_account=f"SASAPAY Sale #{new_sale.sales_id}",
                                To_account=bank_account.Account_name,
                                created_at=created_at
                            )
                            db.session.add(transaction)

                            sasapay_deposits.append({
                                'shop_id': shop_id,
                                'bank_id': bank_id,
                                'bank_account': bank_account.Account_name,
                                'amount': amount,
                                'previous_balance': previous_balance,
                                'new_balance': bank_account.Account_Balance
                            })

                # Record payment method
                payment_record = SalesPaymentMethods(
                    sale_id=new_sale.sales_id,
                    payment_method=method,
                    amount_paid=amount,
                    transaction_code=transaction_code,
                    created_at=created_at
                )
                db.session.add(payment_record)

            # Create customer record if needed
            if data['customer_name'] or data['customer_number']:
                customer = Customers(
                    customer_name=data['customer_name'],
                    customer_number=data['customer_number'],
                    shop_id=shop_id,
                    sales_id=new_sale.sales_id,
                    user_id=current_user_id,
                    item=", ".join([item['item_name'] for item in items]),
                    amount_paid=total_amount_paid,
                    payment_method=", ".join(pm['method'] for pm in payment_methods),
                    created_at=created_at
                )
                db.session.add(customer)

            db.session.commit()

            return {
                'message': 'Sale processed successfully',
                'sale_id': new_sale.sales_id,
                'financial': {
                    'total': total_price,
                    'paid': total_amount_paid,
                    'balance': balance,
                    'purchase_cost': purchase_account
                },
                'items': {
                    'count': len(items),
                    'details': sold_items
                },
                'payments': {
                    'methods': [pm['method'] for pm in payment_methods],
                    'sasapay_deposits': sasapay_deposits if sasapay_deposits else "No SASAPAY deposits processed"
                }
            }, 201

        except Exception as e:
            db.session.rollback()
            return {
                'message': 'Transaction failed',
                'error': str(e),
                'debug_info': {
                    'sale_id': new_sale.sales_id if new_sale else "Not created",
                    'processed_payments': [pm['method'] for pm in payment_methods],
                    'sasapay_attempts': sasapay_deposits
                }
            }, 500

class GetSale(Resource):
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

                # Get all sold items for this sale
                sold_items = []
                for item in sale.items:
                    sold_items.append({
                        "item_name": item.item_name,
                        "quantity": item.quantity,
                        "metric": item.metric,
                        "unit_price": item.unit_price,
                        "total_price": item.total_price,
                        "batch_number": item.BatchNumber,
                        "stock_id": item.stock_id,
                        "cost_of_sale": item.Cost_of_sale,
                        "purchase_account": item.Purchase_account
                    })

                # Process multiple payment methods using the `payment` relationship
                payment_data = [
                    {
                        "payment_method": payment.payment_method,
                        "amount_paid": payment.amount_paid,
                        "created_at": payment.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                        "balance": payment.balance,
                    }
                    for payment in sale.payment
                ]

                # Calculate total amount paid
                total_amount_paid = sum(payment["amount_paid"] for payment in payment_data)

                sales_data.append({
                    "sale_id": sale.sales_id,
                    "user_id": sale.user_id,
                    "username": username,
                    "shop_id": sale.shop_id,
                    "shopname": shopname,
                    "customer_name": sale.customer_name,
                    "status": sale.status,
                    "customer_number": sale.customer_number,
                    "sold_items": sold_items,  # Now includes all items from SoldItem table
                    "total_amount_paid": total_amount_paid,
                    "payment_methods": payment_data,
                    "created_at": sale.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    "balance": sale.balance,
                    "note": sale.note,
                    "promocode": sale.promocode
                })

            return make_response(jsonify(sales_data), 200)

        except Exception as e:
            return {"error": str(e)}, 500


class GetSales(Resource):
    @jwt_required()
    def get(self):
        try:
            # Pagination
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 50))

            # Filters
            search_query = request.args.get('searchQuery', '')
            selected_date = request.args.get('selectedDate')
            status_filter = request.args.get('status')
            shop_filter = request.args.get('shop_id')
            sort_by = request.args.get('sort_by', 'created_at')
            sort_order = request.args.get('sort_order', 'desc')

            # Valid sort fields
            valid_sort_fields = ['created_at', 'username', 'shopname', 'total_amount_paid']
            if sort_by not in valid_sort_fields:
                sort_by = 'created_at'
            if sort_order not in ['asc', 'desc']:
                sort_order = 'desc'

            # Base query
            sales_query = Sales.query.join(Users).join(Shops)

            # Apply filters
            if search_query:
                sales_query = sales_query.filter(
                    or_(
                        Sales.customer_name.ilike(f"%{search_query}%"),
                        Users.username.ilike(f"%{search_query}%"),
                        Shops.shopname.ilike(f"%{search_query}%")
                    )
                )

            if selected_date:
                try:
                    selected_date_obj = datetime.strptime(selected_date, '%Y-%m-%d').date()
                    sales_query = sales_query.filter(func.date(Sales.created_at) == selected_date_obj)
                except ValueError:
                    return {"error": "Invalid date format. Use YYYY-MM-DD."}, 400

            if status_filter:
                sales_query = sales_query.filter(Sales.status == status_filter)

            if shop_filter:
                sales_query = sales_query.filter(Sales.shop_id == int(shop_filter))

            # Handle sorting
            if sort_by == 'username':
                order_field = Users.username
            elif sort_by == 'shopname':
                order_field = Shops.shopname
            elif sort_by == 'total_amount_paid':
                payment_subquery = (
                    db.session.query(
                        SalesPaymentMethods.sale_id,
                        func.sum(SalesPaymentMethods.amount_paid).label('total_paid')
                    )
                    .group_by(SalesPaymentMethods.sale_id)
                    .subquery()
                )

                sales_query = sales_query.outerjoin(
                    payment_subquery,
                    payment_subquery.c.sale_id == Sales.sales_id
                )
                order_field = payment_subquery.c.total_paid
            else:
                order_field = Sales.created_at

            # Sort direction
            if sort_order == 'desc':
                sales_query = sales_query.order_by(order_field.desc())
            else:
                sales_query = sales_query.order_by(order_field.asc())

            # Decide pagination
            use_pagination = not (
                search_query or
                selected_date or
                status_filter or
                shop_filter or
                sort_by != 'created_at' or
                sort_order != 'desc'
            )

            if use_pagination:
                offset = (page - 1) * limit
                sales_list = sales_query.offset(offset).limit(limit).all()
                total_sales = sales_query.count()
                total_pages = (total_sales + limit - 1) // limit
            else:
                sales_list = sales_query.all()
                total_sales = len(sales_list)
                total_pages = 1

            # Construct response data
            sales_data = []
            for sale in sales_list:
                sold_items = [
                    {
                        "item_name": item.item_name,
                        "quantity": item.quantity,
                        "metric": item.metric,
                        "unit_price": item.unit_price,
                        "total_price": item.total_price,
                        "batch_number": item.BatchNumber
                    }
                    for item in sale.items
                ]

                payments = [
                    {
                        "payment_method": p.payment_method,
                        "amount_paid": p.amount_paid,
                        "created_at": p.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                        "balance": p.balance
                    }
                    for p in sale.payment
                ]

                total_amount_paid = sum(p["amount_paid"] for p in payments)

                sales_data.append({
                    "sale_id": sale.sales_id,
                    "user_id": sale.user_id,
                    "username": sale.users.username if sale.users else "Unknown User",
                    "shop_id": sale.shop_id,
                    "shopname": sale.shops.shopname if sale.shops else "Unknown Shop",
                    "customer_name": sale.customer_name,
                    "status": sale.status,
                    "customer_number": sale.customer_number,
                    "sold_items": sold_items,
                    "total_amount_paid": total_amount_paid,
                    "payment_methods": payments,
                    "created_at": sale.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    "balance": sale.balance,
                    "note": sale.note,
                    "promocode": sale.promocode
                })

            return {
                "sales_data": sales_data,
                "total_sales": total_sales,
                "total_pages": total_pages,
                "current_page": page
            }, 200

        except SQLAlchemyError as e:
            current_app.logger.error(f"Database error: {str(e)}")
            return {"error": "Database operation failed."}, 500
        except ValueError as e:
            current_app.logger.error(f"Value error: {str(e)}")
            return {"error": str(e)}, 400
        except Exception as e:
            current_app.logger.error(f"Unexpected error: {str(e)}")
            return {"error": "An unexpected error occurred."}, 500




class GetSalesByShop(Resource):
    @jwt_required()
    def get(self, shop_id):
        try:
            # Get query parameters
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 50))
            search_query = request.args.get('search', '').lower()
            date_filter = request.args.get('date', '')

            offset = (page - 1) * limit

            # Base query
            sales_query = Sales.query.filter_by(shop_id=shop_id)

            # Apply search filter if provided
            if search_query:
                sales_query = sales_query.join(SoldItem).filter(
                    or_(
                        Sales.customer_name.ilike(f'%{search_query}%'),
                        SoldItem.item_name.ilike(f'%{search_query}%')
                    )
                )

            # Apply date filter if provided
            if date_filter:
                try:
                    filter_date = datetime.strptime(date_filter, '%Y-%m-%d').date()
                    sales_query = sales_query.filter(
                        db.func.date(Sales.created_at) == filter_date
                    )
                except ValueError:
                    pass

            # Get total count before pagination
            total_sales = sales_query.count()

            # Apply pagination and ordering
            sales = sales_query.order_by(Sales.created_at.desc()) \
                              .offset(offset).limit(limit).all()

            if not sales:
                return {"message": "No sales found for this shop"}, 404

            sales_data = []
            for sale in sales:
                username = sale.users.username if sale.users else "Unknown User"
                shopname = sale.shops.shopname if sale.shops else "Unknown Shop"

                payment_data = [
                    {
                        "payment_method": payment.payment_method,
                        "amount_paid": payment.amount_paid,
                        "balance": payment.balance,
                    }
                    for payment in sale.payment
                ]
                total_amount_paid = sum(payment["amount_paid"] for payment in payment_data)

                sold_items = [
                    {
                        "item_id": item.id,
                        "item_name": item.item_name,
                        "quantity": item.quantity,
                        "metric": item.metric,
                        "unit_price": item.unit_price,
                        "total_price": item.total_price,
                        "batch_number": item.BatchNumber,
                        "stock_id": item.stock_id,
                        "cost_of_sale": item.Cost_of_sale,
                        "purchase_account": item.Purchase_account
                    }
                    for item in sale.items
                ]

                total_items_price = sum(item["total_price"] for item in sold_items)

                sales_data.append({
                    "sale_id": sale.sales_id,
                    "user_id": sale.user_id,
                    "username": username,
                    "shop_id": sale.shop_id,
                    "shop_name": shopname,
                    "customer_name": sale.customer_name,
                    "status": sale.status,
                    "customer_number": sale.customer_number,
                    "items": sold_items,
                    "total_items_price": total_items_price,
                    "total_amount_paid": total_amount_paid,
                    "balance": sale.balance,
                    "payment_methods": payment_data,
                    "created_at": sale.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    "note": sale.note,
                    "promocode": sale.promocode
                })

            total_pages = (total_sales + limit - 1) // limit

            return {
                "shop_id": shop_id,
                "shop_name": shopname,
                "total_sales": total_sales,
                "sales": sales_data,
                "current_page": page,
                "total_pages": total_pages,
            }, 200

        except Exception as e:
            return {"error": f"An error occurred: {str(e)}"}, 500



class SalesResources(Resource):
    @jwt_required()
    def get(self, sales_id):
        try:
            sale = Sales.query.get(sales_id)
            if not sale:
                return {"message": "Sale not found"}, 404

            user = Users.query.filter_by(users_id=sale.user_id).first()
            shop = Shops.query.filter_by(shops_id=sale.shop_id).first()

            username = user.username if user else "Unknown User"
            shopname = shop.shopname if shop else "Unknown Shop"

            # Get all sold items for this sale
            sold_items = [
                {
                    "item_name": item.item_name,
                    "quantity": item.quantity,
                    "metric": item.metric,
                    "unit_price": item.unit_price,
                    "total_price": item.total_price,
                    "batch_number": item.BatchNumber,  # Ensure case matches DB model
                    "stock_id": item.stock_id
                }
                for item in sale.items  # Assuming relationship: sale.items
            ]

            # Get payment data
            payment_data = [
                {
                    "payment_method": payment.payment_method,
                    "amount_paid": payment.amount_paid,
                    "created_at": payment.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    "balance": payment.balance,
                }
                for payment in sale.payment
            ]
            total_amount_paid = sum(p["amount_paid"] for p in payment_data)

            sale_data = {
                "sale_id": sale.sales_id,
                "user_id": sale.user_id,
                "username": username,
                "shop_id": sale.shop_id,
                "shopname": shopname,
                "customer_name": sale.customer_name,
                "status": sale.status,
                "customer_number": sale.customer_number,
                "sold_items": sold_items,
                "total_amount_paid": total_amount_paid,
                "payment_methods": payment_data,
                "created_at": sale.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                "balance": sale.balance,
                "note": sale.note,
                "promocode": sale.promocode
            }

            return {"sale": sale_data}, 200

        except Exception as e:
            return {"error": str(e)}, 500

    @jwt_required()
    def put(self, sales_id):
        try:
            sale = Sales.query.get(sales_id)
            if not sale:
                return {"message": "Sale not found"}, 404

            data = request.get_json()

            # Update fields if they exist in the request data
            if 'customer_name' in data:
                sale.customer_name = data['customer_name']
            if 'status' in data:
                sale.status = data['status']
            if 'customer_number' in data:
                sale.customer_number = data['customer_number']
            if 'note' in data:
                sale.note = data['note']
            if 'promocode' in data:
                sale.promocode = data['promocode']

            # If you need to update sold items, handle separately or through another route

            db.session.commit()
            return {"message": "Sale updated successfully"}, 200

        except Exception as e:
            return {"error": str(e)}, 500

    @jwt_required()
    def delete(self, sales_id):
        try:
            sale = Sales.query.filter_by(sales_id=sales_id).first()
            if not sale:
                return {'message': 'Sale not found'}, 404

            # Restore stock quantities for each sold item
            for item in sale.items:  # Ensure `sale.items` is the correct relationship
                if item.stock_id:
                    stock = ShopStock.query.filter_by(stock_id=item.stock_id).first()
                    if stock:
                        stock.quantity += item.quantity

            # Delete payment records
            SalesPaymentMethods.query.filter_by(sale_id=sales_id).delete()

            # Delete customer
            customer = Customers.query.filter_by(sales_id=sales_id).first()
            if customer:
                db.session.delete(customer)

            # Delete sold items (assuming cascade is not set)
            for item in sale.items:
                db.session.delete(item)

            # Delete the sale
            db.session.delete(sale)

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
            # Get page and limit from query parameters, defaulting to 1 and 50
            page = int(request.args.get('page', 1))  # Default to page 1 if not provided
            limit = int(request.args.get('limit', 50))  # Default to 50 items per request

            search_query = request.args.get('searchQuery', '')
            selected_date = request.args.get('selectedDate', None)

            # Start building the query for unpaid and partially paid sales
            sales_query = Sales.query.filter(Sales.status.in_(["unpaid", "partially_paid"]))

            # If a search query is provided, add it to the query
            if search_query:
                sales_query = sales_query.join(Shops).join(Users).filter(
                    Sales.customer_name.ilike(f"%{search_query}%") |
                    Users.username.ilike(f"%{search_query}%") |
                    Shops.shopname.ilike(f"%{search_query}%")
                )
            
            # If a selected date is provided, add date filter
            if selected_date:
                try:
                    selected_date = datetime.strptime(selected_date, '%Y-%m-%d').date()
                    sales_query = sales_query.filter(db.func.date(Sales.created_at) == selected_date)
                except ValueError:
                    return {"error": "Invalid date format. Use YYYY-MM-DD."}, 400

            # Apply sorting by created_at and then pagination
            sales_query = sales_query.order_by(Sales.created_at.desc())

            # Handle pagination
            offset = (page - 1) * limit
            sales_query = sales_query.offset(offset).limit(limit)

            # Fetch sales data
            sales = sales_query.all()
            total_sales = Sales.query.filter(Sales.status.in_(["unpaid", "partially_paid"])).count()  # Total count for pagination
            total_pages = (total_sales + limit - 1) // limit  # Calculate total pages

            # Prepare the sales data to return
            sales_data = []
            for sale in sales:
                user = Users.query.filter_by(users_id=sale.user_id).first()
                shop = Shops.query.filter_by(shops_id=sale.shop_id).first()
                username = user.username if user else "Unknown User"
                shopname = shop.shopname if shop else "Unknown Shop"
                
                # Get all sold items for this sale
                sold_items = []
                for item in sale.items:
                    sold_items.append({
                        "item_name": item.item_name,
                        "quantity": item.quantity,
                        "metric": item.metric,
                        "unit_price": item.unit_price,
                        "total_price": item.total_price,
                        "batch_number": item.BatchNumber
                    })
                
                # Get payment data
                payment_data = [
                    {
                        "payment_method": payment.payment_method,
                        "amount_paid": payment.amount_paid,
                        "created_at": payment.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                        "balance": payment.balance,
                    }
                    for payment in sale.payment
                ]
                total_amount_paid = sum(payment["amount_paid"] for payment in payment_data)

                sales_data.append({
                    "sale_id": sale.sales_id,
                    "user_id": sale.user_id,
                    "username": username,
                    "shop_id": sale.shop_id,
                    "shopname": shopname,
                    "customer_name": sale.customer_name,
                    "status": sale.status,
                    "customer_number": sale.customer_number,
                    "sold_items": sold_items,
                    "total_amount_paid": total_amount_paid,
                    "payment_methods": payment_data,
                    "created_at": sale.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    "balance": sale.balance,
                    "note": sale.note,
                    "promocode": sale.promocode
                })

            return {
                "sales_data": sales_data,
                "total_sales": total_sales,
                "total_pages": total_pages,
                "current_page": page,
            }, 200

        except Exception as e:
            return {"error": str(e)}, 500


        

class PaymentMethodsResource(Resource):
    @jwt_required()
    def get(self, sale_id):
        try:
            # Fetch all payment methods for this sale
            payment_methods = SalesPaymentMethods.query.filter_by(sale_id=sale_id).all()

            # If no payment methods found
            if not payment_methods:
                return {"message": "No payment methods found for this sale"}, 404

            # Format the payment data
            payment_data = [
                {
                    "payment_method": payment.payment_method,
                    "amount_paid": payment.amount_paid,
                    "balance": payment.balance,
                    "transaction_code": payment.transaction_code,
                    "created_at": payment.created_at.strftime('%Y-%m-%d %H:%M:%S') 
                    if isinstance(payment.created_at, datetime) else payment.created_at
                }
                for payment in payment_methods
            ]

            return make_response(jsonify(payment_data), 200)

        except Exception as e:
            return {"error": str(e)}, 500
        


class CapturePaymentResource(Resource):
    @jwt_required()
    def post(self, sale_id):
        try:
            data = request.get_json()
            payment_method = data.get("payment_method")
            amount_paid = data.get("amount_paid")
            transaction_code = data.get("transaction_code", "NONE")  # Default to "NONE"

            # Validate required fields
            if not payment_method or amount_paid is None:
                return {"message": "Payment method and amount_paid are required"}, 400

            # Check if the sale exists and get total price from sold items
            sale = Sales.query.filter_by(sales_id=sale_id).first()
            if not sale:
                return {"message": "Sale not found"}, 404

            # Calculate total price from sold items
            sold_items = SoldItem.query.filter_by(sales_id=sale_id).all()
            total_price = sum(item.total_price for item in sold_items)

            # Find and remove the "not payed" record if it exists
            unpaid_payment = SalesPaymentMethods.query.filter_by(sale_id=sale_id, payment_method="not payed").first()
            if unpaid_payment:
                db.session.delete(unpaid_payment)

            # Check if a payment record already exists for this sale & method
            existing_payment = SalesPaymentMethods.query.filter_by(
                sale_id=sale_id, 
                payment_method=payment_method
            ).first()

            if existing_payment:
                # Update the existing payment method
                existing_payment.amount_paid += amount_paid
                existing_payment.transaction_code = transaction_code
            else:
                # Create a new payment record
                new_payment = SalesPaymentMethods(
                    sale_id=sale_id,
                    payment_method=payment_method,
                    amount_paid=amount_paid,
                    balance=None,  # Balance is managed at the sale level
                    transaction_code=transaction_code,
                    created_at=datetime.utcnow(),
                )
                db.session.add(new_payment)

            # Recalculate total amount paid for the sale
            total_paid = db.session.query(
                db.func.sum(SalesPaymentMethods.amount_paid)
            ).filter_by(sale_id=sale_id).scalar() or 0
            
            # Update sale balance
            sale.balance = max(0, total_price - total_paid)  # Ensure balance is non-negative

            # Update sale status
            if sale.balance == 0:
                sale.status = "paid"
            elif total_paid > 0 and sale.balance > 0:
                sale.status = "partially_paid"

            # Commit changes
            db.session.commit()

            # Get updated payment records
            updated_payments = SalesPaymentMethods.query.filter_by(sale_id=sale_id).all()
            payment_data = [
                {
                    "payment_method": pm.payment_method,
                    "amount_paid": pm.amount_paid,
                    "balance": pm.balance,
                    "transaction_code": pm.transaction_code,
                    "created_at": pm.created_at.strftime('%Y-%m-%d %H:%M:%S') 
                    if isinstance(pm.created_at, datetime) else pm.created_at
                }
                for pm in updated_payments
            ]

            # Prepare sold items data for response
            items_data = [
                {
                    "item_name": item.item_name,
                    "quantity": item.quantity,
                    "metric": item.metric,
                    "unit_price": item.unit_price,
                    "total_price": item.total_price,
                    "batch_number": item.BatchNumber
                }
                for item in sold_items
            ]

            return make_response(jsonify({
                "message": "Payment recorded successfully",
                "sale_id": sale_id,
                "customer_name": sale.customer_name,
                "customer_number": sale.customer_number,
                "sale_status": sale.status,
                "total_price": total_price,
                "remaining_balance": sale.balance,
                "payment_methods": payment_data,
                "items": items_data,
                "created_at": sale.created_at.strftime('%Y-%m-%d %H:%M:%S') 
                if isinstance(sale.created_at, datetime) else sale.created_at,
                "note": sale.note,
                "promocode": sale.promocode
            }), 200)

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500


class CreditHistoryResource(Resource):
    @jwt_required()
    def get(self):
        try:
            # Query sales with payments where the timestamps do not match and status is "paid"
            sales_with_payments = db.session.query(Sales).join(SalesPaymentMethods).filter(Sales.status == "paid").all()

            credit_sales = []
            for sale in sales_with_payments:
                # Handle invalid timestamps
                if sale.created_at in ["0000-00-00 00:00:00", None]:
                    continue  # Skip invalid sale records

                # Convert sale.created_at to datetime
                sale_created_at = sale.created_at
                if isinstance(sale_created_at, str):
                    sale_created_at = datetime.strptime(sale_created_at, '%Y-%m-%d %H:%M:%S')

                # Get all payments linked to the sale
                payments = SalesPaymentMethods.query.filter_by(sale_id=sale.sales_id).all()

                # Check if any payment timestamp is different from the sale timestamp
                mismatched_payments = []
                for payment in payments:
                    if payment.created_at in ["0000-00-00 00:00:00", None]:
                        continue  # Skip invalid payment records

                    # Convert payment.created_at to datetime
                    payment_created_at = payment.created_at
                    if isinstance(payment_created_at, str):
                        payment_created_at = datetime.strptime(payment_created_at, '%Y-%m-%d %H:%M:%S')

                    if payment_created_at.date() != sale_created_at.date():
                        mismatched_payments.append({
                            "payment_method": payment.payment_method,
                            "amount_paid": payment.amount_paid,
                            "payment_created_at": payment_created_at.strftime('%Y-%m-%d %H:%M:%S'),
                            "sale_created_at": sale_created_at.strftime('%Y-%m-%d %H:%M:%S'),
                        })

                if mismatched_payments:
                    credit_sales.append({
                        "sale_id": sale.sales_id,
                        "customer_name": sale.customer_name,
                        "shop_id": sale.shop_id,
                        "total_price": sale.total_price,
                        "balance": sale.balance,
                        "status": sale.status,
                        "sale_created_at": sale_created_at.strftime('%Y-%m-%d %H:%M:%S'),
                        "mismatched_payments": mismatched_payments,
                    })

            if not credit_sales:
                return {"message": "No credit sales found"}, 404

            return make_response(jsonify(credit_sales), 200)

        except Exception as e:
            return {"error": str(e)}, 500



class GetSingleSaleByShop(Resource):
    @jwt_required()
    def get(self, shop_id, sales_id):
        try:
            # Query the Sales table for the specific sale related to the given shop_id and sales_id
            sale = Sales.query.filter_by(shop_id=shop_id, sales_id=sales_id).first()

            # If no sale is found
            if not sale:
                return {"message": "Sale not found for this shop"}, 404

            # Fetch username and shop name using relationships
            username = sale.users.username if sale.users else "Unknown User"
            shopname = sale.shops.shopname if sale.shops else "Unknown Shop"

            # Debug: Print data types of created_at fields
            print(f"Sale created_at type: {type(sale.created_at)}, value: {sale.created_at}")
            
            # Ensure sale.created_at is a datetime object before calling strftime
            sale_created_at = sale.created_at
            if isinstance(sale_created_at, str):
                sale_created_at = datetime.strptime(sale_created_at, '%Y-%m-%d %H:%M:%S')

            # Process multiple payment methods and calculate total amount paid
            payment_data = []
            total_amount_paid = 0

            for payment in sale.payment:
                print(f"Payment created_at type: {type(payment.created_at)}, value: {payment.created_at}")
                
                # Ensure payment.created_at is a datetime object before calling strftime
                payment_created_at = payment.created_at
                if isinstance(payment_created_at, str):
                    payment_created_at = datetime.strptime(payment_created_at, '%Y-%m-%d %H:%M:%S')

                payment_data.append({
                    "payment_method": payment.payment_method,
                    "amount_paid": payment.amount_paid,
                    "balance": payment.balance,
                    "created_at": payment_created_at.strftime('%Y-%m-%d %H:%M:%S') 
                })
                total_amount_paid += payment.amount_paid

            # Process sold items
            sold_items = []
            total_sale_amount = 0
            for item in sale.items:
                sold_items.append({
                    "item_id": item.id,
                    "item_name": item.item_name,
                    "quantity": item.quantity,
                    "metric": item.metric,
                    "unit_price": item.unit_price,
                    "total_price": item.total_price,
                    "batch_number": item.BatchNumber,
                    "stock_id": item.stock_id,
                    "cost_of_sale": item.Cost_of_sale,
                    "purchase_account": item.Purchase_account
                })
                total_sale_amount += item.total_price

            # Format the sale data
            sale_data = {
                "sale_id": sale.sales_id,
                "user_id": sale.user_id,
                "username": username,
                "shop_id": sale.shop_id,
                "shop_name": shopname,
                "customer_name": sale.customer_name,
                "status": sale.status,
                "customer_number": sale.customer_number,
                "created_at": sale_created_at.strftime('%Y-%m-%d %H:%M:%S'),
                "balance": sale.balance,
                "note": sale.note,
                "promocode": sale.promocode,
                "total_sale_amount": total_sale_amount,
                "total_amount_paid": total_amount_paid,
                "payment_methods": payment_data,
                "sold_items": sold_items
            }

            return {"sale": sale_data}, 200

        except Exception as e:
            return {"error": f"An error occurred while processing the request: {str(e)}"}, 500



#Get unpaid sales by shop
class GetUnpaidSalesByClerk(Resource):
    @jwt_required()
    @check_role('clerk')
    def get(self):
        try:
            # Get the logged-in clerk's user ID
            current_user_id = get_jwt_identity()

            # Fetch only unpaid sales recorded by this specific clerk
            unpaid_sales = Sales.query.filter(
                Sales.user_id == current_user_id,
                Sales.status.in_(["unpaid", "partially_paid"])
            ).order_by(Sales.created_at.desc()).all()

            if not unpaid_sales:
                return {'message': 'No unpaid or partially paid sales found for you'}, 404

            sales_list = []
            for sale in unpaid_sales:
                # Fetch user details
                user = Users.query.filter_by(users_id=sale.user_id).first()
                username = user.username if user else "Unknown User"

                # Fetch shop details
                shop = Shops.query.filter_by(shops_id=sale.shop_id).first()
                shopname = shop.shopname if shop else "Unknown Shop"

                # Calculate total amount paid from payment methods
                total_paid = sum(payment.amount_paid for payment in sale.payment)

                # Get all sold items for this sale
                sold_items = [
                    {
                        "item_id": item.id,
                        "item_name": item.item_name,
                        "quantity": item.quantity,
                        "metric": item.metric,
                        "unit_price": item.unit_price,
                        "total_price": item.total_price,
                        "batch_number": item.BatchNumber,
                        "stock_id": item.stock_id,
                        "cost_of_sale": item.Cost_of_sale,
                        "purchase_account": item.Purchase_account
                    }
                    for item in sale.items
                ]

                # Calculate total items price
                total_items_price = sum(item["total_price"] for item in sold_items)

                sales_list.append({
                    "sales_id": sale.sales_id,
                    "user_id": sale.user_id,
                    "username": username,
                    "shop_id": sale.shop_id,
                    "shopname": shopname,
                    "customer_name": sale.customer_name,
                    "customer_number": sale.customer_number,
                    "items": sold_items,
                    "total_items_price": total_items_price,
                    "total_paid": total_paid,
                    "balance": sale.balance,
                    "status": sale.status,
                    "created_at": sale.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    "payment_methods": [
                        {
                            "method": payment.payment_method,
                            "amount_paid": payment.amount_paid,
                            "balance": payment.balance
                        }
                        for payment in sale.payment
                    ],
                    "note": sale.note,
                    "promocode": sale.promocode
                })
            
            return {
                "count": len(sales_list),
                "total_balance": sum(sale["balance"] for sale in sales_list),
                "unpaid_sales": sales_list
            }, 200
        
        except Exception as e:
            return {"message": f"An error occurred: {str(e)}"}, 500


class SalesByEmployeeResource(Resource):
    @jwt_required()
    def get(self, username, shop_id):
        try:
            # Get pagination parameters
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 50))
            offset = (page - 1) * limit

            # Use only the first name segment of the username
            first_name = username.split()[0]

            # Base query for filtering sales by username and shop_id
            base_query = Sales.query.join(Users, Users.users_id == Sales.user_id) \
                                    .filter(Users.username.like(f"{first_name}%"), Sales.shop_id == shop_id) \
                                    .order_by(Sales.created_at.desc())

            total_sales = base_query.count()  # Total records
            total_pages = (total_sales + limit - 1) // limit

            # Apply pagination
            sales = base_query.offset(offset).limit(limit).all()

            if not sales:
                return {"message": "No sales found for this employee in the specified shop."}, 404

            sales_data = []
            for sale in sales:
                user = Users.query.filter_by(users_id=sale.user_id).first()
                shop = Shops.query.filter_by(shops_id=sale.shop_id).first()

                username = user.username if user else "Unknown User"
                shopname = shop.shopname if shop else "Unknown Shop"

                payment_data = [
                    {
                        "payment_method": payment.payment_method,
                        "amount_paid": payment.amount_paid,
                        "balance": payment.balance,
                    }
                    for payment in sale.payment
                ]
                total_amount_paid = sum(payment['amount_paid'] for payment in payment_data)

                sold_items = [
                    {
                        "item_id": item.id,
                        "item_name": item.item_name,
                        "quantity": item.quantity,
                        "metric": item.metric,
                        "unit_price": item.unit_price,
                        "total_price": item.total_price,
                        "batch_number": item.BatchNumber,
                        "stock_id": item.stock_id,
                        "cost_of_sale": item.Cost_of_sale,
                        "purchase_account": item.Purchase_account
                    }
                    for item in sale.items
                ]

                total_items_price = sum(item["total_price"] for item in sold_items)

                sales_data.append({
                    "sale_id": sale.sales_id,
                    "user_id": sale.user_id,
                    "username": username,
                    "shop_id": sale.shop_id,
                    "shop_name": shopname,
                    "customer_name": sale.customer_name,
                    "status": sale.status,
                    "customer_number": sale.customer_number,
                    "items": sold_items,
                    "total_items_price": total_items_price,
                    "total_amount_paid": total_amount_paid,
                    "balance": sale.balance,
                    "payment_methods": payment_data,
                    "created_at": sale.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    "note": sale.note,
                    "promocode": sale.promocode
                })

            return {
                "employee": username,
                "shop_id": shop_id,
                "shop_name": shopname,
                "total_sales": total_sales,
                "total_amount": sum(sale['total_amount_paid'] for sale in sales_data),
                "current_page": page,
                "total_pages": total_pages,
                "sales": sales_data
            }, 200

        except Exception as e:
            return {"error": str(e)}, 500



class CashSales(Resource):
    @jwt_required()
    def get(self):
        shop_id = request.args.get("shop_id")

        # Set the minimum date filter to 2025-05-27
        min_date = datetime(2025, 5, 27).date()

        query = (
            Sales.query
            .join(SalesPaymentMethods, Sales.sales_id == SalesPaymentMethods.sale_id)
            .filter(SalesPaymentMethods.payment_method == 'cash')
            .filter(db.func.date(Sales.created_at) >= min_date)  # Add minimum date filter
        )

        if shop_id:
            query = query.filter(Sales.shop_id == shop_id)

        # Date filtering (optional additional filters)
        date_str = request.args.get('date')
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')

        try:
            if date_str:
                date = datetime.strptime(date_str, "%Y-%m-%d").date()
                if date < min_date:
                    date = min_date  # Ensure we don't go before our minimum date
                query = query.filter(db.func.date(Sales.created_at) == date)
            elif start_date_str and end_date_str:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
                end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
                # Adjust start_date if it's before our minimum
                if start_date < min_date:
                    start_date = min_date
                query = query.filter(db.func.date(Sales.created_at).between(start_date, end_date))
        except ValueError:
            return {"error": "Invalid date format. Use YYYY-MM-DD."}, 400

        sales = query.all()

        results = []
        for sale in sales:
            user = Users.query.filter_by(users_id=sale.user_id).first()
            shop = Shops.query.filter_by(shops_id=sale.shop_id).first()

            username = user.username if user else "Unknown User"
            shopname = shop.shopname if shop else "Unknown Shop"

            payments = [p for p in sale.payment if p.payment_method == 'cash']
            for p in payments:
                created_at = sale.created_at.strftime('%Y-%m-%d %H:%M:%S') if sale.created_at else None

                results.append({
                    "sales_id": sale.sales_id,
                    "shop_id": sale.shop_id,
                    "shop_name": shopname,
                    "user_id": sale.user_id,
                    "username": username,
                    "customer_name": sale.customer_name,
                    "item_name": sale.item_name,
                    "quantity": sale.quantity,
                    "metric": sale.metric,
                    "unit_price": sale.unit_price,
                    "total_price": sale.total_price,
                    "amount_paid": p.amount_paid,
                    "balance": p.balance,
                    "transaction_code": p.transaction_code,
                    "created_at": created_at
                })

        return jsonify(results)

    def delete(self, sale_id):
        """Delete a specific sale and its payment records."""
        sale = Sales.query.get(sale_id)
        if not sale:
            return {"message": "Sale not found"}, 404

        db.session.delete(sale)
        db.session.commit()
        return {"message": "Sale deleted successfully"}, 200

    def put(self, sale_id):
        """Update a specific sale (quantity, unit price, total)."""
        sale = Sales.query.get(sale_id)
        if not sale:
            return {"message": "Sale not found"}, 404

        data = request.get_json()
        sale.quantity = data.get("quantity", sale.quantity)
        sale.unit_price = data.get("unit_price", sale.unit_price)
        sale.total_price = sale.quantity * sale.unit_price

        db.session.commit()
        return {"message": "Sale updated successfully"}, 200


    def delete(self, sale_id):
        """Delete a specific sale and its payment records."""
        sale = Sales.query.get(sale_id)
        if not sale:
            return {"message": "Sale not found"}, 404

        db.session.delete(sale)
        db.session.commit()
        return {"message": "Sale deleted successfully"}, 200

    def put(self, sale_id):
        """Update a specific sale (quantity, unit price, total)."""
        sale = Sales.query.get(sale_id)
        if not sale:
            return {"message": "Sale not found"}, 404

        data = request.get_json()
        sale.quantity = data.get("quantity", sale.quantity)
        sale.unit_price = data.get("unit_price", sale.unit_price)
        sale.total_price = sale.quantity * sale.unit_price

        db.session.commit()
        return {"message": "Sale updated successfully"}, 200
    
class CashSalesByUser(Resource):
    def get(self, user_id):
        query = (
            Sales.query
            .join(SalesPaymentMethods, Sales.sales_id == SalesPaymentMethods.sale_id)
            .filter(
                Sales.user_id == user_id,
                SalesPaymentMethods.payment_method == 'cash'
            )
        )

        # Date filtering
        date_str = request.args.get('date')
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')

        try:
            if date_str:
                date = datetime.strptime(date_str, "%Y-%m-%d").date()
                query = query.filter(db.func.date(Sales.created_at) == date)
            elif start_date_str and end_date_str:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
                end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
                query = query.filter(db.func.date(Sales.created_at).between(start_date, end_date))
        except ValueError:
            return {"error": "Invalid date format. Use YYYY-MM-DD."}, 400

        sales = query.all()

        results = []
        for sale in sales:
            payments = [p for p in sale.payment if p.payment_method == 'cash']
            for p in payments:
                results.append({
                    "sales_id": sale.sales_id,
                    "user_id": sale.user_id,
                    "shop_id": sale.shop_id,
                    "customer_name": sale.customer_name,
                    "item_name": sale.item_name,
                    "quantity": sale.quantity,
                    "metric": sale.metric,
                    "unit_price": sale.unit_price,
                    "total_price": sale.total_price,
                    "amount_paid": p.amount_paid,
                    "balance": p.balance,
                    "transaction_code": p.transaction_code,
                    "created_at": sale.created_at.strftime('%Y-%m-%d %H:%M:%S')
                })

        return jsonify(results)
  
    
class TotalCashSalesByUser(Resource):
    @jwt_required()
    def get(self, username, shop_id):
        today = datetime.utcnow()
        start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = today.replace(hour=23, minute=59, second=59, microsecond=999999)

        try:
            # Get user
            user = db.session.query(Users).filter(Users.username == username).first()
            if not user:
                return {"message": f"User '{username}' not found"}, 404

            # Calculate total cash sales for today
            total_cash_query = (
                db.session.query(db.func.sum(SalesPaymentMethods.amount_paid))
                .join(Sales, Sales.sales_id == SalesPaymentMethods.sale_id)
                .filter(Sales.user_id == user.users_id)
                .filter(Sales.shop_id == shop_id)
                .filter(SalesPaymentMethods.payment_method == 'cash')
                .filter(Sales.created_at.between(start_date, end_date))
            )

            total_cash_sales = total_cash_query.scalar() or 0

            # Calculate total deposits for today (to subtract from cash sales)
            total_deposits_query = (
                db.session.query(db.func.sum(CashDeposits.amount))
                .filter(CashDeposits.user_id == user.users_id)
                .filter(CashDeposits.shop_id == shop_id)
                .filter(CashDeposits.created_at.between(start_date, end_date))
            )

            total_deposits = total_deposits_query.scalar() or 0

            # Calculate net cash (sales minus deposits)
            net_cash = total_cash_sales - total_deposits

            # Ensure it doesn't go negative
            net_cash = max(0, net_cash)
            
            formatted_cash = "Ksh {:,.2f}".format(net_cash)

            return {
                "total_cash_sales": formatted_cash,
                "period": "today",
                "date": today.date().isoformat()
            }, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {
                "error": "An error occurred while calculating total cash sales by user",
                "details": str(e)
            }, 500



class GenerateSalesReport(Resource):
    @jwt_required()
    def post(self):
        try:
            # Get all filter parameters from request
            filters = request.get_json() or {}
            
            # Build the base query
            sales_query = Sales.query.order_by(Sales.created_at.desc()).join(Shops).join(Users)
            
            # Apply filters
            if filters.get('search_query'):
                search = f"%{filters['search_query']}%"
                sales_query = sales_query.filter(
                    Sales.customer_name.ilike(search) |
                    Users.username.ilike(search) |
                    Shops.shopname.ilike(search)
                )
            
            if filters.get('start_date'):
                try:
                    start_date = datetime.strptime(filters['start_date'], '%Y-%m-%d').date()
                    sales_query = sales_query.filter(db.func.date(Sales.created_at) >= start_date)
                except ValueError:
                    return {"error": "Invalid start date format. Use YYYY-MM-DD."}, 400
            
            if filters.get('end_date'):
                try:
                    end_date = datetime.strptime(filters['end_date'], '%Y-%m-%d').date()
                    sales_query = sales_query.filter(db.func.date(Sales.created_at) <= end_date)
                except ValueError:
                    return {"error": "Invalid end date format. Use YYYY-MM-DD."}, 400
            
            if filters.get('shopname'):
                sales_query = sales_query.filter(Shops.shopname.ilike(f"%{filters['shopname']}%"))
            
            if filters.get('status'):
                sales_query = sales_query.filter(Sales.status == filters['status'])
            
            # Execute query
            sales = sales_query.all()
            
            # Prepare data for Excel - we'll create multiple sheets
            output = BytesIO()
            writer = pd.ExcelWriter(output, engine='xlsxwriter')
            
            # 1. Create summary sheet for all shops with separate columns for items and batch numbers
            all_shops_data = []
            for sale in sales:
                user = Users.query.get(sale.user_id)
                shop = Shops.query.get(sale.shop_id)
                total_amount = sum(p.amount_paid for p in sale.payment)
                
                # Create separate entries for each item in the sale
                for item in sale.items:
                    all_shops_data.append({
                        "Sale ID": sale.sales_id,
                        "Date": sale.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                        "User": user.username if user else "Unknown",
                        "Shop": shop.shopname if shop else "Unknown",
                        "Customer": sale.customer_name,
                        "Status": sale.status,
                        "Item Name": item.item_name,
                        "Quantity": item.quantity,
                        "Metric": item.metric,
                        "Unit Price": item.unit_price,
                        "Total Price": item.total_price,
                        "Batch Number": item.BatchNumber,
                        "Amount Paid": total_amount,
                        "Balance": sale.balance,
                        "Payment Methods": ", ".join(set(p.payment_method for p in sale.payment)),
                        "Note": sale.note or ""
                    })
            
            # Create all shops summary sheet
            if all_shops_data:
                df_all_shops = pd.DataFrame(all_shops_data)
                df_all_shops.to_excel(writer, sheet_name='All Sales', index=False)
                
                # Auto-adjust columns' width
                for column in df_all_shops:
                    column_width = max(df_all_shops[column].astype(str).map(len).max(), len(column))
                    col_idx = df_all_shops.columns.get_loc(column)
                    writer.sheets['All Sales'].set_column(col_idx, col_idx, column_width)
            
            # 2. Create detailed items sheet with all item details
            detailed_items_data = []
            for sale in sales:
                user = Users.query.get(sale.user_id)
                shop = Shops.query.get(sale.shop_id)
                
                for item in sale.items:
                    detailed_items_data.append({
                        "Sale ID": sale.sales_id,
                        "Date": sale.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                        "Shop": shop.shopname if shop else "Unknown",
                        "User": user.username if user else "Unknown",
                        "Customer": sale.customer_name,
                        "Status": sale.status,
                        "Item Name": item.item_name,
                        "Quantity": item.quantity,
                        "Metric": item.metric,
                        "Unit Price": item.unit_price,
                        "Total Price": item.total_price,
                        "Batch Number": item.BatchNumber,
                        "Cost of Sale": item.Cost_of_sale,
                        "Purchase Account": item.Purchase_account,
                        "Payment Methods": ", ".join(set(p.payment_method for p in sale.payment)),
                        "Note": sale.note or ""
                    })
            
            if detailed_items_data:
                df_detailed = pd.DataFrame(detailed_items_data)
                df_detailed.to_excel(writer, sheet_name='Item Details', index=False)
                
                # Auto-adjust columns' width
                for column in df_detailed:
                    column_width = max(df_detailed[column].astype(str).map(len).max(), len(column))
                    col_idx = df_detailed.columns.get_loc(column)
                    writer.sheets['Item Details'].set_column(col_idx, col_idx, column_width)
            
            # 3. Create summary statistics by shop
            if sales:
                summary_stats = []
                shop_totals = {}
                
                # Calculate totals per shop
                for sale in sales:
                    shop = Shops.query.get(sale.shop_id)
                    shop_name = shop.shopname if shop else f"Shop_{sale.shop_id}"
                    total_amount = sum(p.amount_paid for p in sale.payment)
                    
                    if shop_name not in shop_totals:
                        shop_totals[shop_name] = {
                            'total_sales': 0,
                            'transaction_count': 0,
                            'item_count': 0
                        }
                    shop_totals[shop_name]['total_sales'] += total_amount
                    shop_totals[shop_name]['transaction_count'] += 1
                    shop_totals[shop_name]['item_count'] += len(sale.items)
                
                # Prepare summary data
                for shop_name, totals in shop_totals.items():
                    summary_stats.append({
                        "Shop": shop_name,
                        "Total Sales": totals['total_sales'],
                        "Number of Transactions": totals['transaction_count'],
                        "Number of Items Sold": totals['item_count']
                    })
                
                # Add overall totals
                summary_stats.append({
                    "Shop": "ALL SHOPS",
                    "Total Sales": sum(t['total_sales'] for t in shop_totals.values()),
                    "Number of Transactions": sum(t['transaction_count'] for t in shop_totals.values()),
                    "Number of Items Sold": sum(t['item_count'] for t in shop_totals.values())
                })
                
                df_summary = pd.DataFrame(summary_stats)
                df_summary.to_excel(writer, sheet_name='Summary Statistics', index=False)
                
                # Auto-adjust columns' width
                for column in df_summary:
                    column_width = max(df_summary[column].astype(str).map(len).max(), len(column))
                    col_idx = df_summary.columns.get_loc(column)
                    writer.sheets['Summary Statistics'].set_column(col_idx, col_idx, column_width)
            
            writer.close()
            output.seek(0)
            
            return send_file(
                output,
                as_attachment=True,
                download_name=f"sales_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx",
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            
        except Exception as e:
            return {"error": str(e)}, 500