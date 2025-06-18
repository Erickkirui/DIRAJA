from flask_restful import Resource
from flask_jwt_extended import jwt_required
from flask import request
from datetime import datetime
from app import db
from Server.Models.Users import Users
from Server.Models.SalesDepartment import SalesDepartment  # Make sure your model is imported
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import jsonify,request,make_response
from functools import wraps
from datetime import datetime, timedelta
from sqlalchemy.exc import SQLAlchemyError



def check_role(required_role):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = Users.query.get(current_user_id)
            if user and user.role != required_role:
                 return make_response( jsonify({"error": "Unauthorized access"}), 403 )       
            return fn(*args, **kwargs)
        return decorator
    return wrapper

class SalesdepartmentSale(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()

        try:
            new_sale = SalesDepartment(
                user_id=data['user_id'],
                shop_id=data['shop_id'],
                shop_sale_name=data['shop_sale_name'],  # ✅ Required now
                item_name=data['item_name'],  
                customer_name=data.get('customer_name'),
                customer_number=data.get('customer_number'),
                total_price=data['total_price'],
                created_at=datetime.strptime(data['created_at'], '%Y-%m-%d')
            )

            db.session.add(new_sale)
            db.session.commit()

            return {"message": "Sale added successfully"}, 201

        except KeyError as e:
            return {"error": f"Missing field: {str(e)}"}, 400

        except Exception as e:
            return {"error": str(e)}, 500


class GetSalesdepartmentSales(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        try:
            sales = SalesDepartment.query.all()
            sales_list = []

            for sale in sales:
                sales_list.append({
                    "departemntsale_id": sale.departemntsale_id,
                    "user_id": sale.user_id,
                    "shop_id": sale.shop_id,
                    "item_name": sale.item_name,  
                    "customer_name": sale.customer_name,
                    "customer_number": sale.customer_number,
                    "quantity": sale.quantity,
                    "total_price": sale.total_price,
                    "created_at": sale.created_at.strftime('%Y-%m-%d %H:%M:%S')
                })

            return {"sales": sales_list}, 200

        except Exception as e:
            return {"error": str(e)}, 500


class GetSalesDepartmentSalesByUser(Resource):
    @jwt_required()
    def get(self, user_id):
        try:
            sales = SalesDepartment.query.filter_by(user_id=user_id).all()
            if not sales:
                return {"message": f"No sales found for user_id {user_id}"}, 404

            sales_list = []
            for sale in sales:
                sales_list.append({
                    "departemntsale_id": sale.departemntsale_id,
                    "user_id": sale.user_id,
                    "shop_id": sale.shop_id,
                    "item_name": sale.item_name,
                    "customer_name": sale.customer_name,
                    "customer_number": sale.customer_number,
                    "quantity": sale.quantity,
                    "total_price": sale.total_price,
                    "created_at": sale.created_at.strftime('%Y-%m-%d %H:%M:%S')
                })

            return {"sales": sales_list}, 200

        except Exception as e:
            return {"error": str(e)}, 500
        
class TotalAmountDepartmentSales(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        try:
            date_str = request.args.get('date')
            period = request.args.get('period', 'today')
            today = datetime.utcnow()

            start_date_str = request.args.get('startDate')
            end_date_str = request.args.get('endDate')

            if start_date_str and end_date_str:
                try:
                    start_date = datetime.strptime(start_date_str, '%Y-%m-%d').replace(hour=0, minute=0, second=0)
                    end_date = datetime.strptime(end_date_str, '%Y-%m-%d').replace(hour=23, minute=59, second=59)
                except ValueError:
                    return {"message": "Invalid date format. Use YYYY-MM-DD."}, 400
            else:
                if period == 'today':
                    start_date = today.replace(hour=0, minute=0, second=0)
                    end_date = today.replace(hour=23, minute=59, second=59)
                elif period == 'yesterday':
                    yesterday = today - timedelta(days=1)
                    start_date = yesterday.replace(hour=0, minute=0, second=0)
                    end_date = yesterday.replace(hour=23, minute=59, second=59)
                elif period == 'week':
                    start_date = (today - timedelta(days=7)).replace(hour=0, minute=0, second=0)
                    end_date = today.replace(hour=23, minute=59, second=59)
                elif period == 'month':
                    start_date = (today - timedelta(days=30)).replace(hour=0, minute=0, second=0)
                    end_date = today.replace(hour=23, minute=59, second=59)
                elif period == 'alltime':
                    start_date = None
                    end_date = None
                else:
                    return {"message": "Invalid period specified"}, 400

            # Total for selected period
            query = db.session.query(db.func.sum(SalesDepartment.total_price))

            if start_date and end_date:
                query = query.filter(SalesDepartment.created_at.between(start_date, end_date))

            total_sales = query.scalar() or 0

            # All-time total
            all_time_total = (
                db.session.query(db.func.sum(SalesDepartment.total_price)).scalar() or 0
            )

            return {
                "total_department_sales": "Ksh {:,.2f}".format(total_sales),
                "all_time_total_department_sales": "Ksh {:,.2f}".format(all_time_total)
            }, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {
                "error": "Failed to retrieve totals",
                "details": str(e)
            }, 500
            
class TotalAmountDepartmentSalesByUser(Resource):
    @jwt_required()
    def get(self, user_id):
        try:
            period = request.args.get('period', 'today')
            start_date_str = request.args.get('startDate')
            end_date_str = request.args.get('endDate')
            today = datetime.utcnow()

            # Determine date filters
            if start_date_str and end_date_str:
                try:
                    start_date = datetime.strptime(start_date_str, '%Y-%m-%d').replace(hour=0, minute=0, second=0)
                    end_date = datetime.strptime(end_date_str, '%Y-%m-%d').replace(hour=23, minute=59, second=59)
                except ValueError:
                    return {"message": "Invalid date format. Use YYYY-MM-DD."}, 400
            else:
                if period == 'today':
                    start_date = today.replace(hour=0, minute=0, second=0)
                    end_date = today.replace(hour=23, minute=59, second=59)
                elif period == 'yesterday':
                    yesterday = today - timedelta(days=1)
                    start_date = yesterday.replace(hour=0, minute=0, second=0)
                    end_date = yesterday.replace(hour=23, minute=59, second=59)
                elif period == 'week':
                    start_date = (today - timedelta(days=7)).replace(hour=0, minute=0, second=0)
                    end_date = today.replace(hour=23, minute=59, second=59)
                elif period == 'month':
                    start_date = (today - timedelta(days=30)).replace(hour=0, minute=0, second=0)
                    end_date = today.replace(hour=23, minute=59, second=59)
                elif period == 'alltime':
                    start_date = None
                    end_date = None
                else:
                    return {"message": "Invalid period specified."}, 400

            # Query for user total within period
            query = db.session.query(db.func.sum(SalesDepartment.total_price)).filter(SalesDepartment.user_id == user_id)

            if start_date and end_date:
                query = query.filter(SalesDepartment.created_at.between(start_date, end_date))

            period_total = query.scalar() or 0

            # Query for all-time total for user
            all_time_total = (
                db.session.query(db.func.sum(SalesDepartment.total_price))
                .filter(SalesDepartment.user_id == user_id)
                .scalar() or 0
            )

            return {
                "user_id": user_id,
                "total_sales_for_period": "Ksh {:,.2f}".format(period_total),
                "all_time_total_sales": "Ksh {:,.2f}".format(all_time_total)
            }, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {
                "error": "An error occurred while fetching totals.",
                "details": str(e)
            }, 500