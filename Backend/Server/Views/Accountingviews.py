
# from flask_restful import Resource
# from Server.Models.Sales import Sales
# from Server.Models.Expenses import Expenses
# from Server.Models.Shops import Shops
# from app import db
# from flask_jwt_extended import jwt_required, get_jwt_identity
# from flask import jsonify, make_response
# from functools import wraps
# from sqlalchemy.exc import SQLAlchemyError
# from sqlalchemy import func
# from Server.Models.Users import Users
# import logging

# # Configure logging
# handler = logging.handlers.RotatingFileHandler('app.log', maxBytes=1000000, backupCount=5)
# handler.setLevel(logging.INFO)
# formatter = logging.Formatter('%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]')
# handler.setFormatter(formatter)
# logger = logging.getLogger(__name__)
# logger.addHandler(handler)

# # Reuse the check_role decorator
# def check_role(required_role):
#     def wrapper(fn):
#         @wraps(fn)
#         def decorator(*args, **kwargs):
#             current_user_id = get_jwt_identity()
#             user = Users.query.get(current_user_id)
#             if user and user.role != required_role:
#                 return make_response(jsonify({"error": "Unauthorized access"}), 403)
#             return fn(*args, **kwargs)
#         return decorator
#     return wrapper

# class ProfitLossPerShop(Resource):
#     @jwt_required()
#     @check_role('manager')
#     def get(self, shop_id):
#         """
#         Calculate Profit and Loss for a specific shop.
#         """
#         try:
#             # Total Revenue: Sum of Sales.total_price for the shop
#             total_revenue = db.session.query(func.sum(Sales.total_price)).filter_by(shop_id=shop_id).scalar()
#             total_revenue = float(total_revenue) if total_revenue else 0.0

#             # Total Expenses: Sum of Expenses.totalPrice for the shop
#             total_expenses = db.session.query(func.sum(Expenses.totalPrice)).filter_by(shop_id=shop_id).scalar()
#             total_expenses = float(total_expenses) if total_expenses else 0.0

#             # Calculate Profit
#             profit = total_revenue - total_expenses

#             logger.info(f"P&L for Shop ID {shop_id}: Revenue={total_revenue}, Expenses={total_expenses}, Profit={profit}")

#             return {
#                 "shop_id": shop_id,
#                 "total_revenue": total_revenue,
#                 "total_expenses": total_expenses,
#                 "profit": profit
#             }, 200

#         except SQLAlchemyError as e:
#             db.session.rollback()
#             logger.error(f"Database error in ProfitLossPerShop: {e}")
#             return {"error": "An error occurred while calculating profit and loss for the shop."}, 500


# class ProfitLossOverall(Resource):
#     @jwt_required()
#     @check_role('manager')
#     def get(self):
#         """
#         Calculate Profit and Loss for the entire business.
#         """
#         try:
#             # Total Revenue: Sum of all Sales.total_price
#             total_revenue = db.session.query(func.sum(Sales.total_price)).scalar()
#             total_revenue = float(total_revenue) if total_revenue else 0.0

#             # Total Expenses: Sum of all Expenses.totalPrice
#             total_expenses = db.session.query(func.sum(Expenses.totalPrice)).scalar()
#             total_expenses = float(total_expenses) if total_expenses else 0.0

#             # Calculate Profit
#             profit = total_revenue - total_expenses

#             logger.info(f"Overall P&L: Revenue={total_revenue}, Expenses={total_expenses}, Profit={profit}")

#             return {
#                 "total_revenue": total_revenue,
#                 "total_expenses": total_expenses,
#                 "profit": profit
#             }, 200

#         except SQLAlchemyError as e:
#             db.session.rollback()
#             logger.error(f"Database error in ProfitLossOverall: {e}")
#             return {"error": "An error occurred while calculating overall profit and loss."}, 500
