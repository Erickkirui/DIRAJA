from app import db
from Server.Models.Accounting.SalesLedger import SalesLedger
from Server.Models.Accounting.CreditSalesLedger import CreditSalesLedger
from Server.Models.ChartOfAccounts import ChartOfAccounts


class JournalService:

    @staticmethod
    def post_sale_journal(
        sale,
        sold_items,
        shop_id,
        creditor_id=None,
        amount_paid=0
    ):
        """
        Posts journal entries for sales:
        - Paid → SalesLedger (Cash / Bank → Revenue)
        - Unpaid / Partially Paid → CreditSalesLedger (A/R → Revenue)
        """

        # ===== TOTAL SALE =====
        total_sale_amount = sum(float(item['total_price']) for item in sold_items)

        # ===== ACCOUNT LOOKUPS =====
        revenue_account = ChartOfAccounts.query.filter_by(type="Revenue").first()
        receivable_account = ChartOfAccounts.query.filter_by(name="Current Asset").first()
        cash_account = ChartOfAccounts.query.filter_by(name="Cash & Bank").first()

        if not revenue_account:
            raise Exception("Revenue account not found")

        # ==============================
        # PAID SALE → SALES LEDGER
        # ==============================
        if sale.status == "paid":
            if not cash_account:
                raise Exception("Cash & Bank account not found")

            description = f"Cash sale #{sale.sales_id}"

            ledger = SalesLedger(
                sales_id=sale.sales_id,
                description=description,
                debit_account_id=cash_account.id,
                credit_account_id=revenue_account.id,
                amount=total_sale_amount,
                shop_id=shop_id,
                created_at=sale.created_at
            )

            db.session.add(ledger)

            return {
                "journal_type": "sales",
                "journal_payload": {
                    "sales_id": sale.sales_id,
                    "status": sale.status,
                    "debit": cash_account.name,
                    "credit": revenue_account.name,
                    "amount": total_sale_amount
                }
            }

        # ==============================
        # CREDIT / PARTIAL SALE
        # ==============================
        if sale.status in ["unpaid", "partially_paid"]:

            if not creditor_id:
                raise Exception("Creditor ID is required")

            if not receivable_account:
                raise Exception("Accounts Receivable account not found")

            # Amount logic
            journal_amount = (
                sale.balance
                if sale.status == "partially_paid"
                else total_sale_amount
            )

            description = f"Credit sale #{sale.sales_id}"

            credit_ledger = CreditSalesLedger(
                sales_id=sale.sales_id,
                creditor_id=creditor_id,
                description=description,
                debit_account_id=receivable_account.id,
                credit_account_id=revenue_account.id,
                amount=journal_amount,
                shop_id=shop_id,
                created_at=sale.created_at
            )

            db.session.add(credit_ledger)

            return {
                "journal_type": "credit_sales",
                "journal_payload": {
                    "sales_id": sale.sales_id,
                    "status": sale.status,
                    "creditor_id": creditor_id,
                    "debit": receivable_account.name,
                    "credit": revenue_account.name,
                    "amount": journal_amount,
                    "balance": sale.balance
                }
            }

        raise Exception(f"Unsupported sale status: {sale.status}")
