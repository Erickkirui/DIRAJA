from app import db

class ChartOfAccounts(db.Model):
    __tablename__ = 'chart_of_accounts'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(10), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    type = db.Column(db.String(50), nullable=False)

    def __str__(self):
        return f"ChartOfAccounts(id={self.id}, code='{self.code}', name='{self.name}')"
 