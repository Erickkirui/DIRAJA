from flask_sqlalchemy import SQLAlchemy
from app import db
from sqlalchemy.orm import validates
from sqlalchemy import func
from datetime import datetime
import string


class Inventory(db.Model):
    __tablename__ = "inventory"

    # Table columns
    inventory_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    itemname = db.Column(db.String(100), nullable=False)
    initial_quantity = db.Column(db.Integer)
    quantity = db.Column(db.Float, nullable=False)
    metric = db.Column(db.String)
    unitCost = db.Column(db.Float, nullable=False)
    totalCost = db.Column(db.Float, nullable=False)
    amountPaid = db.Column(db.Float, nullable=False)
    unitPrice = db.Column(db.Float, nullable=False)
    BatchNumber = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.users_id'))

    users = db.relationship('Users', backref='inventory', lazy=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    @staticmethod
    def generate_batch_code(itemname, created_at, batch_number):

        # Ensure created_at is a datetime object
        if isinstance(created_at, str):
            created_at = datetime.strptime(created_at, '%Y-%m-%d')

        # Extract the date from the 'created_at' field
        year = str(created_at.year)[-2:]  # Last two digits of the year
        month = f'{created_at.month:02d}'  # Two-digit month
        day = f'{created_at.day:02d}'  # Two-digit day

        # Sanitize item name to uppercase and remove spaces
        item_code = itemname.upper().replace(' ', '')

        # List of letters to cycle through (A-Z)
        letters = string.ascii_uppercase

        # Convert batch_number to integer to perform calculations
        batch_number = int(batch_number)

        # Determine the letter and the batch number based on batch_number
        batch_index = (batch_number - 1) // 100  # Changes letter every 100 numbers
        batch_letter = letters[batch_index % len(letters)]  # Cycle through letters if index exceeds alphabet

        # Calculate the batch number within the current letter range (1-100)
        display_batch_number = (batch_number + 1)

        # Create the unique batch code in the format ITEM-YYMMDD-LN
        batch_code = f"{item_code}-{year}{month}{day}-{batch_letter}{display_batch_number}"

        return batch_code

   

    def __repr__(self):
        return f"Inventory(id={self.inventory_id}, itemname='{self.itemname}', quantity={self.quantity}, BatchNumber='{self.BatchNumber}')"
