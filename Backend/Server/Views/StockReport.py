from flask_restful import Resource
from flask import request
from Server.Models.StockReport import StockReport
from Server.Models.Shops import Shops
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date
from app import db
from sqlalchemy import func
from sqlalchemy.orm import joinedload



class SubmitStockReport(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()

        user_id = get_jwt_identity()
        shop_id = data.get('shop_id')
        report_data = data.get('report')  # JSON report
        comment = data.get('note', '')

        if not shop_id or not report_data:
            return {'message': 'shop_id and report data are required'}, 400

        # ✅ Check shop existence
        shop = Shops.query.filter_by(shops_id=shop_id).first()
        if not shop:
            return {'message': 'Shop not found'}, 404

        # ✅ Check if a report has already been submitted (today) based on report_status
        if shop.report_status:
            return {'message': 'Stock report already submitted today'}, 400

        # Optional: Extract comment from differences
        if not comment:
            differences = report_data.get("differences", {})
            for item in differences.values():
                reason = item.get("reason")
                if reason:
                    comment = reason
                    break

        # ✅ Create the StockReport
        report = StockReport(
            shop_id=shop_id,
            user_id=user_id,
            report=report_data,
            comment=comment
        )

        # ✅ Mark the shop as reported for today
        shop.report_status = True

        db.session.add(report)
        db.session.commit()

        return {'message': 'Stock report submitted successfully'}, 201



class ResetShopReportStatus(Resource):
    def put(self):
        # Reset all report_status to False
        Shops.query.update({Shops.report_status: False})
        db.session.commit()
        return {'message': 'All shop report statuses have been reset to False'}, 200

class GetStockReports(Resource):
    @jwt_required()
    def get(self):
        # Get query parameters
        shop_id = request.args.get('shop_id')
        user_id = request.args.get('user_id')
        date = request.args.get('date')  # Expected format: YYYY-MM-DD
        limit = request.args.get('limit', default=10, type=int)
        
        # Base query
        query = StockReport.query
        
        # Apply filters
        if shop_id:
            query = query.filter_by(shop_id=shop_id)
        if user_id:
            query = query.filter_by(user_id=user_id)
        if date:
            query = query.filter(func.DATE(StockReport.reported_at) == date)
        
        # Order and limit
        reports = query.order_by(StockReport.reported_at.desc()).limit(limit).all()
        
        # Format response
        result = []
        for report in reports:
            result.append({
                'id': report.id,
                'shop_id': report.shop_id,
                'user_id': report.user_id,
                'report': report.report,
                'comment': report.comment,
                'reported_at': report.reported_at.isoformat(),
                'shop_name': report.shop.shopname if report.shop else None,
                'user_name': report.user.username if report.user else None
            })
        
        return {'reports': result}, 200

class GetStockReportById(Resource):
    @jwt_required()
    def get(self, report_id):
        report = (
            StockReport.query
            .options(joinedload(StockReport.shop), joinedload(StockReport.user))
            .filter_by(id=report_id)
            .first()
        )

        if not report:
            return {"message": "Stock report not found"}, 404

        return {
            'id': report.id,
            'shop_id': report.shop_id,
            'user_id': report.user_id,
            'report': report.report,
            'comment': report.comment,
            'reported_at': report.reported_at.isoformat(),
            'shop_name': report.shop.shopname if report.shop else None,
            'user_name': report.user.username if report.user else None
        }, 200