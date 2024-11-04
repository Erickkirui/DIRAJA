from  flask_restful import Resource
from Server.Models.Customers import Customers
from Server.Models.Users import Users
from app import db
from functools import wraps
from flask import request,make_response,jsonify
from flask_jwt_extended import jwt_required,get_jwt_identity
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError



class AddCustomer(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()
        current_user_id = get_jwt_identity() 

        required_fields = [
            'customer_name',
            'customer_number',
            'shop_id',
            'item',
            'amount_paid',
            'payment_method'
        ]

        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return {
                'message': f"Missing fields: {', '.join(missing_fields)}"
            }, 400

        customer_name = data.get('customer_name')
        customer_number = data.get('customer_number')
        shop_id = data.get('shop_id')
        item = data.get('item')
        amount_paid = data.get('amount_paid')
        payment_method = data.get('payment_method')
         # Convert the 'created_at' string to a datetime object
        created_at = data.get('created_at')
        if created_at:
            created_at = datetime.strptime(created_at, '%Y-%m-%d')


        new_customer = Customers(
            customer_name=customer_name,
            customer_number=customer_number,
            shop_id=shop_id,
            user_id=current_user_id,
            item=item,
            amount_paid=amount_paid,
            payment_method=payment_method,
            created_at=created_at
        )

        db.session.add(new_customer)

        try:
            db.session.commit()
            return {
                'message': 'Customer added successfully',
                'customer_id': new_customer.customer_id
            }, 201
        except SQLAlchemyError as e:
            db.session.rollback()
            return {
                'error': 'An error occurred while adding the customer',
                'details': str(e)
            }, 500

class GetCustomersByShop(Resource):
    @jwt_required()
    def get(self, shop_id):
        try:
            # Query the Customers table for customers related to the given shop_id
            customers = Customers.query.filter_by(shop_id=shop_id).all()

            # Prepare the list of customer data
            customer_list = []
            for customer in customers:
                customer_data = {
                    "customer_id": customer.customer_id,
                    "customer_name": customer.customer_name,
                    "customer_number": customer.customer_number,
                    "shop_id": customer.shop_id,
                    "user_id": customer.user_id,
                    "item": customer.item,
                    "amount_paid": customer.amount_paid,
                    "payment_method": customer.payment_method,
                    "created_at": customer.created_at.strftime('%Y-%m-%d %H:%M:%S')  # Format datetime as string
                }
                customer_list.append(customer_data)

            # If no customers found for the shop
            if not customer_list:
                return jsonify({"message": "No customers found for this shop"}), 404

            return make_response(jsonify(customer_list), 200)
        
        except SQLAlchemyError as e:
            db.session.rollback()
            return jsonify({"error": "An error occurred while fetching customers"}), 500

class GetAllCustomers(Resource):
    @jwt_required()
    def get(self):
        try:
            customers = Customers.query.all()

            customer_list = []
            for customer in customers:
                customer_data = {
                    "customer_id": customer.customer_id,
                    "customer_name": customer.customer_name,
                    "customer_number": customer.customer_number,
                    "shop_id": customer.shop_id,
                    "user_id": customer.user_id,
                    "item": customer.item,
                    "amount_paid": customer.amount_paid,
                    "payment_method": customer.payment_method,
                    "created_at": customer.created_at
                }
                customer_list.append(customer_data)

            return make_response(jsonify(customer_list), 200)
        
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "An error occurred while fetching customers"}, 500

class GetCustomerById(Resource):
    
    @jwt_required()
    def get(self, customer_id):
        try:
            customer = Customers.query.get(customer_id)
            if not customer:
                return {"error": f"Customer with ID {customer_id} not found"}, 404

            customer_data = {
                "customer_id": customer.customer_id,
                "customer_name": customer.customer_name,
                "customer_number": customer.customer_number,
                "shop_id": customer.shop_id,
                "user_id": customer.user_id,
                "item": customer.item,
                "amount_paid": customer.amount_paid,
                "payment_method": customer.payment_method,
                "created_at": customer.created_at
            }

            return make_response(jsonify(customer_data), 200)
        
        except SQLAlchemyError as e:
            db.session.rollback()
            return {"error": "An error occurred while fetching the customer"}, 500
