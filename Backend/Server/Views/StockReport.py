from flask_restful import Resource
from flask import request
from Server.Models.StockReport import StockReport
from Server.Models.Shops import Shops
from flask_jwt_extended import jwt_required, get_jwt_identity
from Server.Models.ShopstockV2 import ShopStockV2
from Server.Models.Users import Users
from Server.Models.StockReconciliation import StockReconciliation
from datetime import datetime
from app import db
from sqlalchemy import func
from sqlalchemy.orm import joinedload
import re



# class SubmitStockReport(Resource):
#     @jwt_required()
#     def post(self):
#         data = request.get_json()

#         user_id = get_jwt_identity()
#         shop_id = data.get('shop_id')
#         report_data = data.get('report')  # JSON report
#         comment = data.get('note', '')

#         if not shop_id or not report_data:
#             return {'message': 'shop_id and report data are required'}, 400

#         # ✅ Check shop existence
#         shop = Shops.query.filter_by(shops_id=shop_id).first()
#         if not shop:
#             return {'message': 'Shop not found'}, 404

#         # ✅ Check if a report has already been submitted (today) based on report_status
#         if shop.report_status:
#             return {'message': 'Stock report already submitted today'}, 400

#         # Optional: Extract comment from differences
#         if not comment:
#             differences = report_data.get("differences", {})
#             for item in differences.values():
#                 reason = item.get("reason")
#                 if reason:
#                     comment = reason
#                     break

#         # ✅ Create the StockReport
#         report = StockReport(
#             shop_id=shop_id,
#             user_id=user_id,
#             report=report_data,
#             comment=comment
#         )

#         # ✅ Mark the shop as reported for today
#         shop.report_status = True

#         db.session.add(report)
#         db.session.commit()

