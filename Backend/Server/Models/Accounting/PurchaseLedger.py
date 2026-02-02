from app import db
from datetime import datetime

class PurchaseLedgerInventory(db.Model):
    __tablename__ = "purchase_ledger_inventory"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # ✅ Link to InventoryV2
    inventory_id = db.Column(
        db.Integer,
        db.ForeignKey("inventoryV2.inventoryV2_id"),
        nullable=False
    )

    inventory = db.relationship(
        "InventoryV2",
        backref=db.backref("purchase_ledger_entries", lazy=True)
    )

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    description = db.Column(db.String(255), nullable=True)

    debit_account_id = db.Column(
        db.Integer,
        db.ForeignKey("chart_of_accounts.id"),
        nullable=False
    )
    debit_account = db.relationship(
        "ChartOfAccounts",
        foreign_keys=[debit_account_id]
    )

    credit_account_id = db.Column(
        db.Integer,
        db.ForeignKey("chart_of_accounts.id"),
        nullable=False
    )
    credit_account = db.relationship(
        "ChartOfAccounts",
        foreign_keys=[credit_account_id]
    )

    amount = db.Column(db.Float, nullable=False)

    def __repr__(self):
        return (
            f"<PurchaseLedgerInventory inventory_id={self.inventory_id} "
            f"DR={self.debit_account_id} "
            f"CR={self.credit_account_id} "
            f"amount={self.amount}>"
        )


class DistributionLedger(db.Model):
    __tablename__ = "distribution_ledger"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # Link to the transfer (instead of inventory)
    transfer_id = db.Column(
        db.Integer,
        db.ForeignKey("transfers_v2.transferv2_id"),
        nullable=False
    )
    transfer = db.relationship(
        "TransfersV2", 
        backref="distribution_ledgers"
    )

    # When the distribution was recorded
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Optional description
    description = db.Column(db.String(255), nullable=True)

    # Debit account
    debit_account_id = db.Column(
        db.Integer,
        db.ForeignKey("chart_of_accounts.id"),
        nullable=False
    )
    debit_account = db.relationship(
        "ChartOfAccounts",
        foreign_keys=[debit_account_id]
    )

    # Credit account
    credit_account_id = db.Column(
        db.Integer,
        db.ForeignKey("chart_of_accounts.id"),
        nullable=False
    )
    credit_account = db.relationship(
        "ChartOfAccounts",
        foreign_keys=[credit_account_id]
    )

    # Amount
    amount = db.Column(db.Float, nullable=False)

    # Shop
    shop_id = db.Column(
        db.Integer,
        db.ForeignKey("shops.shops_id"),
        nullable=False
    )
    shop = db.relationship("Shops")

    def __repr__(self):
        return (
            f"<DistributionLedger transfer_id={self.transfer_id} "
            f"DR={self.debit_account_id} "
            f"CR={self.credit_account_id} "
            f"amount={self.amount}>"
        )