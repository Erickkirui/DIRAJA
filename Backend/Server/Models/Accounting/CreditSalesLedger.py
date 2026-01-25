from app import db
from datetime import datetime


class CreditSalesLedger(db.Model):
    __tablename__ = "credit_sales_ledger"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # When the ledger entry was created
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Link to Sale
    sales_id = db.Column(
        db.Integer,
        db.ForeignKey("sales.sales_id"),
        nullable=False
    )
    sale = db.relationship("Sales", backref="credit_ledger_entries")

    # Creditor (customer who owes money)
    creditor_id = db.Column(
        db.Integer,
        db.ForeignKey("creditors.id"),
        nullable=False
    )
    creditor = db.relationship("Creditors")

    # Optional description
    description = db.Column(db.String(255), nullable=True)

    # Debit account → Accounts Receivable
    debit_account_id = db.Column(
        db.Integer,
        db.ForeignKey("chart_of_accounts.id"),
        nullable=False
    )
    debit_account = db.relationship(
        "ChartOfAccounts",
        foreign_keys=[debit_account_id]
    )
    balance = db.Column(db.Float, nullable=True)

    # Credit account → Revenue
    credit_account_id = db.Column(
        db.Integer,
        db.ForeignKey("chart_of_accounts.id"),
        nullable=False
    )
    credit_account = db.relationship(
        "ChartOfAccounts",
        foreign_keys=[credit_account_id]
    )

    # Amount owed
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
            f"<CreditSalesLedger sale_id={self.sales_id} "
            f"creditor_id={self.creditor_id} "
            f"DR={self.debit_account_id} "
            f"CR={self.credit_account_id} "
            f"amount={self.amount}>"
        )
