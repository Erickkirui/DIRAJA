from  flask_restful import Resource
from app import db
from Server.Models.Inventory import Inventory
from Server.Models.Transfer import Transfer
from Server.Models.Users import Users
from Server.Models.Paymnetmethods import SalesPaymentMethods
from Server.Models.Shops import Shops
from Server.Models.Shopstock import ShopStock
from Server.Models.Sales import Sales
from Server.Models.Stock import Stock
from Server.Models.SoldItems import SoldItem
from Server.Models.Employees import Employees
from Server.Models.Expenses import Expenses
from Server.Models.Transfer import Transfer
from Server.Models.Mabandafarm import MabandaSale, MabandaExpense
from flask_jwt_extended import jwt_required,get_jwt_identity
from functools import wraps
from flask import jsonify,request,make_response
from sqlalchemy.orm import aliased
from datetime import datetime, timedelta
from sqlalchemy.exc import SQLAlchemyError
from collections import defaultdict
from flask import current_app
import traceback
from sqlalchemy import func

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


class CountEmployees(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        countUsers =Employees.query.count()
        return {"total employees": countUsers}, 200

class TotalAmountPaidAllSales(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        try:
            # Extract the date or period from the request
            date_str = request.args.get('date')
            period = request.args.get('period', 'today')
            
            # Default to today if no custom date is provided
            today = datetime.utcnow()
            start_date_str = request.args.get('startDate')
            end_date_str = request.args.get('endDate')
            
            if start_date_str and end_date_str:
                try:
                    start_date = datetime.strptime(start_date_str, '%Y-%m-%d').replace(hour=0, minute=0, second=0, microsecond=0)
                    end_date = datetime.strptime(end_date_str, '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999)
                except ValueError:
                    return {"message": "Invalid date format. Use YYYY-MM-DD."}, 400
            else:
                if period == 'today':
                    start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)
                    end_date = today.replace(hour=23, minute=59, second=59, microsecond=999999)
                elif period == 'yesterday':
                    yesterday_date = today - timedelta(days=1)
                    start_date = yesterday_date.replace(hour=0, minute=0, second=0, microsecond=0)
                    end_date = yesterday_date.replace(hour=23, minute=59, second=59, microsecond=999999)
                elif period == 'week':
                    start_date = (today - timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
                    end_date = today.replace(hour=23, minute=59, second=59, microsecond=999999)
                elif period == 'month':
                    start_date = (today - timedelta(days=30)).replace(hour=0, minute=0, second=0, microsecond=0)
                    end_date = today.replace(hour=23, minute=59, second=59, microsecond=0)
                elif period == 'alltime':
                    start_date = None
                    end_date = None
                else:
                    return {"message": "Invalid period specified"}, 400

            # Build the query to sum up the amount_paid for the specified period.
            query = (
                db.session.query(db.func.sum(SalesPaymentMethods.amount_paid))
                .join(Sales, Sales.sales_id == SalesPaymentMethods.sale_id)
            )
            
            if start_date and end_date:
                query = query.filter(Sales.created_at.between(start_date, end_date))

            total_sales = query.scalar() or 0

            # Query for the all-time total sales (no date filters)
            all_time_query = (
                db.session.query(db.func.sum(SalesPaymentMethods.amount_paid))
                .join(Sales, Sales.sales_id == SalesPaymentMethods.sale_id)
            )
            
            all_time_sales = all_time_query.scalar() or 0

            # Format the total sales amounts to 2 decimal places with a currency symbol.
            formatted_sales = "Ksh {:,.2f}".format(total_sales)
            formatted_all_time_sales = "Ksh {:,.2f}".format(all_time_sales)
            
            return {
                "total_sales_amount_paid": formatted_sales,
                "all_time_total_sales_amount_paid": formatted_all_time_sales
            }, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {
                "error": "An error occurred while fetching the total sales amount", 
                "details": str(e)
            }, 500



class TotalAmountPaidSalesPerShop(Resource):
    @jwt_required()
    def get(self):
        # Get period and shop_id from query parameters
        period = request.args.get('period', 'today')
        shop_id = request.args.get('shop_id')

        # Validate shop_id
        if not shop_id:
            return {"message": "Shop ID is required"}, 400

        today = datetime.utcnow()
        start_date = None

        # Set the start date based on the requested period
        if period == 'today':
            start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == 'week':
            start_date = today - timedelta(days=7)
        elif period == 'month':
            start_date = today - timedelta(days=30)
        elif period == 'date':
            date_str = request.args.get('date')  # Get the specific date
            if not date_str:
                return {"message": "Date parameter is required when period is 'date'"}, 400
            
            try:
                # Parse the provided date
                start_date = datetime.strptime(date_str, "%Y-%m-%d")
                # Set time range to cover the entire day
                start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = start_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            except ValueError:
                return {"message": "Invalid date format. Use YYYY-MM-DD."}, 400
        elif period == 'alltime':
            start_date = None
            end_date = None
        else:
            return {"message": "Invalid period specified"}, 400

        try:
            # Base query for paid sales (using SalesPaymentMethods)
            query_paid = (
                db.session.query(db.func.sum(SalesPaymentMethods.amount_paid))
                .join(Sales, Sales.sales_id == SalesPaymentMethods.sale_id)
                .filter(Sales.shop_id == shop_id, Sales.status == 'paid')
            )

            # Base query for unpaid/partially paid sales (using total_price)
            query_unpaid = (
                db.session.query(db.func.sum(SoldItem.total_price))
                .filter(Sales.shop_id == shop_id)
                .filter(Sales.status.in_(['unpaid', 'partially_paid']))
            )

            if period == 'date':
                query_paid = query_paid.filter(Sales.created_at >= start_date, Sales.created_at <= end_date)
                query_unpaid = query_unpaid.filter(Sales.created_at >= start_date, Sales.created_at <= end_date)
            else:
                query_paid = query_paid.filter(Sales.created_at >= start_date)
                query_unpaid = query_unpaid.filter(Sales.created_at >= start_date)

            total_paid = query_paid.scalar() or 0
            total_unpaid = query_unpaid.scalar() or 0

            total_sales = total_paid + total_unpaid

            # Format the total sales to 2 decimal places with commas
            formatted_sales = "{:,.2f}".format(total_sales)

            return {"total_sales_amount_paid": formatted_sales}, 200

        except SQLAlchemyError:
            db.session.rollback()
            return {"error": "An error occurred while fetching the total sales amount"}, 500


class TotalAmountPaidExpenses(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        today = datetime.utcnow()
        start_date = None
        end_date = None

        # Handle custom date range
        start_date_str = request.args.get('start_date')  # Match frontend
        end_date_str = request.args.get('end_date')  # Match frontend

        if start_date_str and end_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999)
            except ValueError:
                return {"message": "Invalid date format. Use YYYY-MM-DD."}, 400
        else:
            # Handle predefined periods if no custom date is provided
            period = request.args.get('period', 'today')
            if period == 'today':
                start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = today
            elif period == 'yesterday':
                start_date = (today - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = start_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            elif period == 'week':
                start_date = today - timedelta(days=7)
                end_date = today
            elif period == 'month':
                start_date = today - timedelta(days=30)
                end_date = today
            elif period == 'alltime':
                start_date = None
                end_date = None
            else:
                return {"message": "Invalid period specified"}, 400

        try:
            # Build query to sum the `amountPaid`
            query = db.session.query(db.func.sum(Expenses.amountPaid))

            # Apply date filtering only if start_date and end_date are defined
            if start_date and end_date:
                query = query.filter(Expenses.created_at.between(start_date, end_date))
            elif start_date:
                query = query.filter(Expenses.created_at >= start_date)

            total_amount = query.scalar() or 0

            # Format the total amount with currency symbol
            formatted_amount = "Ksh {:,.2f}".format(total_amount)

            return {"total_amount_paid": formatted_amount}, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {
                "error": "An error occurred while fetching the total expenses amount",
                "details": str(e)
            }, 500




class TotalAmountPaidPurchasesInventory (Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        today = datetime.utcnow()
        start_date = None
        end_date = None

        # Check for custom date range
        start_date_str = request.args.get('startDate')
        end_date_str = request.args.get('endDate')

        if start_date_str and end_date_str:
            try:
                # Parse custom start and end dates
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999)
            except ValueError:
                return {"message": "Invalid date format. Use YYYY-MM-DD."}, 400
        else:
            # Handle predefined periods if no custom date is provided
            period = request.args.get('period', 'today')
            if period == 'today':
                start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = today
            elif period == 'yesterday':
                start_date = (today - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = start_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            elif period == 'week':
                start_date = today - timedelta(days=7)
                end_date = today
            elif period == 'month':
                start_date = today - timedelta(days=30)
                end_date = today
            elif period == 'alltime':
                start_date = None
                end_date = None
            # else:
            #     return {"message": "Invalid period specified"}, 400

        try:
            # Build query to sum the `amountPaid`
            query = db.session.query(db.func.sum(Inventory.amountPaid))

            # Apply date filtering only if start_date and end_date are defined
            if start_date and end_date:
                query = query.filter(Inventory.created_at.between(start_date, end_date))
            elif start_date:
                query = query.filter(Inventory.created_at >= start_date)

            total_amount = query.scalar() or 0

            # Format the total amount with currency symbol
            formatted_amount = "Ksh {:,.2f}".format(total_amount)

            return {"total_amount_paid": formatted_amount}, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {
                "error": "An error occurred while fetching the total purchases amount",
                "details": str(e)
            }, 500


class TotalAmountPaidPurchases(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        today = datetime.utcnow()
        start_date = None
        end_date = None

        # Check for custom date range
        start_date_str = request.args.get('startDate')
        end_date_str = request.args.get('endDate')

        if start_date_str and end_date_str:
            try:
                # Parse custom start and end dates
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999)
            except ValueError:
                return {"message": "Invalid date format. Use YYYY-MM-DD."}, 400
        else:
            # Handle predefined periods if no custom date is provided
            period = request.args.get('period', 'today')
            if period == 'today':
                start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = today
            elif period == 'yesterday':
                start_date = (today - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = start_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            elif period == 'week':
                start_date = today - timedelta(days=7)
                end_date = today
            elif period == 'month':
                start_date = today - timedelta(days=30)
                end_date = today
            elif period == 'alltime':
                start_date = None
                end_date = None
            # else:
            #     return {"message": "Invalid period specified"}, 400

        try:
            # Build query to sum the `amountPaid`
            query = db.session.query(db.func.sum(Transfer.amountPaid))

            # Apply date filtering only if start_date and end_date are defined
            if start_date and end_date:
                query = query.filter(Transfer.created_at.between(start_date, end_date))
            elif start_date:
                query = query.filter(Transfer.created_at >= start_date)

            total_amount = query.scalar() or 0

            # Format the total amount with currency symbol
            formatted_amount = "Ksh {:,.2f}".format(total_amount)

            return {"total_amount_paid": formatted_amount}, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {
                "error": "An error occurred while fetching the total purchases amount",
                "details": str(e)
            }, 500



class CountShops(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        countShops = Shops.query.count()
        return {"total shops": countShops}, 200      


class TotalAmountPaidPerShop(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        today = datetime.utcnow()
        start_date = None
        end_date = None

        # Check if a custom date is provided via the "date" parameter.
        date_str = request.args.get('date')
        if date_str:
            try:
                start_date = datetime.strptime(date_str, '%Y-%m-%d').replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = start_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            except ValueError:
                return {"message": "Invalid date format. Use YYYY-MM-DD."}, 400
        else:
            # No custom date provided; use the period parameter (default to 'today').
            period = request.args.get('period', 'today')

            if period == 'today':
                start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = today
            elif period == 'yesterday':
                start_date = (today - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = start_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            elif period == 'week':
                start_date = (today - timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = today
            elif period == 'month':
                start_date = (today - timedelta(days=30)).replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = today
            else:
                return {"message": "Invalid period specified. Use 'today', 'yesterday', 'week', 'month', or a custom date."}, 400

        try:
            # Query for all shop IDs
            shops = Shops.query.all()

            # Calculate total sales for each shop
            results = []
            for shop in shops:
                shop_id = shop.shops_id

                # Query to sum `amount_paid` for each shop
                query = (
                    db.session.query(db.func.sum(SalesPaymentMethods.amount_paid))
                    .join(Sales, Sales.sales_id == SalesPaymentMethods.sale_id)  # Join Sales to link sales_id
                    .filter(Sales.shop_id == shop_id)
                )

                # Apply date filter
                query = query.filter(Sales.created_at.between(start_date, end_date))

                total_sales = query.scalar() or 0  # Default to 0 if no result

                # Format total sales with comma separators and 2 decimal places
                formatted_sales = "Ksh {:,.2f}".format(total_sales)

                results.append({
                    "shop_id": shop_id,
                    "shop_name": shop.shopname,
                    "total_sales_amount_paid": formatted_sales
                })

            return {"total_sales_per_shop": results}, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "An error occurred while fetching total sales amounts for all shops", "details": str(e)}, 500



class StockAlert(Resource):
    @jwt_required()
    def get(self):
        low_stock_threshold = 50
        out_of_stock_threshold = 0
        shop_name = request.args.get('shop')  # Filter by shop name if provided

        try:
            # Query ShopStock data, optionally filtered by shop name if provided
            if shop_name:
                # Query ShopStock with a join on Shops to get shop names
                shop_stock_items = db.session.query(ShopStock, Shops.shopname, ShopStock.itemname).join(
                    Shops, Shops.shops_id == ShopStock.shop_id).filter(Shops.shopname == shop_name).all()
            else:
                shop_stock_items = db.session.query(ShopStock, Shops.shopname, ShopStock.itemname).join(
                    Shops, Shops.shops_id == ShopStock.shop_id).all()

            # Create a dictionary to group items by shop and item name
            grouped_items = {}

            for stock, shopname, itemname in shop_stock_items:
                key = (shopname, itemname)  # Use shop name and item name as the key
                if key not in grouped_items:
                    grouped_items[key] = 0
                grouped_items[key] += stock.quantity  # Sum up the quantities for the same item

            # Identify low stock items
            low_stock_items = [
                {
                    "item": item_name,
                    "shop": shop_name,
                    "status": "low stock",
                    "classname": "low-stock"
                }
                for (shop_name, item_name), total_quantity in grouped_items.items()
                if low_stock_threshold >= total_quantity > out_of_stock_threshold
            ]

            # Identify out of stock items
            out_of_stock_items = [
                {
                    "item": item_name,
                    "shop": shop_name,
                    "status": "out of stock",
                    "classname": "out-of-stock"
                }
                for (shop_name, item_name), total_quantity in grouped_items.items()
                if total_quantity == out_of_stock_threshold
            ]

            # Return response with categorized stock data
            return jsonify({
                "low_stock_items": low_stock_items,
                "out_of_stock_items": out_of_stock_items
            })

        except SQLAlchemyError as e:
            # Handle database query errors and log the error message
            current_app.logger.error(f"Error fetching shop stock data: {str(e)}")
            return {"error": "Unable to fetch shop stock data"}, 500



class TotalSalesByShop(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self, shop_id):
        today = datetime.utcnow()
        start_date = None
        end_date = None

        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')

        if start_date_str and end_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999)
            except ValueError:
                return {"message": "Invalid date format. Use YYYY-MM-DD."}, 400
        else:
            period = request.args.get('period', 'today')

            if period == 'today':
                start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = today
            elif period == 'yesterday':
                start_date = (today - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = start_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            elif period == 'week':
                start_date = (today - timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = today
            elif period == 'month':
                start_date = (today - timedelta(days=30)).replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = today
            else:
                return {"message": "Invalid period specified. Use 'today', 'yesterday', 'week', 'month', or provide start_date and end_date."}, 400

        try:
            shop = Shops.query.filter_by(shops_id=shop_id).first()
            if not shop:
                return {"message": "Shop not found."}, 404

            # Calculate total sales amount
            query = (
                db.session.query(db.func.sum(SalesPaymentMethods.amount_paid))
                .join(Sales, Sales.sales_id == SalesPaymentMethods.sale_id)
                .filter(Sales.shop_id == shop_id, Sales.created_at.between(start_date, end_date))
            )

            total_sales = query.scalar() or 0
            formatted_sales = "Ksh {:,.2f}".format(total_sales)

            # Get sales records
            sales_records = Sales.query.filter(
                Sales.shop_id == shop_id, 
                Sales.created_at.between(start_date, end_date)
            ).all()

            sales_list = []
            for sale in sales_records:
                user = Users.query.filter_by(users_id=sale.user_id).first()
                username = user.username if user else "Unknown User"

                # Get payment data
                payment_data = [
                    {
                        "payment_method": payment.payment_method,
                        "amount_paid": payment.amount_paid,
                        "balance": payment.balance,
                    }
                    for payment in sale.payment
                ]
                total_amount_paid = sum(payment["amount_paid"] for payment in payment_data)

                # Get all sold items for this sale
                sold_items = [
                    {
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

                sales_list.append({
                    "sale_id": sale.sales_id,
                    "created_at": sale.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    "user_id": sale.user_id,
                    "username": username,
                    "customer_name": sale.customer_name,
                    "status": sale.status,
                    "customer_number": sale.customer_number,
                    "items": sold_items,
                    "total_amount_paid": total_amount_paid,
                    "payment_methods": payment_data,
                    "balance": sale.balance,
                    "note": sale.note,
                    "promocode": sale.promocode
                })

            return {
                "shop_id": shop_id,
                "shop_name": shop.shopname,
                "total_sales_amount_paid": formatted_sales,
                "sales_records": sales_list,
                "start_date": start_date.strftime('%Y-%m-%d %H:%M:%S'),
                "end_date": end_date.strftime('%Y-%m-%d %H:%M:%S')
            }, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "An error occurred while fetching total sales for the shop", "details": str(e)}, 500
 


class TotalUnpaidAmountAllSales(Resource):
    @jwt_required()
    def get(self):
        today = datetime.utcnow()
        start_date = None
        end_date = None

        # Check if a custom date range is provided with startDate and endDate
        start_date_str = request.args.get('startDate')
        end_date_str = request.args.get('endDate')

        if start_date_str and end_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999)
            except ValueError:
                return {"message": "Invalid date format. Use YYYY-MM-DD."}, 400
        else:
            # Handle period if no custom dates are provided
            period = request.args.get('period', 'today')

            if period == 'today':
                start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = today.replace(hour=23, minute=59, second=59, microsecond=999999)
            elif period == 'yesterday':
                yesterday_date = today - timedelta(days=1)
                start_date = yesterday_date.replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = yesterday_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            elif period == 'week':
                start_date = today - timedelta(days=7)
                end_date = today.replace(hour=23, minute=59, second=59, microsecond=0)
            elif period == 'month':
                start_date = today - timedelta(days=30)
                end_date = today.replace(hour=23, minute=59, second=59, microsecond=0)
            else:
                return {"message": "Invalid period specified"}, 400

        try:
            # Query to sum up balances for partially_paid or unpaid sales within the date range
            query = (
                db.session.query(db.func.sum(Sales.balance))
                .filter(Sales.created_at.between(start_date, end_date))
                .filter(Sales.status.in_(["partially_paid", "unpaid"]))
            )

            total_unpaid = query.scalar() or 0

            # Format the total unpaid amount with currency formatting
            formatted_unpaid = "Ksh {:,.2f}".format(total_unpaid)
            
            return {"total_unpaid_amount": formatted_unpaid}, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {
                "error": "An error occurred while fetching the total unpaid amount", 
                "details": str(e)
            }, 500


            
            
# Credit sales total amoount card on the clerks' dashboard

class TotalUnpaidAmountPerClerk(Resource):
    @jwt_required()
    def get(self):
        try:
            # Get the logged-in clerk's user ID from the token
            clerk_id = get_jwt_identity()
            
            if not clerk_id:
                return {"message": "Unauthorized"}, 401

            today = datetime.utcnow()
            start_date = None
            end_date = None

            # Check if a custom date is provided
            date_str = request.args.get('date')
            if date_str:
                try:
                    start_date = datetime.strptime(date_str, '%Y-%m-%d').replace(hour=0, minute=0, second=0, microsecond=0)
                    end_date = start_date.replace(hour=23, minute=59, second=59, microsecond=999999)
                except ValueError:
                    return {"message": "Invalid date format. Use YYYY-MM-DD."}, 400
            else:
                # Check for start_date and end_date
                start_date_str = request.args.get('start_date')
                end_date_str = request.args.get('end_date')

                if start_date_str and end_date_str:
                    try:
                        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').replace(hour=0, minute=0, second=0, microsecond=0)
                        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999)
                    except ValueError:
                        return {"message": "Invalid date format. Use YYYY-MM-DD."}, 400
                else:
                    # Default period filter
                    period = request.args.get('period', 'today')

                    if period == 'today':
                        start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)
                        end_date = today.replace(hour=23, minute=59, second=59, microsecond=999999)
                    elif period == 'yesterday':
                        yesterday_date = today - timedelta(days=1)
                        start_date = yesterday_date.replace(hour=0, minute=0, second=0, microsecond=0)
                        end_date = yesterday_date.replace(hour=23, minute=59, second=59, microsecond=999999)
                    elif period == 'week':
                        start_date = today - timedelta(days=7)
                        end_date = today.replace(hour=23, minute=59, second=59, microsecond=999999)
                    elif period == 'month':
                        start_date = today - timedelta(days=30)
                        end_date = today.replace(hour=23, minute=59, second=59, microsecond=999999)
                    else:
                        return {"message": "Invalid period specified"}, 400

            # Query to sum unpaid balances for this clerk only
            total_unpaid = (
                db.session.query(db.func.sum(Sales.balance))
                .filter(Sales.created_at.between(start_date, end_date))
                .filter(Sales.status.in_(["partially_paid", "unpaid"]))
                .filter(Sales.user_id == clerk_id)  # Filter by logged-in clerk
                .scalar() or 0
            )

            formatted_unpaid = "{:,.2f}".format(total_unpaid)

            return {"total_unpaid_amount": formatted_unpaid}, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {
                "error": "An error occurred while fetching the total unpaid amount",
                "details": str(e)
            }, 500



class TotalAmountPaidForMabanda(Resource):
    @jwt_required()
    def get(self):
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        start_date = None
        end_date = None

        # Fetch start_date and end_date from query params
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
       
        if start_date_str and end_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999)
            except ValueError:
                return {"message": "Invalid date format. Use YYYY-MM-DD for start_date and end_date."}, 400
        else:
            # No custom start and end date provided; check period parameter
            period = request.args.get('period', 'today')

            if period == 'today':
                start_date = today
                end_date = today.replace(hour=23, minute=59, second=59, microsecond=999999)
            elif period == 'yesterday':
                start_date = today - timedelta(days=1)
                end_date = start_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            elif period == 'week':
                start_date = today - timedelta(days=7)
                end_date = today.replace(hour=23, minute=59, second=59, microsecond=999999)
            elif period == 'month':
                start_date = today - timedelta(days=30)
                end_date = today.replace(hour=23, minute=59, second=59, microsecond=999999)
            else:
                return {"message": "Invalid period specified. Use 'today', 'yesterday', 'week', 'month' or specify start_date and end_date."}, 400

        try:
            # Fetch total sales amount
            total_sales = (
                db.session.query(db.func.sum(MabandaSale.amount_paid))
                .filter(MabandaSale.shop_id == 12)
                .filter(MabandaSale.sale_date >= start_date, MabandaSale.sale_date <= end_date)
                .scalar() or 0
            )
            formatted_sales = "Ksh {:,.2f}".format(total_sales)

            # Fetch all sales data within the given date range
            sales_records = (
            db.session.query(MabandaSale)
            .filter(MabandaSale.shop_id == 12)
            .filter(MabandaSale.sale_date >= start_date, MabandaSale.sale_date <= end_date)
            .order_by(MabandaSale.sale_date.desc())
            .all()  
            )

            # Serialize the sales data
            sales_data = [
                {
                    "id": sale.mabandasale_id,
                    "sale_date": sale.sale_date.strftime('%Y-%m-%d'),
                    "amount_paid": "Ksh {:,.2f}".format(sale.amount_paid),
                    "item_name": sale.itemname,  # Assuming you have this field
                    "quantity": sale.quantity_sold,    # Assuming you have this field
                }
                for sale in sales_records
            ]

            return {
                "shop_id": 12,
                "total_sales_amount_paid": formatted_sales,
                "start_date": start_date.strftime('%Y-%m-%d'),
                "end_date": end_date.strftime('%Y-%m-%d'),
                "sales_data": sales_data  # Returning the individual sales records
            }, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "An error occurred while fetching total sales amount", "details": str(e)}, 500

        
        

class TotalExpensesForMabanda(Resource):
    @jwt_required()
    def get(self):
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        # Get query parameters
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        period = request.args.get('period', 'today')

        # If both start_date and end_date are provided, use them
        if start_date_str and end_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999)
            except ValueError:
                return {"message": "Invalid date format. Use YYYY-MM-DD."}, 400

        # If only one date is provided, return an error
        elif start_date_str or end_date_str:
            return {"message": "Both start_date and end_date must be provided."}, 400

        # If no date range is provided, fallback to period-based filtering
        else:
            if period == 'today':
                start_date = today
                end_date = today.replace(hour=23, minute=59, second=59, microsecond=999999)
            elif period == 'yesterday':
                start_date = today - timedelta(days=1)
                end_date = start_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            elif period == 'week':
                start_date = today - timedelta(days=7)
                end_date = today.replace(hour=23, minute=59, second=59, microsecond=999999)
            elif period == 'month':
                start_date = today - timedelta(days=30)
                end_date = today.replace(hour=23, minute=59, second=59, microsecond=999999)
            else:
                return {"message": "Invalid period specified. Use 'today', 'yesterday', 'week', 'month', or provide start_date and end_date."}, 400

        try:
            # Query total expenses
            total_expenses = (
                db.session.query(db.func.sum(MabandaExpense.amount))
                .filter(MabandaExpense.shop_id == 12)
                .filter(MabandaExpense.expense_date >= start_date, MabandaExpense.expense_date <= end_date)
                .scalar() or 0  # Default to 0 if no expenses found
            )

            # Query individual expense records
            expense_records = (
                db.session.query(MabandaExpense)
                .filter(MabandaExpense.shop_id == 12)
                .filter(MabandaExpense.expense_date >= start_date, MabandaExpense.expense_date <= end_date)
                .all()
            )

            formatted_expenses = "Ksh {:,.2f}".format(total_expenses)

            return {
                "shop_id": 12,
                "total_expenses_amount": formatted_expenses,
                "start_date": start_date.strftime('%Y-%m-%d'),
                "end_date": end_date.strftime('%Y-%m-%d'),
                "expenses_records": [
                    {
                        "description": expense.description,
                        "amount": "Ksh {:,.2f}".format(expense.amount),
                        "expense_date": expense.expense_date.strftime('%Y-%m-%d')
                    }
                    for expense in expense_records
                ]
            }, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "An error occurred while fetching expenses", "details": str(e)}, 500
    

class SalesSummary(Resource):
    def get(self):
        # Assuming shop_id and batch_number are provided as query parameters
        shop_id = request.args.get('shop_id', type=int)  # Get shop_id from request params
        batch_number = request.args.get('batch_number', type=str)  # Get batch_number from request params

        # Query to calculate the total sales, remaining quantity for each item,
        # and total amount paid from SalesPaymentMethods for a specific shop and batch
        summary = db.session.query(
            ShopStock.itemname,
            ShopStock.BatchNumber,
            ShopStock.metric,  # Include the metric from the ShopStock table
            Transfer.quantity.label('initial_quantity_transferred'),  # Initial quantity transferred from the Transfer table
            (Transfer.quantity - ShopStock.quantity).label('total_quantity_sold'),  # Subtraction for total_quantity_sold
            (Transfer.quantity * Transfer.unitCost).label('purchase_value'),  # Purchase value as Transfer.quantity * Transfer.unitCost
            ShopStock.quantity.label('remaining_quantity'),  # Remaining quantity based on ShopStock.quantity
            ShopStock.shop_id  # Include the shop_id for grouping
        ).join(Sales, Sales.BatchNumber == ShopStock.BatchNumber) \
         .join(Transfer, Transfer.inventory_id == ShopStock.inventory_id)  # Join with Transfer to get initial quantity transferred

        # Apply filters for shop_id and batch_number (if provided)
        if shop_id:
            summary = summary.filter(ShopStock.shop_id == shop_id)  # Filter by shop_id
        if batch_number:
            summary = summary.filter(ShopStock.BatchNumber == batch_number)  # Filter by batch_number

        # Group by shop_id and batch_number to ensure total_amount_paid is specific to each
        summary = summary.group_by(
            ShopStock.itemname,
            ShopStock.BatchNumber,
            ShopStock.metric,
            Transfer.quantity,
            ShopStock.shop_id
        ).all()  # Get all the results

        # Now query Sales and SalesPaymentMethods to calculate the total_amount_paid for each combination of batch_number and shop_id
        total_payments = db.session.query(
            Sales.BatchNumber,
            Sales.shop_id,
            func.sum(SalesPaymentMethods.amount_paid).label('total_amount_paid')  # Summing the amount_paid
        ).join(SalesPaymentMethods, Sales.sales_id == SalesPaymentMethods.sale_id)  # Join with SalesPaymentMethods to get the amount_paid
        if shop_id:
            total_payments = total_payments.filter(Sales.shop_id == shop_id)  # Filter by shop_id
        if batch_number:
            total_payments = total_payments.filter(Sales.BatchNumber == batch_number)  # Filter by batch_number
        
        total_payments = total_payments.group_by(Sales.BatchNumber, Sales.shop_id).all()  # Group by batch_number and shop_id
        
        # Now, build the response by combining the summary data with the total payments
        response = []
        for item in summary:
            # Find the total_amount_paid for this batch_number and shop_id
            total_paid_for_batch = next((payment.total_amount_paid for payment in total_payments 
                                         if payment.BatchNumber == item.BatchNumber and payment.shop_id == item.shop_id), 0.0)
            
            response.append({
                "item_name": item.itemname,
                "batch_number": item.BatchNumber,
                "metric": item.metric,
                "initial_quantity_transferred": round(item.initial_quantity_transferred, 2),
                "total_quantity_sold": round(item.total_quantity_sold, 2),
                "purchase_value": round(item.purchase_value, 2),
                "total_amount_paid": round(total_paid_for_batch, 2),  # Total amount paid for this specific batch and shop
                "remaining_quantity": round(item.remaining_quantity, 2),
                "shop_id": item.shop_id
            })

        return jsonify(response)



class TotalFinancialSummary(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        today = datetime.utcnow()
        start_date = None
        end_date = None

        # Handle custom date range
        start_date_str = request.args.get('startDate')
        end_date_str = request.args.get('endDate')
        period = request.args.get('period', 'today')

        if start_date_str and end_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999)
            except ValueError:
                return {"message": "Invalid date format. Use YYYY-MM-DD."}, 400
        else:
            # Predefined period filters
            if period == 'today':
                start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = today.replace(hour=23, minute=59, second=59, microsecond=999999)
            elif period == 'yesterday':
                yesterday = today - timedelta(days=1)
                start_date = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)
            elif period == 'week':
                start_date = (today - timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = today.replace(hour=23, minute=59, second=59, microsecond=999999)
            elif period == 'month':
                start_date = (today - timedelta(days=30)).replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = today.replace(hour=23, minute=59, second=59, microsecond=999999)
            elif period == 'alltime':
                start_date = None
                end_date = None
            else:
                return {"message": "Invalid period specified"}, 400

        try:
            # ========== 1. Total Sales ========== 
            sales_query = (
                db.session.query(db.func.sum(SalesPaymentMethods.amount_paid))
                .join(Sales, Sales.sales_id == SalesPaymentMethods.sale_id)
            )
            if start_date and end_date:
                sales_query = sales_query.filter(Sales.created_at.between(start_date, end_date))
            total_sales = sales_query.scalar() or 0

            # ========== 2. Total Expenses ========== 
            expenses_query = db.session.query(db.func.sum(Expenses.amountPaid))
            if start_date and end_date:
                expenses_query = expenses_query.filter(Expenses.created_at.between(start_date, end_date))
            total_expenses = expenses_query.scalar() or 0

            # ========== 3. Total Inventory Purchases ========== 
            inventory_query = db.session.query(db.func.sum(Transfer.amountPaid))
            if start_date and end_date:
                inventory_query = inventory_query.filter(Transfer.created_at.between(start_date, end_date))
            total_inventory = inventory_query.scalar() or 0

            # ========== 4. Total Unsold Goods Value (Stock Table Only) ========== 
            remaining_stock_value = db.session.query(
                db.func.sum(ShopStock.quantity * Transfer.unitCost)
            ).join(Transfer, Transfer.transfer_id == ShopStock.transfer_id).scalar() or 0


            # ========== 5. Value of Sold Goods ========== 
            value_of_sold_goods = total_inventory - remaining_stock_value

            # ========== Format Response ========== 
            response = {
                "total_sales_amount_paid": "Ksh {:,.2f}".format(total_sales),
                "total_expenses_amount_paid": "Ksh {:,.2f}".format(total_expenses),
                "total_inventory_purchases_amount_paid": "Ksh {:,.2f}".format(total_inventory),
                "remaining_stock_value": "Ksh {:,.2f}".format(remaining_stock_value),
                "value_of_sold_goods": "Ksh {:,.2f}".format(value_of_sold_goods),
            }

            return response, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {
                "error": "An error occurred while fetching the financial summary.",
                "details": str(e)
            }, 500
