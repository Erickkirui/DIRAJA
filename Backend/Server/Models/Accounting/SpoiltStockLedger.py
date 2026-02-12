from app import db
from datetime import datetime

class SpoiltStockLedger(db.Model):
    __tablename__ = "spoilt_stock_ledger"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # Link to spoilt stock record
    spoilt_id = db.Column(
        db.Integer,
        db.ForeignKey("spoilt.id"),
        nullable=False
    )
    spoilt = db.relationship(
        "SpoiltStock",
        backref=db.backref("ledger_entries", lazy=True)
    )

    # Shop (authoritative)
    shop_id = db.Column(
        db.Integer,
        db.ForeignKey("shops.shops_id"),
        nullable=False
    )
    shop = db.relationship("Shops")

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    description = db.Column(db.String(255), nullable=True)

    # Debit account (Expense)
    debit_account_id = db.Column(
        db.Integer,
        db.ForeignKey("chart_of_accounts.id"),
        nullable=True
    )
    debit_account = db.relationship(
        "ChartOfAccounts",
        foreign_keys=[debit_account_id]
    )

    # Credit account (Inventory)
    credit_account_id = db.Column(
        db.Integer,
        db.ForeignKey("chart_of_accounts.id"),
        nullable=True
    )
    credit_account = db.relationship(
        "ChartOfAccounts",
        foreign_keys=[credit_account_id]
    )

    amount = db.Column(db.Float, nullable=False)

    def __repr__(self):
        return (
            f"<SpoiltStockLedger spoilt_id={self.spoilt_id} "
            f"DR={self.debit_account_id} "
            f"CR={self.credit_account_id} "
            f"amount={self.amount}>"
        )
