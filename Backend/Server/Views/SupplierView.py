from flask_restful import Resource
from Server.Models.Supplier import Suppliers  
from app import db
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError


class AddSupplier(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()
        current_user_id = get_jwt_identity()

        required_fields = [
            'supplier_name',
            'supplier_location'
        ]

        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return {
                'message': f"Missing fields: {', '.join(missing_fields)}"
            }, 400

        supplier_name = data.get('supplier_name')
        supplier_location = data.get('supplier_location')
        email = data.get('email')  # Optional
        phone_number = data.get('phone_number')  # Optional

        new_supplier = Suppliers(
            supplier_name=supplier_name,
            supplier_location=supplier_location,
            email=email,
            phone_number=phone_number
        )

        db.session.add(new_supplier)

        try:
            db.session.commit()
            return {
                'message': 'Supplier added successfully',
                'supplier_id': new_supplier.supplier_id
            }, 201
        except SQLAlchemyError as e:
            db.session.rollback()
            return {
                'error': 'An error occurred while adding the supplier',
                'details': str(e)
            }, 500


class GetAllSuppliers(Resource):
    @jwt_required()
    def get(self):
        try:
            suppliers = Suppliers.query.all()
            supplier_list = []

            for supplier in suppliers:
                supplier_list.append({
                    'supplier_id': supplier.supplier_id,
                    'supplier_name': supplier.supplier_name,
                    'supplier_location': supplier.supplier_location,
                    'total_amount_received': supplier.total_amount_received,
                    'email': supplier.email,
                    'phone_number': supplier.phone_number
                })

            return {'suppliers': supplier_list}, 200
        except Exception as e:
            return {
                'error': 'Failed to fetch suppliers',
                'details': str(e)
            }, 500
