from app import db
from Server.Models.Accounting.SalesLedger import SalesLedger
from Server.Models.Accounting.CreditSalesLedger import CreditSalesLedger
from Server.Models.ChartOfAccounts import ChartOfAccounts
from Server.Models.Accounting.PurchaseLedger import PurchaseLedgerInventory,DistributionLedger
from Server.Models.InventoryV2 import InventoryV2
from Server.Models.TransferV2 import TransfersV2
from Server.Models.Accounting.SpoiltStockLedger import SpoiltStockLedger
from Server.Models.SpoiltStock import SpoiltStock


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
        Posts journal entries for sales using proper double-entry:
        - Paid → Cash DR, Revenue CR
        - Unpaid / Partial → A/R DR, Revenue CR
        """

        # ===== TOTAL SALE =====
        total_sale_amount = sum(float(item['total_price']) for item in sold_items)

        # ===== ACCOUNT LOOKUPS =====
        revenue_account = ChartOfAccounts.query.filter_by(type="Revenue").first()
        receivable_account = ChartOfAccounts.query.filter_by(name="Current Asset").first()
        cash_account = ChartOfAccounts.query.filter_by(name="Cash & Bank").first()

        if not revenue_account:
            raise Exception("Revenue account not found")

        created_at = sale.created_at

        # ==============================
        # PAID SALE
        # ==============================
        if sale.status == "paid":
            if not cash_account:
                raise Exception("Cash & Bank account not found")

            description = f"Cash sale #{sale.sales_id}"

            # DR: Cash
            debit_entry = SalesLedger(
                sales_id=sale.sales_id,
                description=description,
                debit_account_id=cash_account.id,
                credit_account_id=None,
                amount=total_sale_amount,
                shop_id=shop_id,
                created_at=created_at
            )

            # CR: Revenue
            credit_entry = SalesLedger(
                sales_id=sale.sales_id,
                description=description,
                debit_account_id=None,
                credit_account_id=revenue_account.id,
                amount=total_sale_amount,
                shop_id=shop_id,
                created_at=created_at
            )

            db.session.add_all([debit_entry, credit_entry])

            return {
                "journal_type": "sales",
                "journal_payload": {
                    "sales_id": sale.sales_id,
                    "status": sale.status,
                    "entries": [
                        {"type": "debit", "account": cash_account.name, "amount": total_sale_amount},
                        {"type": "credit", "account": revenue_account.name, "amount": total_sale_amount},
                    ]
                }
            }

        # ==============================
        # CREDIT / PARTIALLY PAID SALE
        # ==============================
        if sale.status in ["unpaid", "partially_paid"]:

            if not creditor_id:
                raise Exception("Creditor ID is required")

            if not receivable_account:
                raise Exception("Accounts Receivable account not found")

            journal_amount = (
                sale.balance
                if sale.status == "partially_paid"
                else total_sale_amount
            )

            description = f"Credit sale #{sale.sales_id}"

            # DR: Accounts Receivable
            debit_entry = CreditSalesLedger(
                sales_id=sale.sales_id,
                creditor_id=creditor_id,
                description=description,
                debit_account_id=receivable_account.id,
                credit_account_id=None,
                amount=journal_amount,
                shop_id=shop_id,
                created_at=created_at
            )

            # CR: Revenue
            credit_entry = CreditSalesLedger(
                sales_id=sale.sales_id,
                creditor_id=creditor_id,
                description=description,
                debit_account_id=None,
                credit_account_id=revenue_account.id,
                amount=journal_amount,
                shop_id=shop_id,
                created_at=created_at
            )

            db.session.add_all([debit_entry, credit_entry])

            return {
                "journal_type": "credit_sales",
                "journal_payload": {
                    "sales_id": sale.sales_id,
                    "status": sale.status,
                    "creditor_id": creditor_id,
                    "entries": [
                        {"type": "debit", "account": receivable_account.name, "amount": journal_amount},
                        {"type": "credit", "account": revenue_account.name, "amount": journal_amount},
                    ],
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

        amount = inventory.totalCost
        created_at = inventory.created_at

        # ===== DR: Inventory =====
        debit_entry = PurchaseLedgerInventory(
            inventory_id=inventory.inventoryV2_id,
            description=description,
            debit_account_id=debit_account.id,
            credit_account_id=None,
            amount=amount,
            created_at=created_at
        )

        # ===== CR: Cash / Payable =====
        credit_entry = PurchaseLedgerInventory(
            inventory_id=inventory.inventoryV2_id,
            description=description,
            debit_account_id=None,
            credit_account_id=credit_account.id,
            amount=amount,
            created_at=created_at
        )

        db.session.add_all([debit_entry, credit_entry])

        return {
            "journal_type": "purchase",
            "journal_payload": {
                "inventory_id": inventory.inventoryV2_id,
                "itemname": inventory.itemname,
                "batch_number": inventory.BatchNumber,
                "entries": [
                    {
                        "type": "debit",
                        "account": debit_account.name,
                        "amount": float(amount),
                    },
                    {
                        "type": "credit",
                        "account": credit_account.name,
                        "amount": float(amount),
                    }
                ],
                "created_at": created_at.isoformat(),
            }
        }



class DistributionJournalService:
    """
    Handles journal entries for inventory distribution (internal transfers).
    """
    @staticmethod
    def post_distribution_journal(
        transfer: TransfersV2,
        shop_id: int,
        debit_account_name: str = "Inventory",
        credit_account_name: str = "Inventory"
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

        amount = transfer.total_cost
        created_at = transfer.created_at

        # ===== DR: Inventory =====
        dr_entry = DistributionLedger(
            transfer_id=transfer.transferv2_id,
            description=description,
            debit_account_id=debit_account.id,
            credit_account_id=None,
            amount=amount,
            shop_id=shop_id,
            created_at=created_at
        )

        # ===== CR: Cash / Bank =====
        cr_entry = DistributionLedger(
            transfer_id=transfer.transferv2_id,
            description=description,
            debit_account_id=None,
            credit_account_id=credit_account.id,
            amount=amount,
            shop_id=shop_id,
            created_at=created_at
        )

        db.session.add_all([dr_entry, cr_entry])

        # ===== Return payload =====
        return {
            "journal_type": "distribution",
            "journal_payload": {
                "transfer_id": transfer.transferv2_id,
                "itemname": transfer.itemname,
                "batch_number": transfer.BatchNumber,
                "quantity": transfer.quantity,
                "entries": [
                    {"side": "DR", "account": debit_account.name, "amount": float(amount)},
                    {"side": "CR", "account": credit_account.name, "amount": float(amount)},
                ],
                "created_at": created_at.isoformat()
            }
        }



class SpoiltJournalService:
    """
    Handles journal entries for spoilt stock.
    """

    @staticmethod
    def post_spoilt_journal(spoilt: SpoiltStock):
        # ===== Account lookups =====
        expense_account = ChartOfAccounts.query.filter_by(
            name="Spoilage Expense"
        ).first()

        inventory_account = ChartOfAccounts.query.filter_by(
            name="Inventory"
        ).first()

        if not expense_account:
            raise Exception("Spoilage Expense account not found")

        if not inventory_account:
            raise Exception("Inventory account not found")

        # ===== Amount logic =====
        # If you later want valuation from inventory batches,
        # this is where you change it.
        amount = float(spoilt.quantity)

        description = f"Spoilt stock: {spoilt.item} ({spoilt.quantity} {spoilt.unit})"

        created_at = spoilt.approved_at or spoilt.created_at

        # ===== DR: Spoilage Expense =====
        dr_entry = SpoiltStockLedger(
            spoilt_id=spoilt.id,
            shop_id=spoilt.shop_id,
            description=description,
            debit_account_id=expense_account.id,
            credit_account_id=None,
            amount=amount,
            created_at=created_at
        )

        # ===== CR: Inventory =====
        cr_entry = SpoiltStockLedger(
            spoilt_id=spoilt.id,
            shop_id=spoilt.shop_id,
            description=description,
            debit_account_id=None,
            credit_account_id=inventory_account.id,
            amount=amount,
            created_at=created_at
        )

        db.session.add_all([dr_entry, cr_entry])

        return {
            "journal_type": "spoilt_stock",
            "journal_payload": {
                "spoilt_id": spoilt.id,
                "item": spoilt.item,
                "quantity": spoilt.quantity,
                "entries": [
                    {"side": "DR", "account": expense_account.name, "amount": amount},
                    {"side": "CR", "account": inventory_account.name, "amount": amount},
                ]
            }
        }
