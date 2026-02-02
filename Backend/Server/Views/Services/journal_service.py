from app import db
from Server.Models.Accounting.SalesLedger import SalesLedger
from Server.Models.Accounting.CreditSalesLedger import CreditSalesLedger
from Server.Models.ChartOfAccounts import ChartOfAccounts
from Server.Models.Accounting.PurchaseLedger import PurchaseLedgerInventory,DistributionLedger
from Server.Models.InventoryV2 import InventoryV2
from Server.Models.TransferV2 import TransfersV2

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
    

class PurchaseJournalService:
    """
    Service to handle journal entries for inventory purchases.
    """

    @staticmethod
    def post_purchase_journal(
        inventory: InventoryV2,
        debit_account_name: str = "Inventory",
        credit_account_name: str = "Cash & Bank"
    ):
        # ===== Account lookups =====
        debit_account = ChartOfAccounts.query.filter_by(name=debit_account_name).first()
        credit_account = ChartOfAccounts.query.filter_by(name=credit_account_name).first()

        if not debit_account:
            raise Exception(f"Debit account '{debit_account_name}' not found")

        if not credit_account:
            raise Exception(f"Credit account '{credit_account_name}' not found")

        # ===== Description =====
        description = f"Purchase of {inventory.itemname}, batch {inventory.BatchNumber}"

        # ===== Ledger entry =====
        ledger_entry = PurchaseLedgerInventory(
            inventory_id=inventory.inventoryV2_id,
            description=description,
            debit_account_id=debit_account.id,
            credit_account_id=credit_account.id,
            amount=inventory.totalCost,
            created_at=inventory.created_at
        )

        db.session.add(ledger_entry)

        return {
            "journal_type": "purchase",
            "journal_payload": {
                "inventory_id": inventory.inventoryV2_id,
                "itemname": inventory.itemname,
                "batch_number": inventory.BatchNumber,
                "debit": debit_account.name,
                "credit": credit_account.name,
                "amount": float(inventory.totalCost),
                "created_at": inventory.created_at.isoformat(),
            }
        }

    @staticmethod
    def get_all_journals():
        entries = (
            db.session.query(
                PurchaseLedgerInventory.id,
                PurchaseLedgerInventory.created_at,
                PurchaseLedgerInventory.description,
                PurchaseLedgerInventory.amount,
                ChartOfAccounts.name.label("debit_account_name"),
                InventoryV2.itemname,
                InventoryV2.BatchNumber
            )
            .join(InventoryV2, PurchaseLedgerInventory.inventory_id == InventoryV2.inventoryV2_id)
            .join(ChartOfAccounts, PurchaseLedgerInventory.debit_account_id == ChartOfAccounts.id)
            .all()
        )

        return [
            {
                "id": e.id,
                "created_at": e.created_at.isoformat(),
                "description": e.description,
                "itemname": e.itemname,
                "batch_number": e.BatchNumber,
                "debit_account": e.debit_account_name,
                "amount": float(e.amount)
            }
            for e in entries
        ]
    

class DistributionJournalService:
    """
    Handles journal entries for inventory distribution (internal transfers).
    """

    @staticmethod
    def post_distribution_journal(
        transfer: TransfersV2,
        shop_id: int,
        debit_account_name: str = "Inventory",
        credit_account_name: str = "Cash & Bank"
    ):
        # ===== Account lookups =====
        debit_account = ChartOfAccounts.query.filter_by(name=debit_account_name).first()
        credit_account = ChartOfAccounts.query.filter_by(name=credit_account_name).first()

        if not debit_account:
            raise Exception(f"Debit account '{debit_account_name}' not found")

        if not credit_account:
            raise Exception(f"Credit account '{credit_account_name}' not found")

        # ===== Description =====
        description = (
            f"Distribution of {transfer.itemname} "
            f"(Batch {transfer.BatchNumber}) "
            f"Qty {transfer.quantity}"
        )

        # ===== Ledger entry =====
        ledger_entry = DistributionLedger(
            transfer_id=transfer.transferv2_id,
            description=description,
            debit_account_id=debit_account.id,
            credit_account_id=credit_account.id,
            amount=transfer.total_cost,
            shop_id=shop_id,
            created_at=transfer.created_at
        )

        db.session.add(ledger_entry)

        # ===== Return payload =====
        return {
            "journal_type": "distribution",
            "journal_payload": {
                "transfer_id": transfer.transferv2_id,
                "itemname": transfer.itemname,
                "batch_number": transfer.BatchNumber,
                "quantity": transfer.quantity,
                "debit": debit_account.name,
                "credit": credit_account.name,
                "amount": float(transfer.total_cost),
                "created_at": transfer.created_at.isoformat()
            }
        }