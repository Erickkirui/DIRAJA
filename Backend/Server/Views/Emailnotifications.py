from flask_mail import Mail, Message
from flask import jsonify, request
from  flask_restful import Resource
from datetime import datetime, timedelta
from app import db, mail
from Server.Models.Sales import Sales
from Server.Models.Expenses import Expenses
from Server.Models.Shops import Shops
from Server.Models.Paymnetmethods import SalesPaymentMethods

from sqlalchemy.exc import SQLAlchemyError

# Email sending function (fixed to support multiple recipients)
def send_email(subject, body, recipients):
    try:
        msg = Message(subject, sender=mail.default_sender, recipients=recipients)
        msg.html = body  # Set the body as HTML
        mail.send(msg)
        print(f"Email sent successfully to {', '.join(recipients)}")  # Debugging
    except Exception as e:
        print(f"Failed to send email: {e}")  # Debugging


class Report(Resource):
    def get(self):
        try:
            today = datetime.utcnow()
            start_date = None
            end_date = None

            # List of recipients
            recipients = ["erickkirui653@gmail.com"]

            date_str = request.args.get('date')
            if date_str:
                try:
                    start_date = datetime.strptime(date_str, '%Y-%m-%d')
                    start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
                    end_date = start_date.replace(hour=23, minute=59, second=59, microsecond=999999)
                except ValueError:
                    return {"message": "Invalid date format. Use YYYY-MM-DD."}, 400
            else:
                period = request.args.get('period', 'today')

                if period == 'today':
                    start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)
                    end_date = today.replace(hour=23, minute=59, second=59, microsecond=999999)
                elif period == 'yesterday':
                    yesterday_date = today - timedelta(days=1)
                    start_date = yesterday_date.replace(hour=0, minute=0, second=0, microsecond=0)
                    end_date = yesterday_date.replace(hour=23, minute=59, second=59, microsecond=999999)
                elif period == 'week':
                    start_date = today - timedelta(days=7)
                    end_date = today.replace(hour=23, minute=59, second=59, microsecond=999999)
                elif period == 'month':
                    start_date = today - timedelta(days=30)
                    end_date = today.replace(hour=23, minute=59, second=59, microsecond=999999)
                else:
                    return {"message": "Invalid period specified"}, 400

            # Calculate total sales
            total_sales_query = (
                db.session.query(db.func.sum(SalesPaymentMethods.amount_paid))
                .join(Sales, Sales.sales_id == SalesPaymentMethods.sale_id)
            )

            if start_date and end_date:
                total_sales_query = total_sales_query.filter(Sales.created_at.between(start_date, end_date))
            elif start_date:
                total_sales_query = total_sales_query.filter(Sales.created_at >= start_date)

            total_sales = total_sales_query.scalar() or 0
            formatted_sales = "Ksh {:,.2f}".format(total_sales)

            # Calculate total expenses
            total_expenses_query = db.session.query(db.func.sum(Expenses.totalPrice))
            if start_date and end_date:
                total_expenses_query = total_expenses_query.filter(Expenses.created_at.between(start_date, end_date))
            elif start_date:
                total_expenses_query = total_expenses_query.filter(Expenses.created_at >= start_date)

            total_expenses = total_expenses_query.scalar() or 0
            formatted_expenses = "Ksh {:,.2f}".format(total_expenses)

            # Aggregate shop-specific reports
            shop_reports = []
            shops = Shops.query.all()
            for shop in shops:
                shop_sales_query = (
                    db.session.query(db.func.sum(SalesPaymentMethods.amount_paid))
                    .join(Sales, Sales.sales_id == SalesPaymentMethods.sale_id)
                    .filter(Sales.shop_id == shop.shops_id)
                )
                if start_date and end_date:
                    shop_sales_query = shop_sales_query.filter(Sales.created_at.between(start_date, end_date))
                elif start_date:
                    shop_sales_query = shop_sales_query.filter(Sales.created_at >= start_date)
                shop_sales = shop_sales_query.scalar() or 0

                shop_expenses_query = db.session.query(db.func.sum(Expenses.totalPrice)).filter(Expenses.shop_id == shop.shops_id)
                if start_date and end_date:
                    shop_expenses_query = shop_expenses_query.filter(Expenses.created_at.between(start_date, end_date))
                elif start_date:
                    shop_expenses_query = shop_expenses_query.filter(Expenses.created_at >= start_date)
                shop_expenses = shop_expenses_query.scalar() or 0

                formatted_shop_sales = "Ksh {:,.2f}".format(shop_sales)
                formatted_shop_expenses = "Ksh {:,.2f}".format(shop_expenses)

                shop_reports.append(
                    f"""
                    <div style="border: 1px solid #ddd; padding: 10px; width: 100%; box-sizing: border-box; text-align: left; background-color: #f9f9f9; border-radius: 8px; margin-bottom: 10px;">
                        <h3 style="margin-top: 0;">{shop.shopname}</h3>
                        <p><strong>Sales:</strong> <br>{formatted_shop_sales}</p>
                        <p><strong>Expense:</strong> <br> {formatted_shop_expenses}</p>
                    </div>
                    """
                )

            # Construct the email body with inline CSS
            email_subject = "Financial Report for All Shops"
            email_body = f"""
                        <html>
                        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; border: 1px solid #ccc; border-radius: 8px; style="max-width: 650px;">
                            <div style="max-width: 650px; margin: 0 auto; ">
                                <div style="padding: 20px; background-color: #f4f4f4; border-bottom: 2px solid #ddd;">
                                    <h2 style="margin-bottom: 10px;">Financial Summary</h2>
                                    <div style="margin-bottom: 20px;">
                                        <strong>Total Sales:</strong> {formatted_sales} &nbsp;&nbsp; <strong>Total Expenses:</strong> {formatted_expenses}
                                    </div>
                                </div>

                                <div style="padding: 20px; background-color: #fff; max-width: 600px; margin: 0 auto; box-sizing: border-box;">
                                                <h3 style="margin-bottom: 10px; text-align: center;">Shop-wise Breakdown:</h3>
                                                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; padding: 10px;">
                                                    {''.join(shop_reports)}
                                                </div>
                        </div>


                                <div style="padding: 20px; background-color: #fff; border-top: 2px solid #ddd;">
                                    <h3 style="margin-bottom: 10px;">Overall Totals</h3>
                                    <div>
                                        <strong>Total Sales:</strong> {formatted_sales}<br>
                                        <strong>Total Expenses:</strong> {formatted_expenses}
                                    </div>
                                </div>

                                <div style="padding: 20px; text-align: center; background-color: #f4f4f4;">
                                    <p>Best Regards,<br>DIRAJA SYSTEM</p>
                                </div>
                            </div>
                        </body>
                        </html>
                        """





            # Send the email with HTML body
            send_email(email_subject, email_body, recipients)

            return jsonify({
                "message": "Daily consolidated report sent successfully.",
                "total_sales": formatted_sales,
                "total_expenses": formatted_expenses,
                "shop_reports": shop_reports
            })

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "An error occurred while fetching the financial report", "details": str(e)}, 500
