from app import db
from datetime import datetime


class ExpensesLedger(db.Model):
    __tablename__ = "expenses_ledger"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # When the ledger entry was created
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    expense_id = db.Column(
        db.Integer,
        db.ForeignKey("expenses.expense_id"),
        nullable=False
    )
    expense = db.relationship("Expenses", backref="expense_ledger_entries")
    
    category_id = db.Column(
        db.Integer,
        db.ForeignKey("expense_category.id"),
        nullable=False
    )
    category = db.relationship("ExpenseCategory", backref="expense_ledger_entries")

    # Debit account → Accounts Receivable
    debit_account_id = db.Column(
        db.Integer,
        db.ForeignKey("chart_of_accounts.id"),
        nullable=True
    )
    debit_account = db.relationship(
        "ChartOfAccounts",
        foreign_keys=[debit_account_id]
    )

    # Credit account → Revenue
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
        nullable=False
    )
    shop = db.relationship("Shops")
    
    amount = db.Column(db.Float, nullable=False)

    def __repr__(self):
        return (
            f"<ExpensesLedger expense_id={self.expense_id} "
            f"category_id={self.category_id} "
            f"DR={self.debit_account_id} "
            f"CR={self.credit_account_id} "
            f"amount={self.amount}>"
        )
