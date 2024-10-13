
from datetime import datetime, timedelta
import calendar
from Server.Models.Expenses import Expenses
from Server.Models.Sales import Sales

def get_expenses_filtered(filter_type, current_time=None):
    """
    Returns a SQLAlchemy query filtered by the specified filter_type.
    
    :param filter_type: One of 'today', 'week', 'month'
    :param current_time: The current datetime, defaults to UTC now
    :return: Filtered SQLAlchemy query
    """
    if current_time is None:
        current_time = datetime.utcnow()

    if filter_type == 'today':
        start_of_day = current_time.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = current_time.replace(hour=23, minute=59, second=59, microsecond=999999)
        return Expenses.query.filter(Expenses.created_at >= start_of_day, Expenses.created_at <= end_of_day)
    
    elif filter_type == 'week':
        start_of_week = current_time - timedelta(days=current_time.weekday())  # Monday
        start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_week = start_of_week + timedelta(days=6, hours=23, minutes=59, seconds=59, microseconds=999999)
        return Expenses.query.filter(Expenses.created_at >= start_of_week, Expenses.created_at <= end_of_week)
    
    elif filter_type == 'month':
        start_of_month = current_time.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_day = calendar.monthrange(current_time.year, current_time.month)[1]
        end_of_month = current_time.replace(day=last_day, hour=23, minute=59, second=59, microsecond=999999)
        return Expenses.query.filter(Expenses.created_at >= start_of_month, Expenses.created_at <= end_of_month)
    
    else:
        # If an invalid filter_type is provided, return all expenses
        return Expenses.query



def serialize_expenses(expenses):
    """
    Serializes a list of expense objects into dictionaries.
    """
    return [{
        "expense_id": expense.expense_id,
        "user_id": expense.user_id,
        "shop_id": expense.shop_id,
        "item": expense.item,
        "description": expense.description,
        "quantity": expense.quantity,
        "totalPrice": expense.totalPrice,
        "amountPaid": expense.amountPaid,
        "created_at": expense.created_at.strftime('%Y-%m-%d %H:%M:%S') if expense.created_at else None
    } for expense in expenses]



#Sales filter
def get_sales_filtered(filter_type, current_time=None):
    """
    Returns a SQLAlchemy query filtered by the specified filter_type.
    
    :param filter_type: One of 'today', 'week', 'month'
    :param current_time: The current datetime, defaults to UTC now
    :return: Filtered SQLAlchemy query
    """
    if current_time is None:
        current_time = datetime.utcnow()

    if filter_type == 'today':
        start_of_day = current_time.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = current_time.replace(hour=23, minute=59, second=59, microsecond=999999)
        return Sales.query.filter(Sales.created_at >= start_of_day, Sales.created_at <= end_of_day)
    
    elif filter_type == 'week':
        start_of_week = current_time - timedelta(days=current_time.weekday())  # Monday
        start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_week = start_of_week + timedelta(days=6, hours=23, minutes=59, seconds=59, microseconds=999999)
        return Sales.query.filter(Sales.created_at >= start_of_week, Sales.created_at <= end_of_week)
    
    elif filter_type == 'month':
        start_of_month = current_time.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_day = calendar.monthrange(current_time.year, current_time.month)[1]
        end_of_month = current_time.replace(day=last_day, hour=23, minute=59, second=59, microsecond=999999)
        return Sales.query.filter(Sales.created_at >= start_of_month, Sales.created_at <= end_of_month)
    
    else:
        # If an invalid filter_type is provided, return all sales
        return Sales.query
    

def serialize_sales(sales):
    """
    Serializes a list of expense objects into dictionaries.
    """
    return [{
        "sale_id": sale.sale_id,
        "user_id": sale.user_id,
        "shop_id": sale.shop_id,
        "customer_name": sale.customer_name,
        "status": sale.status,
        "customer_number": sale.customer_number,
        "item_name": sale.item_name,
        "quanity": sale.quantity,
        "metric": sale.metric,
        "unit_price": sale.unit_price,
        "amount_paid": sale.amount_paid,
        "total_price": sale.toal_price,
        "payment_method": sale.paymentmethod,
        "created_at": sale.created_at.strftime('%Y-%m-%d %H:%M:%S') if sale.created_at else None
    } for sale in sales]
    
