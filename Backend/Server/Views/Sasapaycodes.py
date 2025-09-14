from flask import request, jsonify
from flask_restful import Resource
import csv
import io
from Server.Models.Paymnetmethods import SalesPaymentMethods
from Server.Models.SoldItems import SoldItem
from Server.Models.Sales import Sales
from app import db
from collections import defaultdict


class ProcessCSV(Resource):
    def post(self):
        if "file" not in request.files:
            return {"error": "No file uploaded"}, 400

        file = request.files["file"]

        if not file.filename.endswith(".csv"):
            return {"error": "Invalid file type. Please upload a CSV."}, 400

        stream = io.StringIO(file.stream.read().decode("utf-8"))
        csv_reader = csv.DictReader(stream)

        output = []
        # Track unique CSV transactions for totals
        csv_transactions_seen = set()
        total_csv_amount = 0
        total_csv_matched_amount = 0
        total_db_amount = 0
        
        # Track amounts by transaction code for CSV and DB
        csv_amounts_by_code = defaultdict(float)
        db_amounts_by_code = defaultdict(float)

        for row in csv_reader:
            csv_code = row.get("Transaction Code")
            csv_client = row.get("Client Name")
            csv_amount_str = row.get("Amount")

            if not csv_code:
                continue

            # Convert amount to float, handle potential errors
            try:
                csv_amount = float(csv_amount_str) if csv_amount_str else 0
            except ValueError:
                csv_amount = 0

            # Track CSV total (count each transaction code only once)
            if csv_code not in csv_transactions_seen:
                total_csv_amount += csv_amount
                csv_transactions_seen.add(csv_code)
            
            # Store CSV amount by code for matching
            csv_amounts_by_code[csv_code] = csv_amount

            last4 = csv_code[-4:]

            payments = (
                SalesPaymentMethods.query
                .filter(SalesPaymentMethods.transaction_code.like(f"%{last4}"))
                .all()
            )

            if payments:
                # Mark duplicate if more than one payment found
                is_duplicate = "yes" if len(payments) > 1 else "no"

                # For CSV matched total: only count this transaction once
                if csv_code not in [item.get('transaction_code_csv') for item in output if item.get('matched') == 'yes']:
                    total_csv_matched_amount += csv_amount

                for payment in payments:
                    sale_id = payment.sale_id
                    sold_items = SoldItem.query.filter_by(sales_id=sale_id).all()
                    sale = Sales.query.get(sale_id)

                    # Fetch username using relationship
                    username = sale.users.username if sale and sale.users else "Unknown User"

                    # Add to DB total (count all matching payments)
                    total_db_amount += payment.amount_paid
                    db_amounts_by_code[csv_code] += payment.amount_paid

                    if sold_items:
                        for item in sold_items:
                            output.append({
                                "transaction_code_csv": csv_code,
                                "client_name_csv": csv_client,
                                "amount_csv": csv_amount,
                                "matched": "yes",
                                "duplicate": is_duplicate,
                                "transaction_code_db": payment.transaction_code,
                                "amount_paid_db": payment.amount_paid,
                                "item": item.item_name,
                                "quantity": item.quantity,
                                "user_id": sale.user_id if sale else None,
                                "username": username,
                            })
                    else:
                        # Sale exists but no sold items
                        output.append({
                            "transaction_code_csv": csv_code,
                            "client_name_csv": csv_client,
                            "amount_csv": csv_amount,
                            "matched": "yes",
                            "duplicate": is_duplicate,
                            "transaction_code_db": payment.transaction_code,
                            "amount_paid_db": payment.amount_paid,
                            "item": None,
                            "quantity": None,
                            "user_id": sale.user_id if sale else None,
                            "username": username,
                        })
            else:
                output.append({
                    "transaction_code_csv": csv_code,
                    "client_name_csv": csv_client,
                    "amount_csv": csv_amount,
                    "matched": "no",
                    "duplicate": "no",
                    "transaction_code_db": None,
                    "amount_paid_db": None,
                    "item": None,
                    "quantity": None,
                    "user_id": None,
                    "username": None,
                })

        # Add summary information to the response
        response = {
            "transactions": output,
            "summary": {
                "total_csv_amount": round(total_csv_amount, 2),
                "total_csv_matched_amount": round(total_csv_matched_amount, 2),
                "total_db_amount": round(total_db_amount, 2),
                "total_csv_transactions": len(csv_transactions_seen),
                "total_matched_transactions": len(set([item['transaction_code_csv'] for item in output if item['matched'] == 'yes'])),
                "total_unmatched_transactions": len(set([item['transaction_code_csv'] for item in output if item['matched'] == 'no'])),
                "duplicate_transactions": len(set([item['transaction_code_csv'] for item in output if item['duplicate'] == 'yes']))
            }
        }

        return jsonify(response)