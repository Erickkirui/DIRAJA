from flask_restful import Resource
from flask import request
from sqlalchemy import func
from datetime import datetime
from flask_jwt_extended import jwt_required
from Server.Models.Accounting.ExpensesLedger import ExpensesLedger
from Server.Models.ExpenseCategory import ExpenseCategory
from Server.Models.Shops import Shops
from Server.Models.BankAccounts import BankAccount
from Server.Models.Accounting.CreditSalesLedger import CreditSalesLedger
from Server.Models.Accounting.ManualLedger import ManualLedger
from Server.Models.ChartOfAccounts import ChartOfAccounts
from app import db

class BalanceSheet(Resource):

    @jwt_required()
    def get(self):
        """
        Balance sheet showing:
        - Fixed Assets
        - Current Assets (Cash & Bank + Accounts Receivable)
        - Liabilities (Current + Equity & Long-Term)
        """
        end_date = request.args.get("end_date")
        shop_id = request.args.get("shop_id")

        try:
            # Use today if end_date not provided
            if not end_date:
                today = datetime.today()
                end_date = datetime.combine(today.date(), datetime.max.time())
            else:
                end_date = datetime.strptime(end_date, "%Y-%m-%d")
                end_date = datetime.combine(end_date.date(), datetime.max.time())

            if shop_id:
                shop_id = int(shop_id)
        except ValueError:
            return {"success": False, "message": "Invalid date format or shop_id"}, 400

        # Earliest transaction date
        earliest_expense = db.session.query(func.min(ExpensesLedger.created_at)).scalar()
        if not earliest_expense:
            earliest_shop = db.session.query(func.min(Shops.created_at)).scalar()
            earliest_expense = earliest_shop or datetime.now()
        start_date = earliest_expense

        # ----- Fixed Assets -----
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

        fixed_assets = []
        total_fixed_assets = 0
        for expense in expenses:
            amount = round(float(expense.total_amount or 0), 2)
            fixed_assets.append({
                "category": expense.category_name,
                "amount": amount,
                "transaction_count": expense.transaction_count
            })
            total_fixed_assets += amount

        # ----- Current Assets -----
        # Cash & Bank
        current_assets_query = db.session.query(
            func.sum(BankAccount.Account_Balance).label("total_balance")
        )
        if shop_id:
            current_assets_query = current_assets_query.filter(BankAccount.shop_id == shop_id)

        total_cash_bank = current_assets_query.scalar() or 0
        total_cash_bank = round(float(total_cash_bank), 2)

        current_assets = [
            {"account_name": "Cash and Bank", "balance": total_cash_bank}
        ]

        # Accounts Receivable
        receivable_query = db.session.query(
            func.sum(CreditSalesLedger.amount).label("total_receivable")
        ).filter(
            CreditSalesLedger.debit_account_id.isnot(None),
            CreditSalesLedger.credit_account_id.is_(None)
        )
        if shop_id:
            receivable_query = receivable_query.filter(CreditSalesLedger.shop_id == shop_id)

        total_receivable = receivable_query.scalar() or 0
        total_receivable = round(float(total_receivable), 2)

        current_assets.append({
            "account_name": "Accounts Receivable",
            "balance": total_receivable
        })

        # ----- Manual Ledger (Liabilities + Equity) -----
        manual_ledger = db.session.query(
            ManualLedger,
            ChartOfAccounts.type
        ).join(
            ChartOfAccounts,
            ((ManualLedger.debit_account_id == ChartOfAccounts.id) |
             (ManualLedger.credit_account_id == ChartOfAccounts.id))
        ).filter(
            ManualLedger.created_at <= end_date
        )

        if shop_id:
            manual_ledger = manual_ledger.filter(ManualLedger.shop_id == shop_id)

        # Initialize lists and totals
        current_liabilities_list = []
        equity_and_long_term_list = []
        total_current_liabilities = 0
        total_equity_and_long_term = 0

        for entry, account_type in manual_ledger:
            t = account_type.lower()
            if t in ["liability", "current liability"]:
                current_liabilities_list.append({
                    "account_name": entry.description or "Manual Entry",
                    "balance": entry.amount
                })
                total_current_liabilities += entry.amount
            elif t in ["equity", "long-term liability"]:
                equity_and_long_term_list.append({
                    "account_name": entry.description or "Manual Entry",
                    "balance": entry.amount
                })
                total_equity_and_long_term += entry.amount

        total_liabilities = round(total_current_liabilities + total_equity_and_long_term, 2)

        # ----- Compose Response -----
        response = {
            "success": True,
            "period": {
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d")
            },
            "assets": {
                "fixed_assets": fixed_assets,
                "current_assets": current_assets,
                "total_assets": round(total_fixed_assets + total_cash_bank + total_receivable, 2)
            },
            "liabilities": {
                "current_liabilities": current_liabilities_list,
                "equity_and_long_term_liabilities": equity_and_long_term_list,
                "total": total_liabilities
            }
        }

        if shop_id:
            shop = Shops.query.get(shop_id)
            if shop:
                response["shop"] = {'id': shop.id, 'name': shop.shopname}
        else:
            response["shops_count"] = Shops.query.count()

        return response, 200