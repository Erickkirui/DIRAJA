from app import db
from datetime import datetime


class SalesLedger(db.Model):
    __tablename__ = "sales_ledger"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # ✅ IMPORTANT: ON DELETE CASCADE
    sales_id = db.Column(
        db.Integer,
        db.ForeignKey("sales.sales_id", ondelete="CASCADE"),
        nullable=False
    )

    description = db.Column(db.String(255), nullable=True)

    debit_account_id = db.Column(
        db.Integer,
        db.ForeignKey("chart_of_accounts.id"),
        nullable=True
    )

    credit_account_id = db.Column(
        db.Integer,
        db.ForeignKey("chart_of_accounts.id"),
        nullable=True
    )

    debit_account = db.relationship(
        "ChartOfAccounts",
        foreign_keys=[debit_account_id]
    )

    credit_account = db.relationship(
        "ChartOfAccounts",
        foreign_keys=[credit_account_id]
    )

    amount = db.Column(db.Float, nullable=False)

    shop_id = db.Column(
        db.Integer,
        db.ForeignKey("shops.shops_id"),
        nullable=False
    )

    shop = db.relationship("Shops")

    def __repr__(self):
        return (
            f"<SalesLedger sale_id={self.sales_id} "
            f"amount={self.amount}>"
        )
