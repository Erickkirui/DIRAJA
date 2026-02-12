from app import db
from datetime import datetime

class SalesLedger(db.Model):
    __tablename__ = "sales_ledger"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # When the ledger entry was created
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Link to Sale
    sales_id = db.Column(
        db.Integer,
        db.ForeignKey("sales.sales_id"),
        nullable=False
    )
    sale = db.relationship("Sales", backref="ledger_entries")

    # Optional description
    description = db.Column(db.String(255), nullable=True)

    # Debit account (e.g. Cash & Bank, Accounts Receivable)
    debit_account_id = db.Column(
        db.Integer,
        db.ForeignKey("chart_of_accounts.id"),
        nullable=True
    )
    
    debit_account = db.relationship(
        "ChartOfAccounts",
        foreign_keys=[debit_account_id]
    )

    # Credit account (e.g. Revenue)
    credit_account_id = db.Column(
        db.Integer,
        db.ForeignKey("chart_of_accounts.id"),
        nullable=True
    )
    credit_account = db.relationship(
        "ChartOfAccounts",
        foreign_keys=[credit_account_id]
    )

    # Amount of the sale
    amount = db.Column(db.Float, nullable=False)

    # Shop where the sale happened
    shop_id = db.Column(
        db.Integer,
        db.ForeignKey("shops.shops_id"),
        nullable=False
    )
    shop = db.relationship("Shops")

    def __repr__(self):
        return (
            f"<SalesLedger sale_id={self.sales_id} "
            f"DR={self.debit_account_id} "
            f"CR={self.credit_account_id} "
            f"amount={self.amount}>"
        )
