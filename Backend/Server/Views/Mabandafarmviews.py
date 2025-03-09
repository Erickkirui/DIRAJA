from flask import jsonify,request,make_response
from Server.Models.Users import Users
from flask_restful import Resource
from Server.Models.Mabandafarm import db, MabandaStock, MabandaSale, MabandaPurchase, MabandaExpense
from flask_jwt_extended import jwt_required,get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from functools import wraps
from datetime import datetime, timedelta



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

class AddMabandaStock(Resource):
    @jwt_required()
    
    def post(self):
        data = request.get_json()
        new_stock = MabandaStock(
            itemname=data['itemname'],
            quantity=data['quantity'],
            price=data.get('price', 0),
            shop_id=12,
            date_added=datetime.strptime(data['date_added'], '%Y-%m-%d')
        )
        db.session.add(new_stock)
        db.session.commit()
        return {"message": "Stock added successfully"}, 201

class AddMabandaSale(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()

        new_sale = MabandaSale(
            itemname=data['itemname'],
            quantity_sold=data['quantity_sold'],
            amount_paid=data['amount_paid'],
            sale_date=datetime.strptime(data['sale_date'], '%Y-%m-%d'),
            mode_of_payment=data['mode_of_payment'],
            shop_id= 12  # Hardcoded shop_id to 2
        )

        db.session.add(new_sale)
        db.session.commit()
        return {"message": "Sale added successfully"}, 201



class AddMabandaPurchase(Resource):
    @jwt_required()
    
    def post(self):
        data = request.get_json()
        new_purchase = MabandaPurchase(
            itemname=data['itemname'],
            quantity=data['quantity'],
            price=data['price'],
            purchase_date=datetime.strptime(data['purchase_date'], '%Y-%m-%d'),
            shop_id=12
        )
        db.session.add(new_purchase)
        db.session.commit()
        return {"message": "Purchase added successfully"}, 201

class AddMabandaExpense(Resource):
    @jwt_required()
    
    def post(self):
        data = request.get_json()
        new_expense = MabandaExpense(
            description=data['description'],
            amount=data['amount'],
            expense_date=datetime.strptime(data['expense_date'], '%Y-%m-%d'),
            shop_id=12
        )
        db.session.add(new_expense)
        db.session.commit()
        return {"message": "Expense added successfully"}, 201
    

class MabandaStockResource(Resource):
    @jwt_required()
    def get(self):
        stocks = MabandaStock.query.filter_by(shop_id=12).all()  # Fetch sales for shop_id = 2
        
        if not stocks:
            return {"error": "No stock found for shop 12"}, 404

        return [
            {
                "itemname": stock.itemname,
                "quantity": stock.quantity,
                "price": stock.price,
                "date_added": stock.date_added.strftime('%Y-%m-%d')
            }
            for stock in stocks
        ], 200


    @jwt_required()
    @check_role('manager')
    def put(self, stock_id):
        data = request.get_json()
        stock = MabandaStock.query.get(stock_id)
        if stock:
            stock.itemname = data.get('itemname', stock.itemname)
            stock.quantity = data.get('quantity', stock.quantity)
            stock.price = data.get('price', stock.price)
            db.session.commit()
            return {"message": "Stock updated successfully"}, 200
        return {"error": "Stock not found"}, 404

    @jwt_required()
    @check_role('manager')
    def delete(self, stock_id):
        stock = MabandaStock.query.get(stock_id)
        if stock:
            db.session.delete(stock)
            db.session.commit()
            return {"message": "Stock deleted successfully"}, 200
        return {"error": "Stock not found"}, 404


class MabandaSaleResource(Resource):
    @jwt_required()
    def get(self):
        sales = MabandaSale.query.filter_by(shop_id=12).all()  # Fetch sales for shop_id = 2
        
        if not sales:
            return {"error": "No sales found for shop 12"}, 404

        return [
            {
                "itemname": sale.itemname,
                "quantity_sold": sale.quantity_sold,
                "amount_paid": sale.amount_paid,
                "sale_date": sale.sale_date.strftime('%Y-%m-%d'),
                "mode_of_payment": sale.mode_of_payment
            }
            for sale in sales
        ], 200

    @jwt_required()
    @check_role('manager')
    def put(self, mabandasale_id):
        data = request.get_json()
        sale = MabandaSale.query.get(mabandasale_id)
        if sale:
            sale.itemname = data.get('itemname', sale.itemname)
            sale.quantity_sold = data.get('quantity_sold', sale.quantity_sold)
            sale.amount_paid = data.get('amount_paid', sale.amount_paid)
            db.session.commit()
            return {"message": "Sale updated successfully"}, 200
        return {"error": "Sale not found"}, 404

    @jwt_required()
    @check_role('manager')
    def delete(self, mabandasale_id):
        sale = MabandaSale.query.get(mabandasale_id)
        if sale:
            db.session.delete(sale)
            db.session.commit()
            return {"message": "Sale deleted successfully"}, 200
        return {"error": "Sale not found"}, 404
    
    
class MabandaPurchaseResource(Resource):
    @jwt_required()
    def get(self):
        purchases = MabandaPurchase.query.filter_by(shop_id=12).all()  # Fetch sales for shop_id = 2
        
        if not purchases:
            return {"error": "No purchases found for shop 12"}, 404

        return [
            {
                "itemname": purchase.itemname,
                "quantity": purchase.quantity,
                "price": purchase.price,
                "purchase_date": purchase.purchase_date.strftime('%Y-%m-%d')
            }
            for purchase in purchases
        ], 200


    @jwt_required()
    @check_role('manager')
    def put(self, purchase_id):
        data = request.get_json()
        purchase = MabandaPurchase.query.get(purchase_id)
        if purchase:
            purchase.itemname = data.get('itemname', purchase.itemname)
            purchase.quantity = data.get('quantity', purchase.quantity)
            purchase.price = data.get('price', purchase.price)
            db.session.commit()
            return {"message": "Purchase updated successfully"}, 200
        return {"error": "Purchase not found"}, 404

    @jwt_required()
    @check_role('manager')
    def delete(self, purchase_id):
        purchase = MabandaPurchase.query.get(purchase_id)
        if purchase:
            db.session.delete(purchase)
            db.session.commit()
            return {"message": "Purchase deleted successfully"}, 200
        return {"error": "Purchase not found"}, 404
    
class MabandaExpenseResource(Resource):
    @jwt_required()
    def get(self):
        expenses = MabandaExpense.query.filter_by(shop_id=12).all()  # Fetch sales for shop_id = 2
        
        if not expenses:
            return {"error": "No sales found for shop 12"}, 404

        return [
            {
                "description": expense.description,
                "amount": expense.amount,
                "expense_date": expense.expense_date.strftime('%Y-%m-%d')
            }
            for expense in expenses
        ], 200


    @jwt_required()
    @check_role('manager')
    def put(self, expense_id):
        data = request.get_json()
        expense = MabandaExpense.query.get(expense_id)
        if expense:
            expense.description = data.get('description', expense.description)
            expense.amount = data.get('amount', expense.amount)
            db.session.commit()
            return {"message": "Expense updated successfully"}, 200
        return {"error": "Expense not found"}, 404

    @jwt_required()
    @check_role('manager')
    def delete(self, expense_id):
        expense = MabandaExpense.query.get(expense_id)
        if expense:
            db.session.delete(expense)
            db.session.commit()
            return {"message": "Expense deleted successfully"}, 200
        return {"error": "Expense not found"}, 404
    
    

class TotalAmountPaidSalesMabanda(Resource):
    @jwt_required()
    def get(self):
        # Get period from query parameters (default to 'today')
        period = request.args.get('period', 'today')

        today = datetime.utcnow().date()  # Ensure we work with dates only
        start_date = None

        # Set the start date based on the requested period
        if period == 'today':
            start_date = today
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
                start_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                return {"message": "Invalid date format. Use YYYY-MM-DD."}, 400
        else:
            return {"message": "Invalid period specified"}, 400

        try:
            # Query total amount paid for shop 12
            query = db.session.query(db.func.sum(MabandaSale.amount_paid)).filter(MabandaSale.shop_id == 12)

            if period == 'date':
                query = query.filter(MabandaSale.sale_date == start_date)
            else:
                query = query.filter(MabandaSale.sale_date >= start_date)

            total_sales = query.scalar() or 0

            # Format the total sales to 2 decimal places with commas
            formatted_sales = "{:,.2f}".format(total_sales)

            return {"total_sales_amount_paid": formatted_sales}, 200

        except SQLAlchemyError:
            db.session.rollback()
            return {"error": "An error occurred while fetching the total sales amount"}, 500
