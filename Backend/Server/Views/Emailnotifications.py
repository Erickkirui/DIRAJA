from flask_restful import Resource
from flask_mail import Mail, Message
from flask import jsonify, request
from datetime import datetime, timedelta
from app import db, mail
from Server.Models.Sales import Sales
from Server.Models.Expenses import Expenses
from Server.Models.Shops import Shops
from Server.Models.Paymnetmethods import SalesPaymentMethods
from flask_jwt_extended import jwt_required
from sqlalchemy.exc import SQLAlchemyError


# Email sending function (fixed to support multiple recipients)
def send_email(subject, body, recipients):
    try:
        msg = Message(subject, sender=mail.default_sender, recipients=recipients)
        msg.body = body
        mail.send(msg)
        print(f"Email sent successfully to {', '.join(recipients)}")  # Debugging
    except Exception as e:
        print(f"Failed to send email: {e}")  # Debugging


class Report(Resource):
    @jwt_required()
    def get(self):

        try:
            today = datetime.utcnow()
            start_date = None
            end_date = None

            # List of recipients
            recipients = ["erickkirui653@gmail.com", "Kibealex555@gmail.com"]

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
                    f"\nShop: {shop.shopname}\n"
                    f"Total Sales: {formatted_shop_sales}\n"
                    f"Total Expenses: {formatted_shop_expenses}\n"
                    "----------------------------"
                )

            # Construct a single email for all shops
            email_subject = "Financial Report for All Shops"
            email_body = (
                f"Hello,\n\n"
                f"Here is the consolidated financial summary for all shops:\n\n"
                f"🔹 **Overall Total Sales:** {formatted_sales}\n"
                f"🔹 **Overall Total Expenses:** {formatted_expenses}\n\n"
                "============================\n"
                "📌 **Shop-wise Breakdown:**\n"
                "============================\n"
                "{'\n'.join(shop_reports)}\n\n"

                "Best Regards,\nYour Business Team"

                "Best Regards,\n Your Business Team"


                "Best Regards,\nYour Business Team"

                "Best Regards,\n Your Business Team"

            )


            # Send the email to multiple recipients
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
