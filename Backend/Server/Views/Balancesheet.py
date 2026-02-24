from flask_restful import Resource
from flask import request
from sqlalchemy import func
from datetime import datetime
from flask_jwt_extended import jwt_required
from Server.Models.Accounting.ExpensesLedger import ExpensesLedger
from Server.Models.ExpenseCategory import ExpenseCategory
from Server.Models.Shops import Shops
from app import db

class BalanceSheet(Resource):

    @jwt_required()
    def get(self):
        """
        Simple balance sheet showing cumulative expenses up to the selected end date.
        """
        end_date = request.args.get("end_date")
        shop_id = request.args.get("shop_id")

        if not end_date:
            return {
                "success": False,
                "message": "end_date required (YYYY-MM-DD)"
            }, 400

        try:
            end_date = datetime.strptime(end_date, "%Y-%m-%d")
            if shop_id:
                shop_id = int(shop_id)
        except ValueError:
            return {
                "success": False,
                "message": "Invalid date format or shop_id"
            }, 400

        # Get earliest transaction date
        earliest_expense = db.session.query(
            func.min(ExpensesLedger.created_at)
        ).scalar()
        
        if not earliest_expense:
            earliest_shop = db.session.query(
                func.min(Shops.created_at)
            ).scalar()
            earliest_expense = earliest_shop or datetime.now()

        start_date = earliest_expense

        # Simple query to get all expenses by category
        expenses = db.session.query(
            ExpenseCategory.category_name,
            func.sum(ExpensesLedger.amount).label('total_amount'),
            func.count(ExpensesLedger.id).label('transaction_count')
        ).join(
            ExpenseCategory, ExpenseCategory.id == ExpensesLedger.category_id
        ).filter(
            ExpensesLedger.created_at <= end_date
        )

        if shop_id:
            expenses = expenses.filter(ExpensesLedger.shop_id == shop_id)

        expenses = expenses.group_by(
            ExpenseCategory.id, ExpenseCategory.category_name
        ).order_by(
            func.sum(ExpensesLedger.amount).desc()
        ).all()

        # Format the results
        expense_list = []
        total_expenses = 0
        total_transactions = 0

        for expense in expenses:
            amount = round(float(expense.total_amount or 0), 2)
            expense_list.append({
                "category": expense.category_name,
                "amount": amount,
                "transaction_count": expense.transaction_count
            })
            total_expenses += amount
            total_transactions += expense.transaction_count

        # Get shop info if filtered
        shop_info = None
        if shop_id:
            shop = Shops.query.get(shop_id)
            if shop:
                shop_info = {
                    'id': shop.id,
                    'name': shop.shopname
                }

        response = {
            "success": True,
            "period": {
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d")
            },
            "summary": {
                "total_expenses": total_expenses,
                "total_transactions": total_transactions,
                "number_of_categories": len(expense_list)
            },
            "expenses": expense_list
        }

        if shop_info:
            response["shop"] = shop_info
        else:
            response["shops_count"] = Shops.query.count()

        return response, 200