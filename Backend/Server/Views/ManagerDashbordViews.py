from  flask_restful import Resource
from app import db
from Server.Models.Inventory import Inventory
from Server.Models.Transfer import Transfer
from Server.Models.Users import Users
from Server.Models.Paymnetmethods import SalesPaymentMethods
from Server.Models.Shops import Shops
from Server.Models.Shopstock import ShopStock
from Server.Models.Sales import Sales
from Server.Models.Employees import Employees
from Server.Models.Expenses import Expenses
from Server.Models.Transfer import Transfer
from flask_jwt_extended import jwt_required,get_jwt_identity
from functools import wraps
from flask import jsonify,request,make_response
from sqlalchemy.orm import aliased
from datetime import datetime, timedelta
from sqlalchemy.exc import SQLAlchemyError
from collections import defaultdict

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
    def get(self):
        today = datetime.utcnow()
        start_date = None
        end_date = None

        # First, check if a custom date is provided via the "date" parameter.
        date_str = request.args.get('date')
        if date_str:
            try:
                start_date = datetime.strptime(date_str, '%Y-%m-%d')
                # Set the range to cover the entire day.
                start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = start_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            except ValueError:
                return {"message": "Invalid date format. Use YYYY-MM-DD."}, 400
        else:
            # No custom date provided; use the period parameter (default to 'today').
            period = request.args.get('period', 'today')

            if period == 'today':
                start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)
            elif period == 'yesterday':
                yesterday_date = today - timedelta(days=1)
                start_date = yesterday_date.replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = yesterday_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            elif period == 'week':
                start_date = today - timedelta(days=7)
            elif period == 'month':
                start_date = today - timedelta(days=30)
            else:
                return {"message": "Invalid period specified"}, 400

        try:
            # Build the query to sum up the amount_paid.
            query = (
                db.session.query(db.func.sum(SalesPaymentMethods.amount_paid))
                .join(Sales, Sales.sales_id == SalesPaymentMethods.sale_id)
            )

            # If an end_date is defined (for custom date or yesterday), filter between start and end.
            if end_date:
                query = query.filter(Sales.created_at >= start_date, Sales.created_at <= end_date)
            else:
                query = query.filter(Sales.created_at >= start_date)

            total_sales = query.scalar() or 0

            # Format the total sales amount to 2 decimal places with a currency symbol.
            formatted_sales = "Ksh {:,.2f}".format(total_sales)
            
            return {"total_sales_amount_paid": formatted_sales}, 200

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
        else:
            return {"message": "Invalid period specified"}, 400

        try:
            # Adjust query to handle both cases: period (today, week, month) and specific date
            query = (
                db.session.query(db.func.sum(SalesPaymentMethods.amount_paid))
                .join(Sales, Sales.sales_id == SalesPaymentMethods.sale_id)
                .filter(Sales.shop_id == shop_id)
            )

            if period == 'date':
                query = query.filter(Sales.created_at >= start_date, Sales.created_at <= end_date)
            else:
                query = query.filter(Sales.created_at >= start_date)

            total_sales = query.scalar() or 0

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
        period = request.args.get('period', 'today')
        today = datetime.utcnow()

        # Define the start and end dates based on the period
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
        else:
            return {"message": "Invalid period specified"}, 400

        try:
            # Build query to sum the `amountPaid`
            query = db.session.query(db.func.sum(Expenses.amountPaid))

            # Filter based on the date range
            if end_date:
                query = query.filter(Expenses.created_at.between(start_date, end_date))
            else:
                query = query.filter(Expenses.created_at >= start_date)

            total_amount = query.scalar() or 0

            # Format the total amount with currency symbol
            formatted_amount = "Ksh {:,.2f}".format(total_amount)

            return {"total_amount_paid": formatted_amount}, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "An error occurred while fetching the total expenses amount"}, 500


class TotalAmountPaidPurchases(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        period = request.args.get('period', 'today')
        today = datetime.utcnow()

        # Define the start and end dates based on the period
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
        else:
            return {"message": "Invalid period specified"}, 400

        try:
            # Build query to sum the `amountPaid`
            query = db.session.query(db.func.sum(Transfer.amountPaid))

            # Filter based on the date range
            if end_date:
                query = query.filter(Transfer.created_at.between(start_date, end_date))
            else:
                query = query.filter(Transfer.created_at >= start_date)

            total_amount = query.scalar() or 0

            # Format the total amount with currency symbol
            formatted_amount = "Ksh {:,.2f}".format(total_amount)

            return {"total_amount_paid": formatted_amount}, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "An error occurred while fetching the total purchases amount"}, 500
    


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
        # Get the period from query parameters
        period = request.args.get('period', 'today')

        today = datetime.utcnow()

        # Set the start date based on the requested period
        if period == 'today':
            start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == 'week':
            start_date = today - timedelta(days=7)
        elif period == 'month':
            start_date = today - timedelta(days=30)
        else:
            return {"message": "Invalid period specified. Valid periods are 'today', 'week', or 'month'."}, 400

        try:
            # Query for all shop IDs
            shops = Shops.query.all()

            # Calculate total sales for each shop by summing the `amount_paid` from `SalesPaymentMethods`
            results = []
            for shop in shops:
                shop_id = shop.shops_id

                # Query to sum the `amount_paid` from the `SalesPaymentMethods` table for each shop
                # Query to sum the `amount_paid` from the `SalesPaymentMethods` table for a specific shop
                total_sales = (
                    db.session.query(db.func.sum(SalesPaymentMethods.amount_paid))
                    .join(Sales, Sales.sales_id == SalesPaymentMethods.sale_id)  # Join Sales to link sales_id
                    .filter(Sales.shop_id == shop_id, Sales.created_at >= start_date)  # Filter by shop_id and start_date
                    .scalar() or 0  # Default to 0 if no result
                )


             
                results.append({
                    "shop_id": shop_id,
                    "shop_name": shop.shopname,
                    "total_sales_amount_paid": total_sales
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
                shop_stock_items = db.session.query(ShopStock, Shops.shopname).join(Shops, Shops.shops_id == ShopStock.shop_id).filter(Shops.shopname == shop_name).all()
            else:
                shop_stock_items = db.session.query(ShopStock, Shops.shopname).join(Shops, Shops.shops_id == ShopStock.shop_id).all()

            # Create a dictionary to group items by shop and item name
            grouped_items = {}

            for stock, shopname in shop_stock_items:
                key = (shopname, stock.inventory.itemname)  # Use shop name and item name as the key
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
        except SQLAlchemyError:
            # Handle database query errors
            return {"error": "Unable to fetch shop stock data"}, 500

