from flask_restful import Resource
from flask import request
from sqlalchemy import func
from datetime import datetime
from flask_jwt_extended import jwt_required
from Server.Models.Sales import Sales
from Server.Models.ChartOfAccounts import ChartOfAccounts
from Server.Models.Accounting.SalesLedger import SalesLedger
from Server.Models.Accounting.ExpensesLedger import ExpensesLedger
from Server.Models.ExpenseCategory import ExpenseCategory
from app import db
from Server.Models.SoldItems import SoldItem

class IncomeStatement(Resource):

    @jwt_required()
    def get(self):

        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        shop_id = request.args.get("shop_id")

        if not start_date or not end_date:
            return {
                "success": False,
                "message": "start_date and end_date required (YYYY-MM-DD)"
            }, 400

        try:
            start_date = datetime.strptime(start_date, "%Y-%m-%d")
            end_date = datetime.strptime(end_date, "%Y-%m-%d")
            # Only convert shop_id if provided
            if shop_id:
                shop_id = int(shop_id)
        except ValueError:
            return {
                "success": False,
                "message": "Invalid date format or shop_id. Use YYYY-MM-DD for dates and integer for shop_id"
            }, 400

        if start_date > end_date:
            return {
                "success": False,
                "message": "start_date cannot be greater than end_date"
            }, 400

        # ==========================================
        # REVENUE SECTION
        # ==========================================
        
        # Get ALL Revenue Accounts
        revenue_accounts = ChartOfAccounts.query.filter_by(
            type="Revenue"
        ).all()

        if not revenue_accounts:
            return {
                "success": False,
                "message": "No revenue accounts found"
            }, 404

        revenue_account_ids = [acc.id for acc in revenue_accounts]

        # Build Revenue Query
        revenue_query = db.session.query(
            SalesLedger.description,
            func.sum(SalesLedger.amount).label('total_amount')
        ).filter(
            SalesLedger.created_at.between(start_date, end_date),
            SalesLedger.credit_account_id.in_(revenue_account_ids)
        )

        # Add shop filter if shop_id is provided
        if shop_id:
            revenue_query = revenue_query.filter(SalesLedger.shop_id == shop_id)

        revenue_items = revenue_query.group_by(
            SalesLedger.description
        ).order_by(
            func.sum(SalesLedger.amount).desc()
        ).all()

        # Format revenue items
        revenue_list = []
        total_revenue = 0

        for item in revenue_items:
            description = item.description
            if description and description.startswith("Sales - "):
                description = description.replace("Sales - ", "Sales - ")
            
            amount = round(float(item.total_amount or 0), 2)
            
            revenue_list.append({
                "description": description,
                "amount": amount
            })
            total_revenue += amount

        # ==========================================
        # EXPENSES SECTION
        # ==========================================
        
        # Build Expenses Query
        expense_query = db.session.query(
            ExpenseCategory.category_name.label('category_name'),
            func.sum(ExpensesLedger.amount).label('total_amount')
        ).join(
            ExpenseCategory, ExpenseCategory.id == ExpensesLedger.category_id
        ).filter(
            ExpensesLedger.created_at.between(start_date, end_date)
        )

        # Add shop filter if shop_id is provided
        if shop_id:
            expense_query = expense_query.filter(ExpensesLedger.shop_id == shop_id)

        expense_items = expense_query.group_by(
            ExpenseCategory.id, ExpenseCategory.category_name
        ).order_by(
            func.sum(ExpensesLedger.amount).desc()
        ).all()

        # Format expense items
        expense_list = []
        total_expenses = 0

        for item in expense_items:
            amount = round(float(item.total_amount or 0), 2)
            
            expense_list.append({
                "category": item.category_name,
                "amount": amount
            })
            total_expenses += amount

        # ==========================================
        # CALCULATE NET INCOME
        # ==========================================
        net_income = total_revenue - total_expenses

        # Build response
        response = {
            "success": True,
            "period": {
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d")
            },
            "revenue": {
                "items": revenue_list,
                "total": total_revenue
            },
            "expenses": {
                "items": expense_list,
                "total": total_expenses
            },
            "net_income": net_income
        }

        # Add shop_id to response only if it was provided
        if shop_id:
            response["shop_id"] = shop_id
        else:
            response["scope"] = "all_shops"

        return response, 200