#         return {'message': 'Stock report submitted successfully'}, 201


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

        try:
            # Start transaction
            db.session.begin_nested()

            # ✅ Create the StockReport
            report = StockReport(
                shop_id=shop_id,
                user_id=user_id,
                report=report_data,
                comment=comment
            )

            db.session.add(report)
            
            # ✅ Mark the shop as reported for today
            shop.report_status = True

            # ✅ Compare report data with ShopStockV2 and create reconciliation records
            reconciliation_results = self.create_reconciliation_records(
                shop_id, user_id, report_data, comment
            )

            db.session.commit()
            
            return {
                'message': 'Stock report submitted successfully',
                'reconciliation_created': len(reconciliation_results),
                'reconciliation_details': reconciliation_results
            }, 201

        except Exception as e:
            db.session.rollback()
            return {'message': f'Error processing stock report: {str(e)}'}, 500

    def parse_report_value(self, value_str):
        """
        Parse the report value string to extract quantity and unit.
        Returns tuple (quantity, unit)
        """
        if not value_str or value_str == "null":
            return 0, "null"
        
        # Convert to string for safety
        value_str = str(value_str).strip()
        
        # Handle "null" values
        if "null" in value_str.lower():
            try:
                # Extract number before "null"
                match = re.search(r'([\d.]+)\s*null', value_str)
                if match:
                    return float(match.group(1)), "null"
            except:
                pass
            return 0, "null"
        
        # Handle "item" units
        if "item" in value_str.lower():
            try:
                match = re.search(r'([\d.]+)\s*item', value_str)
                if match:
                    return float(match.group(1)), "item"
            except:
                pass
        
        # Handle "kg" units
        if "kg" in value_str.lower():
            try:
                match = re.search(r'([\d.]+)\s*kg', value_str)
                if match:
                    return float(match.group(1)), "kg"
            except:
                pass
        
        # Handle "pcs" units (NEW - this was missing)
        if "pcs" in value_str.lower() or "pc" in value_str.lower():
            try:
                match = re.search(r'([\d.]+)\s*pcs?', value_str, re.IGNORECASE)
                if match:
                    return float(match.group(1)), "pcs"
            except:
                pass
        
        # Handle plain numbers with units (generic case)
        try:
            # Try to extract number and unit separately
            match = re.search(r'([\d.]+)\s*([a-zA-Z]*)', value_str)
            if match:
                quantity = float(match.group(1))
                unit = match.group(2).lower() if match.group(2) else "pcs"
                if not unit:
                    unit = "pcs"
                return quantity, unit
        except:
            pass
        
        # Try to parse as plain number (default to pcs)
        try:
            return float(value_str), "pcs"
        except:
            print(f"Warning: Could not parse report value: '{value_str}'")
            return 0, "unknown"

    def normalize_item_name(self, item_name):
        """
        Normalize item names for comparison between report and stock data
        """
        # Convert to lowercase and remove extra spaces
        normalized = ' '.join(item_name.lower().split())
        
        # Common normalization rules
        replacements = {
            'catering sausages': 'sausage',
            'smokies': 'smokie',
            'boneless breast': 'breast',
            'drumstick': 'drum stick',
            'gizzard': 'gizzards',
        }
        
        for old, new in replacements.items():
            if old in normalized:
                normalized = normalized.replace(old, new)
        
        return normalized
    
    def get_stock_value_for_item(self, shop_id, report_item_name, report_unit):
        """
        Find all matching items in ShopStockV2 for given shop and return total quantity
        """
        normalized_name = self.normalize_item_name(report_item_name)
        stock_items = ShopStockV2.query.filter_by(shop_id=shop_id).all()

        total_quantity = 0.0
        match_found = False
        match_type = "no_match"

        for stock_item in stock_items:
            stock_item_name_normalized = self.normalize_item_name(stock_item.itemname)

            # ✅ Exact match
            if stock_item_name_normalized == normalized_name:
                total_quantity += float(stock_item.quantity or 0)
                match_found = True
                match_type = "exact_match"

            # ✅ Partial match
            elif normalized_name in stock_item_name_normalized or stock_item_name_normalized in normalized_name:
                total_quantity += float(stock_item.quantity or 0)
                match_found = True
                if match_type != "exact_match":
                    match_type = "partial_match"

        # ✅ Debug log to verify values
        print(f"Stock lookup - Item: {report_item_name}, Normalized: {normalized_name}, Stock Qty: {total_quantity}, Match: {match_type}")

        return total_quantity, match_type if match_found else "no_match"

    def create_reconciliation_records(self, shop_id, user_id, report_data, comment):
        """
        Compare report data with ShopStockV2 and create StockReconciliation records
        """
        reconciliation_results = []

        # Handle both dict and list input structures
        if isinstance(report_data, list):
            items = {entry.get('item'): entry.get('value') for entry in report_data if entry.get('item')}
        elif isinstance(report_data, dict):
            items = report_data
        else:
            raise ValueError("Invalid report_data format. Must be dict or list.")

        for item_name, report_value_str in items.items():
            if item_name in ["differences", "note", "comment"]:  # Skip metadata fields
                continue

            print(f"Processing item: {item_name}, value: '{report_value_str}'")

            # Parse reported value like "34kg" -> (34.0, "kg")
            report_quantity, report_unit = self.parse_report_value(report_value_str)
            
            print(f"Parsed - Quantity: {report_quantity}, Unit: {report_unit}")

            # Get stock quantity from ShopStockV2
            stock_quantity, match_status = self.get_stock_value_for_item(shop_id, item_name, report_unit)

            # Calculate difference
            difference = round(report_quantity - stock_quantity, 3)

            # Set reconciliation status
            status = 'Solved' if abs(difference) < 0.01 else 'Unsolved'

            # Create StockReconciliation entry
            reconciliation = StockReconciliation(
                shop_id=shop_id,
                user_id=user_id,
                stock_value=round(stock_quantity, 3),
                report_value=round(report_quantity, 3),
                item=item_name,
                difference=difference,
                status=status,
                comment=f"Unit: {report_unit}. {comment}" if comment else f"Unit: {report_unit}",
                created_at=func.now()
            )
            db.session.add(reconciliation)

            reconciliation_results.append({
                'item': item_name,
                'stock_value': round(stock_quantity, 3),
                'report_value': round(report_quantity, 3),
                'difference': difference,
                'status': status,
                'unit': report_unit,
                'match': match_status
            })

        return reconciliation_results


    


class ResetShopReportStatus(Resource):
    def put(self):
        # Reset all report_status to False
        Shops.query.update({Shops.report_status: False})
        db.session.commit()
        return {'message': 'All shops have been closed'}, 200

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
        
class StockReconciliationList(Resource):
    @jwt_required()
    def get(self):
        """
        Get stock reconciliation records with filtering and pagination
        """
        try:
            # Get query parameters
            shop_id = request.args.get('shop_id')
            status = request.args.get('status')
            item_name = request.args.get('item_name')
            date_from = request.args.get('date_from')
            date_to = request.args.get('date_to')
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 20, type=int)

            # Start with base query
            query = StockReconciliation.query

            # Apply filters
            if shop_id:
                query = query.filter(StockReconciliation.shop_id == shop_id)
            
            if status:
                query = query.filter(StockReconciliation.status == status)
            
            if item_name:
                query = query.filter(StockReconciliation.item.ilike(f'%{item_name}%'))
            
            if date_from:
                try:
                    date_from_obj = datetime.strptime(date_from, '%Y-%m-%d')
                    query = query.filter(StockReconciliation.created_at >= date_from_obj)
                except ValueError:
                    return {'message': 'Invalid date_from format. Use YYYY-MM-DD.'}, 400
            
            if date_to:
                try:
                    date_to_obj = datetime.strptime(date_to, '%Y-%m-%d')
                    # Include the entire end date
                    date_to_obj = date_to_obj.replace(hour=23, minute=59, second=59)
                    query = query.filter(StockReconciliation.created_at <= date_to_obj)
                except ValueError:
                    return {'message': 'Invalid date_to format. Use YYYY-MM-DD.'}, 400

            # Order by most recent first
            query = query.order_by(StockReconciliation.created_at.desc())

            # Paginate results
            pagination = query.paginate(
                page=page, 
                per_page=per_page, 
                error_out=False
            )

            # Format response
            reconciliations = []
            for recon in pagination.items:
                reconciliations.append({
                    'id': recon.id,
                    'shop_id': recon.shop_id,
                    'user_id': recon.user_id,
                    'item': recon.item,
                    'stock_value': float(recon.stock_value),
                    'report_value': float(recon.report_value),
                    'difference': float(recon.difference),
                    'status': recon.status,
                    'comment': recon.comment,
                    'created_at': recon.created_at.isoformat() if recon.created_at else None,
                })

            return {
                'reconciliations': reconciliations,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': pagination.total,
                    'pages': pagination.pages,
                    'has_next': pagination.has_next,
                    'has_prev': pagination.has_prev
                }
            }, 200

        except Exception as e:
            return {'message': f'Error fetching reconciliation records: {str(e)}'}, 500
        
