from  flask_restful import Resource
from app import db
from Server.Models.Inventory import Inventory
from Server.Models.Transfer import Transfer
from Server.Models.Users import Users
from Server.Models.Shops import Shops
from Server.Models.Shopstock import ShopStock
from Server.Models.Sales import Sales
from Server.Models.Employees import Employees
from Server.Models.Expenses import Expenses
from flask_jwt_extended import jwt_required,get_jwt_identity
from functools import wraps
from flask import jsonify,request,make_response
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
        # Get period from query parameters
        period = request.args.get('period', 'today')

        today = datetime.utcnow()
        
        # Set the start date based on the requested period
        if period == 'today':
            start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)  # Beginning of today
        elif period == 'week':
            start_date = today - timedelta(days=7)
        elif period == 'month':
            start_date = today - timedelta(days=30)
        else:
            return {"message": "Invalid period specified"}, 400

        try:
            # Query for the sum of `amount_paid` from `Sales` where `created_at` >= `start_date`
            total_sales = (
                db.session.query(db.func.sum(Sales.total_price))
                .filter(Sales.created_at >= start_date)
                .scalar() or 0
            )
            
            return {"total_sales_amount_paid": total_sales}, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "An error occurred while fetching the total sales amount"}, 500
        
        
class TotalAmountPaidSales(Resource):
        @jwt_required()
    # @check_role('manager')
        def get(self):
        # Get period and shop_id from query parameters
            period = request.args.get('period', 'today')
            shop_id = request.args.get('shop_id')

            # Validate shop_id
            if not shop_id:
                return {"message": "Shop ID is required"}, 400

            today = datetime.utcnow()
            
            # Set the start date based on the requested period
            if period == 'today':
                start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)  # Beginning of today
            elif period == 'week':
                start_date = today - timedelta(days=7)
            elif period == 'month':
                start_date = today - timedelta(days=30)
            else:
                return {"message": "Invalid period specified"}, 400

            try:
                # Query for the sum of `amountPaid` from `Sales` where `created_at` >= `start_date` and `shop_id` matches
                total_sales = (
                    db.session.query(db.func.sum(Sales.amount_paid))
                    .filter(Sales.created_at >= start_date, Sales.shop_id == shop_id)
                    .scalar() or 0
                )
                
                return {"total_sales_amount_paid": total_sales}, 200

            except SQLAlchemyError as e:
                db.session.rollback()
                return {"error": "An error occurred while fetching the total sales amount"}, 500
    

class TotalAmountPaidExpenses(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        period = request.args.get('period', 'today')
        today = datetime.utcnow()
        
        # Set the start date based on the requested period
        if period == 'today':
            start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)  # Beginning of today
        elif period == 'week':
            start_date = today - timedelta(days=7)
        elif period == 'month':
            start_date = today - timedelta(days=30)
        else:
            return {"message": "Invalid period specified"}, 400

        # Query for the sum of `amountPaid` from `Expenses` where `created_at` >= `start_date`
        total_amount = (
            db.session.query(db.func.sum(Expenses.amountPaid))
            .filter(Expenses.created_at >= start_date)
            .scalar() or 0
        )
        
        return {"total_amount_paid": total_amount}, 200


class TotalAmountPaidPurchases(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        period = request.args.get('period', 'today')
        today = datetime.utcnow()
        
        # Set the start date based on the requested period
        if period == 'today':
            start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)  # Beginning of today
        elif period == 'week':
            start_date = today - timedelta(days=7)
        elif period == 'month':
            start_date = today - timedelta(days=30)
        else:
            return {"message": "Invalid period specified"}, 400

        # Query for the sum of `amountPaid` from `Expenses` where `created_at` >= `start_date`
        total_amount = (
            db.session.query(db.func.sum(Transfer.amountPaid))
            .filter(Transfer.created_at >= start_date)
            .scalar() or 0
        )
        
        return {"total_amount_paid": total_amount}, 200
    


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
            return {"message": "Invalid period specified"}, 400

        try:
            # Query for all shop IDs
            shops = Shops.query.all()

            # Calculate total sales for each shop
            results = []
            for shop in shops:
                shop_id = shop.shops_id
                total_sales = (
                    db.session.query(db.func.sum(Sales.amount_paid))
                    .filter(Sales.created_at >= start_date, Sales.shop_id == shop_id)
                    .scalar() or 0
                )
                results.append({
                    "shop_id": shop_id,
                    "shop_name": shop.shopname,
                    "total_sales_amount_paid": total_sales
                })

            return {"total_sales_per_shop": results}, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "An error occurred while fetching total sales amounts for all shops"}, 500


class StockAlert(Resource):
    @jwt_required()
    def get(self):
        low_stock_threshold = 10
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



