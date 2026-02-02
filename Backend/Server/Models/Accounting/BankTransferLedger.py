from app import db
from datetime import datetime

class BankTransfersLedger(db.Model):
    __tablename__ = "bank_transfers_ledger"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # Link to the banking transaction
    bank_transaction_id = db.Column(
        db.Integer,
        db.ForeignKey("banking_transaction.id"),
        nullable=False
    )
    bank_transaction = db.relationship(
        "BankingTransaction", 
        backref="ledger_entries"
    )

    # When the transfer was recorded
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Optional description
    description = db.Column(db.String(255), nullable=True)

    # Debit account (e.g., Bank Account)
    debit_account_id = db.Column(
        db.Integer,
        db.ForeignKey("chart_of_accounts.id"),
        nullable=False
    )
    debit_account = db.relationship(
        "ChartOfAccounts",
        foreign_keys=[debit_account_id]
    )

    # Credit account (e.g., Cash Account)
    credit_account_id = db.Column(
        db.Integer,
        db.ForeignKey("chart_of_accounts.id"),
        nullable=False
    )
    credit_account = db.relationship(
        "ChartOfAccounts",
        foreign_keys=[credit_account_id]
    )

    # Amount of the transfer
    amount = db.Column(db.Float, nullable=False)

    def __repr__(self):
        return (
            f"<BankTransfersLedger bank_transaction_id={self.bank_transaction_id} "
            f"DR={self.debit_account_id} "
            f"CR={self.credit_account_id} "
            f"amount={self.amount}>"
        )