class StockReconciliationResource(Resource):
    @jwt_required()
    def put(self, reconciliation_id):
        """
        Update an existing stock reconciliation record
        """
        data = request.get_json()
        user_id = get_jwt_identity()

        if not data:
            return {'message': 'No data provided'}, 400

        try:
            # Find the reconciliation record
            reconciliation = StockReconciliation.query.get(reconciliation_id)
            if not reconciliation:
                return {'message': 'Stock reconciliation record not found'}, 404

            # Check if user has permission to update this record
            # You might want to add additional permission checks here
            # For example, check if user belongs to the same shop or has admin rights

            # Update allowed fields
            allowed_fields = ['status', 'comment', 'difference', 'report_value']
            
            for field in allowed_fields:
                if field in data:
                    setattr(reconciliation, field, data[field])

            # Update updated_at timestamp
            reconciliation.updated_at = func.now()
            
            # Add update comment if provided
            update_comment = data.get('update_comment')
            if update_comment:
                original_comment = reconciliation.comment or ""
                reconciliation.comment = f"{original_comment} | Update: {update_comment}"

            db.session.commit()

            return {
                'message': 'Stock reconciliation updated successfully',
                'reconciliation': {
                    'id': reconciliation.id,
                    'item': reconciliation.item,
                    'stock_value': reconciliation.stock_value,
                    'report_value': reconciliation.report_value,
                    'difference': reconciliation.difference,
                    'status': reconciliation.status,
                    'comment': reconciliation.comment,
                    'shop_id': reconciliation.shop_id,
                    'user_id': reconciliation.user_id,
                    'created_at': reconciliation.created_at.isoformat() if reconciliation.created_at else None,
                    'updated_at': reconciliation.updated_at.isoformat() if reconciliation.updated_at else None
                }
            }, 200

        except Exception as e:
            db.session.rollback()
            return {'message': f'Error updating stock reconciliation: {str(e)}'}, 500

    @jwt_required()
    def delete(self, reconciliation_id):
        """
        Delete a stock reconciliation record
        """
        users_id = get_jwt_identity()

        try:
            # Find the reconciliation record
            reconciliation = StockReconciliation.query.get(reconciliation_id)
            if not reconciliation:
                return {'message': 'Stock reconciliation record not found'}, 404

            # Check if user has permission to delete this record
            # Add your permission logic here
            # For example: check if user is admin or owns the shop
            
            # Optional: Check if user is admin or has delete privileges
            # if not self.user_can_delete(user_id, reconciliation.shop_id):
            #     return {'message': 'Unauthorized to delete this record'}, 403

            # Store record info for response before deletion
            deleted_record = {
                'id': reconciliation.id,
                'item': reconciliation.item,
                'shop_id': reconciliation.shop_id,
                'created_at': reconciliation.created_at.isoformat() if reconciliation.created_at else None
            }

            db.session.delete(reconciliation)
            db.session.commit()

            return {
                'message': 'Stock reconciliation deleted successfully',
                'deleted_record': deleted_record
            }, 200

        except Exception as e:
            db.session.rollback()
            return {'message': f'Error deleting stock reconciliation: {str(e)}'}, 500

    def user_can_delete(self, user_id, shop_id):
        """
        Helper method to check if user has permission to delete reconciliation records
        Modify this based on your user roles and permissions system
        """
        # Example implementation - adjust based on your user role system
        user = Users.query.get(user_id)
        if not user:
            return False
        
        # If user is admin, allow deletion
        if user.role == 'admin':
            return True
        
        # If user manages this shop, allow deletion
        shop = Shops.query.filter_by(shops_id=shop_id, user_id=user_id).first()
        if shop:
            return True
        
        return False