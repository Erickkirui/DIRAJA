from app import db
from datetime import datetime


class ManualLedger(db.Model):
    __tablename__ = "manual_ledger"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # When the ledger entry was created
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Description of the manual entry
    description = db.Column(db.String(255), nullable=True)

    # Debit account
    debit_account_id = db.Column(
        db.Integer,
        db.ForeignKey("chart_of_accounts.id"),
        nullable=True
    )
    debit_account = db.relationship(
        "ChartOfAccounts",
        foreign_keys=[debit_account_id]
    )

    # Credit account
    credit_account_id = db.Column(
        db.Integer,
        db.ForeignKey("chart_of_accounts.id"),
        nullable=True
    )
    credit_account = db.relationship(
        "ChartOfAccounts",
        foreign_keys=[credit_account_id]
    )

    shop_id = db.Column(
        db.Integer,
        db.ForeignKey("shops.shops_id"),
        nullable=True
    )
    shop = db.relationship("Shops")

    amount = db.Column(db.Float, nullable=False)

    def __repr__(self):
        return (
            f"<ManualLedger id={self.id} "
            f"description='{self.description}' "
            f"DR={self.debit_account_id} "
            f"CR={self.credit_account_id} "
            f"amount={self.amount}>"
        )