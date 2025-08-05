from flask_restful import Resource
from flask import request
from Server.Models.StockReport import StockReport
from Server.Models.Shops import Shops
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date
from app import db


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
