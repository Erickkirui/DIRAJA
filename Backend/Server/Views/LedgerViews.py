from flask_restful import Resource
from flask import jsonify,request
from flask_jwt_extended import jwt_required
from app import db
from sqlalchemy.orm import aliased
from datetime import datetime


from Server.Models.Accounting.SalesLedger import SalesLedger
from Server.Models.Accounting.CreditSalesLedger import CreditSalesLedger
from Server.Models.ChartOfAccounts import ChartOfAccounts
from Server.Models.Shops import Shops
from Server.Models.Creditors import Creditors
from Server.Models.Accounting.BankTransferLedger import BankTransfersLedger
from Server.Models.Accounting.PurchaseLedger import PurchaseLedgerInventory,DistributionLedger
from Server.Models.BankAccounts import BankAccount,BankingTransaction
from Server.Models.TransferV2 import TransfersV2
from Server.Models.InventoryV2 import InventoryV2


class SalesLedgerList(Resource):
    @jwt_required()
    def get(self):
        try:
            # Get query parameters
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 20, type=int)
            search = request.args.get('search', '', type=str)
            shop_id = request.args.get('shop_id', type=int)
            account_id = request.args.get('account_id', type=int)
            transaction_type = request.args.get('transaction_type', type=str)  # 'debit' or 'credit'
            start_date = request.args.get('start_date', type=str)
            end_date = request.args.get('end_date', type=str)
            
            # Alias chart_of_accounts for debit & credit
            DebitAccount = aliased(ChartOfAccounts)
            CreditAccount = aliased(ChartOfAccounts)

            # Build base query
            query = (
                db.session.query(
                    SalesLedger.id,
                    SalesLedger.created_at,
                    SalesLedger.sales_id,
                    SalesLedger.description,
                    SalesLedger.amount,
                    DebitAccount.name.label("debit_account"),
                    DebitAccount.id.label("debit_account_id"),
                    CreditAccount.name.label("credit_account"),
                    CreditAccount.id.label("credit_account_id"),
                    Shops.shopname.label("shop_name"),
                    Shops.shops_id.label("shop_id")
                )
                .join(DebitAccount, SalesLedger.debit_account_id == DebitAccount.id)
                .join(CreditAccount, SalesLedger.credit_account_id == CreditAccount.id)
                .join(Shops, SalesLedger.shop_id == Shops.shops_id)
            )

            # Apply filters
            if search:
                search_term = f"%{search}%"
                query = query.filter(
                    db.or_(
                        SalesLedger.description.ilike(search_term),
                        DebitAccount.name.ilike(search_term),
                        CreditAccount.name.ilike(search_term),
                        Shops.shopname.ilike(search_term),
                        SalesLedger.sales_id.cast(db.String).ilike(search_term)
                    )
                )

            if shop_id:
                query = query.filter(SalesLedger.shop_id == shop_id)

            if account_id:
                query = query.filter(
                    db.or_(
                        SalesLedger.debit_account_id == account_id,
                        SalesLedger.credit_account_id == account_id
                    )
                )

            if transaction_type:
                if transaction_type.lower() == 'debit':
                    query = query.filter(SalesLedger.amount > 0)
                elif transaction_type.lower() == 'credit':
                    query = query.filter(SalesLedger.amount < 0)

            if start_date:
                try:
                    start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                    query = query.filter(SalesLedger.created_at >= start_date_obj)
                except ValueError:
                    pass

            if end_date:
                try:
                    end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                    # Add time to end of day
                    end_date_obj = end_date_obj.replace(hour=23, minute=59, second=59)
                    query = query.filter(SalesLedger.created_at <= end_date_obj)
                except ValueError:
                    pass

            # Get total count for pagination
            total_count = query.count()

            # Apply pagination
            query = query.order_by(SalesLedger.created_at.desc())
            paginated_query = query.paginate(page=page, per_page=per_page, error_out=False)

            # Prepare results
            results = []
            for row in paginated_query.items:
                results.append({
                    "id": row.id,
                    "created_at": row.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    "sales_id": row.sales_id,
                    "description": row.description,
                    "debit_account": row.debit_account,
                    "debit_account_id": row.debit_account_id,
                    "credit_account": row.credit_account,
                    "credit_account_id": row.credit_account_id,
                    "amount": float(row.amount),
                    "shop": row.shop_name,
                    "shop_id": row.shop_id
                })

            # Get summary statistics
            summary_query = db.session.query(
                db.func.count(SalesLedger.id).label('total_entries'),
                db.func.sum(SalesLedger.amount).label('total_amount'),
                db.func.avg(SalesLedger.amount).label('average_amount')
            )

            # Apply same filters to summary query
            if search:
                summary_query = summary_query.join(DebitAccount, SalesLedger.debit_account_id == DebitAccount.id)\
                    .join(CreditAccount, SalesLedger.credit_account_id == CreditAccount.id)\
                    .join(Shops, SalesLedger.shop_id == Shops.shops_id)\
                    .filter(
                        db.or_(
                            SalesLedger.description.ilike(f"%{search}%"),
                            DebitAccount.name.ilike(f"%{search}%"),
                            CreditAccount.name.ilike(f"%{search}%"),
                            Shops.shopname.ilike(f"%{search}%"),
                            SalesLedger.sales_id.cast(db.String).ilike(f"%{search}%")
                        )
                    )

            if shop_id:
                summary_query = summary_query.filter(SalesLedger.shop_id == shop_id)

            if start_date:
                try:
                    start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                    summary_query = summary_query.filter(SalesLedger.created_at >= start_date_obj)
                except ValueError:
                    pass

            if end_date:
                try:
                    end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                    end_date_obj = end_date_obj.replace(hour=23, minute=59, second=59)
                    summary_query = summary_query.filter(SalesLedger.created_at <= end_date_obj)
                except ValueError:
                    pass

            summary = summary_query.first()

            return jsonify({
                "data": results,
                "pagination": {
                    "total": total_count,
                    "page": page,
                    "per_page": per_page,
                    "pages": paginated_query.pages,
                    "has_next": paginated_query.has_next,
                    "has_prev": paginated_query.has_prev,
                    "next_num": paginated_query.next_num,
                    "prev_num": paginated_query.prev_num
                },
                "summary": {
                    "total_entries": summary.total_entries or 0,
                    "total_amount": float(summary.total_amount or 0),
                    "average_amount": float(summary.average_amount or 0),
                    "debit_entries": db.session.query(db.func.count(SalesLedger.id))
                        .filter(SalesLedger.amount > 0).scalar() or 0,
                    "credit_entries": db.session.query(db.func.count(SalesLedger.id))
                        .filter(SalesLedger.amount < 0).scalar() or 0
                }
            })

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500

        

class CreditSalesLedgerList(Resource):
    @jwt_required()
    def get(self):
        try:
            # Get query parameters
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 20, type=int)
            search = request.args.get('search', '', type=str)
            shop_id = request.args.get('shop_id', type=int)
            creditor_id = request.args.get('creditor_id', type=int)
            account_id = request.args.get('account_id', type=int)
            start_date = request.args.get('start_date', type=str)
            end_date = request.args.get('end_date', type=str)
            min_amount = request.args.get('min_amount', type=float)
            max_amount = request.args.get('max_amount', type=float)
            min_balance = request.args.get('min_balance', type=float)
            max_balance = request.args.get('max_balance', type=float)
            
            # Alias chart_of_accounts for debit & credit
            DebitAccount = aliased(ChartOfAccounts)
            CreditAccount = aliased(ChartOfAccounts)

            # Build base query
            query = (
                db.session.query(
                    CreditSalesLedger.id,
                    CreditSalesLedger.created_at,
                    CreditSalesLedger.sales_id,
                    CreditSalesLedger.description,
                    CreditSalesLedger.amount,
                    CreditSalesLedger.balance,
                    DebitAccount.name.label("debit_account"),
                    DebitAccount.id.label("debit_account_id"),
                    CreditAccount.name.label("credit_account"),
                    CreditAccount.id.label("credit_account_id"),
                    Shops.shopname.label("shop_name"),
                    Shops.shops_id.label("shop_id"),
                    Creditors.id.label("creditor_id"),
                    Creditors.name.label("creditor_name")
                )
                .join(DebitAccount, CreditSalesLedger.debit_account_id == DebitAccount.id)
                .join(CreditAccount, CreditSalesLedger.credit_account_id == CreditAccount.id)
                .join(Shops, CreditSalesLedger.shop_id == Shops.shops_id)
                .join(Creditors, CreditSalesLedger.creditor_id == Creditors.id)
            )

            # Apply filters
            if search:
                search_term = f"%{search}%"
                query = query.filter(
                    db.or_(
                        CreditSalesLedger.description.ilike(search_term),
                        DebitAccount.name.ilike(search_term),
                        CreditAccount.name.ilike(search_term),
                        Shops.shopname.ilike(search_term),
                        Creditors.name.ilike(search_term),
                        CreditSalesLedger.sales_id.cast(db.String).ilike(search_term)
                    )
                )

            if shop_id:
                query = query.filter(CreditSalesLedger.shop_id == shop_id)

            if creditor_id:
                query = query.filter(CreditSalesLedger.creditor_id == creditor_id)

            if account_id:
                query = query.filter(
                    db.or_(
                        CreditSalesLedger.debit_account_id == account_id,
                        CreditSalesLedger.credit_account_id == account_id
                    )
                )

            if start_date:
                try:
                    start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                    query = query.filter(CreditSalesLedger.created_at >= start_date_obj)
                except ValueError:
                    pass

            if end_date:
                try:
                    end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                    end_date_obj = end_date_obj.replace(hour=23, minute=59, second=59)
                    query = query.filter(CreditSalesLedger.created_at <= end_date_obj)
                except ValueError:
                    pass

            if min_amount is not None:
                query = query.filter(CreditSalesLedger.amount >= min_amount)

            if max_amount is not None:
                query = query.filter(CreditSalesLedger.amount <= max_amount)

            if min_balance is not None:
                query = query.filter(CreditSalesLedger.balance >= min_balance)

            if max_balance is not None:
                query = query.filter(CreditSalesLedger.balance <= max_balance)

            # Get total count for pagination
            total_count = query.count()

            # Calculate pagination
            total_pages = (total_count + per_page - 1) // per_page  # Ceiling division
            offset = (page - 1) * per_page
            
            # Apply pagination
            paginated_query = query.order_by(CreditSalesLedger.created_at.desc())\
                .offset(offset)\
                .limit(per_page)\
                .all()

            # Prepare results
            data = []
            for row in paginated_query:
                data.append({
                    "id": row.id,
                    "created_at": row.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    "sales_id": row.sales_id,
                    "description": row.description,
                    "creditor": {
                        "id": row.creditor_id,
                        "name": row.creditor_name
                    },
                    "debit_account": row.debit_account,
                    "debit_account_id": row.debit_account_id,
                    "credit_account": row.credit_account,
                    "credit_account_id": row.credit_account_id,
                    "amount": float(row.amount),
                    "balance": float(row.balance) if row.balance is not None else 0,
                    "shop": row.shop_name,
                    "shop_id": row.shop_id
                })

            # Get summary statistics
            summary_query = db.session.query(
                db.func.count(CreditSalesLedger.id).label('total_entries'),
                db.func.sum(CreditSalesLedger.amount).label('total_amount'),
                db.func.avg(CreditSalesLedger.amount).label('average_amount'),
                db.func.sum(CreditSalesLedger.balance).label('total_balance'),
                db.func.avg(CreditSalesLedger.balance).label('average_balance')
            ).join(Creditors, CreditSalesLedger.creditor_id == Creditors.id)

            # Apply same filters to summary query
            if search:
                summary_query = summary_query.join(DebitAccount, CreditSalesLedger.debit_account_id == DebitAccount.id)\
                    .join(CreditAccount, CreditSalesLedger.credit_account_id == CreditAccount.id)\
                    .join(Shops, CreditSalesLedger.shop_id == Shops.shops_id)\
                    .filter(
                        db.or_(
                            CreditSalesLedger.description.ilike(f"%{search}%"),
                            DebitAccount.name.ilike(f"%{search}%"),
                            CreditAccount.name.ilike(f"%{search}%"),
                            Shops.shopname.ilike(f"%{search}%"),
                            Creditors.name.ilike(f"%{search}%"),
                            CreditSalesLedger.sales_id.cast(db.String).ilike(f"%{search}%")
                        )
                    )

            if shop_id:
                summary_query = summary_query.filter(CreditSalesLedger.shop_id == shop_id)

            if creditor_id:
                summary_query = summary_query.filter(CreditSalesLedger.creditor_id == creditor_id)

            if start_date:
                try:
                    start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                    summary_query = summary_query.filter(CreditSalesLedger.created_at >= start_date_obj)
                except ValueError:
                    pass

            if end_date:
                try:
                    end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                    end_date_obj = end_date_obj.replace(hour=23, minute=59, second=59)
                    summary_query = summary_query.filter(CreditSalesLedger.created_at <= end_date_obj)
                except ValueError:
                    pass

            summary = summary_query.first()

            # Get unique creditors count
            unique_creditors_query = db.session.query(db.func.count(db.distinct(CreditSalesLedger.creditor_id)))
            if search or shop_id or start_date or end_date:
                unique_creditors_query = unique_creditors_query.join(Creditors, CreditSalesLedger.creditor_id == Creditors.id)
                
                if search:
                    unique_creditors_query = unique_creditors_query.join(DebitAccount, CreditSalesLedger.debit_account_id == DebitAccount.id)\
                        .join(CreditAccount, CreditSalesLedger.credit_account_id == CreditAccount.id)\
                        .join(Shops, CreditSalesLedger.shop_id == Shops.shops_id)\
                        .filter(
                            db.or_(
                                CreditSalesLedger.description.ilike(f"%{search}%"),
                                DebitAccount.name.ilike(f"%{search}%"),
                                CreditAccount.name.ilike(f"%{search}%"),
                                Shops.shopname.ilike(f"%{search}%"),
                                Creditors.name.ilike(f"%{search}%"),
                                CreditSalesLedger.sales_id.cast(db.String).ilike(f"%{search}%")
                            )
                        )
                
                if shop_id:
                    unique_creditors_query = unique_creditors_query.filter(CreditSalesLedger.shop_id == shop_id)
                
                if start_date:
                    try:
                        start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                        unique_creditors_query = unique_creditors_query.filter(CreditSalesLedger.created_at >= start_date_obj)
                    except ValueError:
                        pass
                
                if end_date:
                    try:
                        end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                        end_date_obj = end_date_obj.replace(hour=23, minute=59, second=59)
                        unique_creditors_query = unique_creditors_query.filter(CreditSalesLedger.created_at <= end_date_obj)
                    except ValueError:
                        pass

            unique_creditors = unique_creditors_query.scalar() or 0

            return jsonify({
                "data": data,
                "pagination": {
                    "total": total_count,
                    "page": page,
                    "per_page": per_page,
                    "pages": total_pages,
                    "has_next": page < total_pages,
                    "has_prev": page > 1,
                    "next_num": page + 1 if page < total_pages else None,
                    "prev_num": page - 1 if page > 1 else None
                },
                "summary": {
                    "total_entries": summary.total_entries or 0,
                    "total_amount": float(summary.total_amount or 0),
                    "average_amount": float(summary.average_amount or 0),
                    "total_balance": float(summary.total_balance or 0),
                    "average_balance": float(summary.average_balance or 0),
                    "unique_creditors": unique_creditors,
                    "unique_shops": db.session.query(db.func.count(db.distinct(CreditSalesLedger.shop_id))).scalar() or 0
                }
            })

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500


class DistributionLedgerList(Resource):
    @jwt_required()
    def get(self):
        try:
            # Get query parameters
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 20, type=int)
            search = request.args.get('search', '', type=str)
            transfer_id = request.args.get('transfer_id', type=int)
            shop_id = request.args.get('shop_id', type=int)
            debit_account_id = request.args.get('debit_account_id', type=int)
            credit_account_id = request.args.get('credit_account_id', type=int)
            account_id = request.args.get('account_id', type=int)
            start_date = request.args.get('start_date', type=str)
            end_date = request.args.get('end_date', type=str)
            min_amount = request.args.get('min_amount', type=float)
            max_amount = request.args.get('max_amount', type=float)
            
            # Alias chart_of_accounts
            DebitAccount = aliased(ChartOfAccounts)
            CreditAccount = aliased(ChartOfAccounts)

            # Build base query - USING transferv2_id instead of transfer_number
            query = (
                db.session.query(
                    DistributionLedger.id,
                    DistributionLedger.created_at,
                    DistributionLedger.transfer_id,
                    DistributionLedger.description,
                    DistributionLedger.amount,
                    DebitAccount.name.label("debit_account_name"),
                    DebitAccount.code.label("debit_account_code"),
                    DebitAccount.id.label("debit_account_id"),
                    DebitAccount.type.label("debit_account_type"),
                    CreditAccount.name.label("credit_account_name"),
                    CreditAccount.code.label("credit_account_code"),
                    CreditAccount.id.label("credit_account_id"),
                    CreditAccount.type.label("credit_account_type"),
                    # Shop details
                    Shops.shops_id,
                    Shops.shopname.label("shop_name"),
                    # Transfer details - using transferv2_id as identifier
                    TransfersV2.transferv2_id,
                    TransfersV2.transferv2_id.label("transfer_number"),  # Using ID as transfer number
                    TransfersV2.status,
                    TransfersV2.quantity.label("transfer_quantity"),
                    TransfersV2.itemname.label("item_name"),
                    TransfersV2.BatchNumber.label("batch_number"),
                    TransfersV2.metric.label("unit_of_measure"),
                    TransfersV2.total_cost.label("total_transfer_cost"),
                    TransfersV2.unitCost.label("unit_cost"),
                    TransfersV2.created_at.label("transfer_date")
                )
                .join(DebitAccount, DistributionLedger.debit_account_id == DebitAccount.id)
                .join(CreditAccount, DistributionLedger.credit_account_id == CreditAccount.id)
                .join(Shops, DistributionLedger.shop_id == Shops.shops_id)
                .join(TransfersV2, DistributionLedger.transfer_id == TransfersV2.transferv2_id)
            )

            # Apply filters - REMOVED transfer_number from search
            if search:
                search_term = f"%{search}%"
                query = query.filter(
                    db.or_(
                        DistributionLedger.description.ilike(search_term),
                        DebitAccount.name.ilike(search_term),
                        DebitAccount.code.ilike(search_term),
                        CreditAccount.name.ilike(search_term),
                        CreditAccount.code.ilike(search_term),
                        Shops.shopname.ilike(search_term),
                        TransfersV2.itemname.ilike(search_term),
                        TransfersV2.BatchNumber.ilike(search_term),
                        DistributionLedger.transfer_id.cast(db.String).ilike(search_term),
                        TransfersV2.transferv2_id.cast(db.String).ilike(search_term)  # Search by transfer ID
                    )
                )

            if transfer_id:
                query = query.filter(DistributionLedger.transfer_id == transfer_id)

            if shop_id:
                query = query.filter(DistributionLedger.shop_id == shop_id)

            if debit_account_id:
                query = query.filter(DistributionLedger.debit_account_id == debit_account_id)

            if credit_account_id:
                query = query.filter(DistributionLedger.credit_account_id == credit_account_id)

            if account_id:
                query = query.filter(
                    db.or_(
                        DistributionLedger.debit_account_id == account_id,
                        DistributionLedger.credit_account_id == account_id
                    )
                )

            if start_date:
                try:
                    start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                    query = query.filter(DistributionLedger.created_at >= start_date_obj)
                except ValueError:
                    pass

            if end_date:
                try:
                    end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                    end_date_obj = end_date_obj.replace(hour=23, minute=59, second=59)
                    query = query.filter(DistributionLedger.created_at <= end_date_obj)
                except ValueError:
                    pass

            if min_amount is not None:
                query = query.filter(DistributionLedger.amount >= min_amount)

            if max_amount is not None:
                query = query.filter(DistributionLedger.amount <= max_amount)

            # Get total count
            total_count = query.count()
            total_pages = (total_count + per_page - 1) // per_page
            offset = (page - 1) * per_page
            
            # Apply pagination
            paginated_query = query.order_by(DistributionLedger.created_at.desc())\
                .offset(offset)\
                .limit(per_page)\
                .all()

            # Prepare results
            data = []
            for row in paginated_query:
                data.append({
                    "id": row.id,
                    "created_at": row.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    "transfer_id": row.transfer_id,
                    "description": row.description,
                    "debit_account": {
                        "id": row.debit_account_id,
                        "name": row.debit_account_name,
                        "code": row.debit_account_code,
                        "type": row.debit_account_type
                    },
                    "credit_account": {
                        "id": row.credit_account_id,
                        "name": row.credit_account_name,
                        "code": row.credit_account_code,
                        "type": row.credit_account_type
                    },
                    "amount": float(row.amount),
                    "shop": {
                        "id": row.shops_id,
                        "name": row.shop_name
                    },
                    "transfer": {
                        "id": row.transferv2_id,
                        "transfer_number": f"TRF-{row.transfer_number:06d}",  # Format as TRF-000001
                        "status": row.status,
                        "quantity": float(row.transfer_quantity) if row.transfer_quantity else 0,
                        "item_name": row.item_name,
                        "batch_number": row.batch_number,
                        "unit_of_measure": row.unit_of_measure,
                        "total_cost": float(row.total_transfer_cost) if row.total_transfer_cost else 0,
                        "unit_cost": float(row.unit_cost) if row.unit_cost else 0,
                        "transfer_date": row.transfer_date.strftime("%Y-%m-%d %H:%M:%S") if row.transfer_date else None
                    }
                })

            # Get summary statistics
            summary_query = db.session.query(
                db.func.count(DistributionLedger.id).label('total_entries'),
                db.func.sum(DistributionLedger.amount).label('total_amount'),
                db.func.avg(DistributionLedger.amount).label('average_amount'),
                db.func.max(DistributionLedger.amount).label('max_amount'),
                db.func.min(DistributionLedger.amount).label('min_amount'),
                db.func.count(db.distinct(DistributionLedger.transfer_id)).label('unique_transfers'),
                db.func.count(db.distinct(DistributionLedger.shop_id)).label('unique_shops'),
                db.func.count(db.distinct(DistributionLedger.debit_account_id)).label('unique_debit_accounts'),
                db.func.count(db.distinct(DistributionLedger.credit_account_id)).label('unique_credit_accounts')
            )

            # Apply same filters to summary query - REMOVED transfer_number filter
            if search:
                summary_query = summary_query.join(Shops, DistributionLedger.shop_id == Shops.shops_id)\
                    .join(TransfersV2, DistributionLedger.transfer_id == TransfersV2.transferv2_id)\
                    .filter(
                        db.or_(
                            DistributionLedger.description.ilike(f"%{search}%"),
                            Shops.shopname.ilike(f"%{search}%"),
                            TransfersV2.itemname.ilike(f"%{search}%"),
                            TransfersV2.BatchNumber.ilike(f"%{search}%")
                        )
                    )

            if transfer_id:
                summary_query = summary_query.filter(DistributionLedger.transfer_id == transfer_id)

            if shop_id:
                summary_query = summary_query.filter(DistributionLedger.shop_id == shop_id)

            if debit_account_id:
                summary_query = summary_query.filter(DistributionLedger.debit_account_id == debit_account_id)

            if credit_account_id:
                summary_query = summary_query.filter(DistributionLedger.credit_account_id == credit_account_id)

            if start_date:
                try:
                    start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                    summary_query = summary_query.filter(DistributionLedger.created_at >= start_date_obj)
                except ValueError:
                    pass

            if end_date:
                try:
                    end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                    end_date_obj = end_date_obj.replace(hour=23, minute=59, second=59)
                    summary_query = summary_query.filter(DistributionLedger.created_at <= end_date_obj)
                except ValueError:
                    pass

            if min_amount is not None:
                summary_query = summary_query.filter(DistributionLedger.amount >= min_amount)

            if max_amount is not None:
                summary_query = summary_query.filter(DistributionLedger.amount <= max_amount)

            summary = summary_query.first()

            # Get distribution by shop
            shop_summary = db.session.query(
                Shops.shopname.label("shop_name"),
                db.func.count(DistributionLedger.id).label("entry_count"),
                db.func.sum(DistributionLedger.amount).label("total_amount"),
                db.func.avg(DistributionLedger.amount).label("average_amount")
            ).join(Shops, DistributionLedger.shop_id == Shops.shops_id)

            # Apply filters to shop summary
            if search:
                shop_summary = shop_summary.filter(
                    Shops.shopname.ilike(f"%{search}%") |
                    DistributionLedger.description.ilike(f"%{search}%")
                )

            if transfer_id:
                shop_summary = shop_summary.filter(DistributionLedger.transfer_id == transfer_id)

            if start_date:
                try:
                    start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                    shop_summary = shop_summary.filter(DistributionLedger.created_at >= start_date_obj)
                except ValueError:
                    pass

            if end_date:
                try:
                    end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                    end_date_obj = end_date_obj.replace(hour=23, minute=59, second=59)
                    shop_summary = shop_summary.filter(DistributionLedger.created_at <= end_date_obj)
                except ValueError:
                    pass

            if min_amount is not None:
                shop_summary = shop_summary.filter(DistributionLedger.amount >= min_amount)

            if max_amount is not None:
                shop_summary = shop_summary.filter(DistributionLedger.amount <= max_amount)

            shop_summary = shop_summary.group_by(Shops.shopname)\
                .order_by(db.func.sum(DistributionLedger.amount).desc())\
                .all()

            # Get distribution by transfer status
            status_summary = db.session.query(
                TransfersV2.status,
                db.func.count(DistributionLedger.id).label("entry_count"),
                db.func.sum(DistributionLedger.amount).label("total_amount"),
                db.func.avg(DistributionLedger.amount).label("average_amount")
            ).join(TransfersV2, DistributionLedger.transfer_id == TransfersV2.transferv2_id)

            # Apply filters to status summary
            if shop_id:
                status_summary = status_summary.filter(DistributionLedger.shop_id == shop_id)

            if start_date:
                try:
                    start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                    status_summary = status_summary.filter(DistributionLedger.created_at >= start_date_obj)
                except ValueError:
                    pass

            if end_date:
                try:
                    end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                    end_date_obj = end_date_obj.replace(hour=23, minute=59, second=59)
                    status_summary = status_summary.filter(DistributionLedger.created_at <= end_date_obj)
                except ValueError:
                    pass

            status_summary = status_summary.group_by(TransfersV2.status)\
                .order_by(db.func.sum(DistributionLedger.amount).desc())\
                .all()

            # Get top items distributed
            items_summary = db.session.query(
                TransfersV2.itemname.label("item_name"),
                db.func.count(DistributionLedger.id).label("distribution_count"),
                db.func.sum(DistributionLedger.amount).label("total_amount"),
                db.func.avg(DistributionLedger.amount).label("average_amount")
            ).join(TransfersV2, DistributionLedger.transfer_id == TransfersV2.transferv2_id)

            # Apply filters to items summary
            if shop_id:
                items_summary = items_summary.filter(DistributionLedger.shop_id == shop_id)

            if start_date:
                try:
                    start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                    items_summary = items_summary.filter(DistributionLedger.created_at >= start_date_obj)
                except ValueError:
                    pass

            if end_date:
                try:
                    end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                    end_date_obj = end_date_obj.replace(hour=23, minute=59, second=59)
                    items_summary = items_summary.filter(DistributionLedger.created_at <= end_date_obj)
                except ValueError:
                    pass

            items_summary = items_summary.group_by(TransfersV2.itemname)\
                .order_by(db.func.sum(DistributionLedger.amount).desc())\
                .limit(10)\
                .all()

            return jsonify({
                "data": data,
                "pagination": {
                    "total": total_count,
                    "page": page,
                    "per_page": per_page,
                    "pages": total_pages,
                    "has_next": page < total_pages,
                    "has_prev": page > 1,
                    "next_num": page + 1 if page < total_pages else None,
                    "prev_num": page - 1 if page > 1 else None
                },
                "summary": {
                    "total_entries": summary.total_entries or 0,
                    "total_amount": float(summary.total_amount or 0),
                    "average_amount": float(summary.average_amount or 0),
                    "max_amount": float(summary.max_amount or 0),
                    "min_amount": float(summary.min_amount or 0),
                    "unique_transfers": summary.unique_transfers or 0,
                    "unique_shops": summary.unique_shops or 0,
                    "unique_debit_accounts": summary.unique_debit_accounts or 0,
                    "unique_credit_accounts": summary.unique_credit_accounts or 0,
                    "distribution_by_shop": [{
                        "shop_name": row.shop_name,
                        "entry_count": row.entry_count,
                        "total_amount": float(row.total_amount or 0),
                        "average_amount": float(row.average_amount or 0)
                    } for row in shop_summary],
                    "distribution_by_status": [{
                        "status": row.status,
                        "entry_count": row.entry_count,
                        "total_amount": float(row.total_amount or 0),
                        "average_amount": float(row.average_amount or 0)
                    } for row in status_summary],
                    "top_items_distributed": [{
                        "item_name": row.item_name,
                        "distribution_count": row.distribution_count,
                        "total_amount": float(row.total_amount or 0),
                        "average_amount": float(row.average_amount or 0)
                    } for row in items_summary]
                }
            })

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500


class PurchaseLedgerInventoryList(Resource):
    @jwt_required()
    def get(self):
        try:
            # Get query parameters
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 20, type=int)
            search = request.args.get('search', '', type=str)
            inventory_id = request.args.get('inventory_id', type=int)
            debit_account_id = request.args.get('debit_account_id', type=int)
            credit_account_id = request.args.get('credit_account_id', type=int)
            account_id = request.args.get('account_id', type=int)
            start_date = request.args.get('start_date', type=str)
            end_date = request.args.get('end_date', type=str)
            min_amount = request.args.get('min_amount', type=float)
            max_amount = request.args.get('max_amount', type=float)
            
            # Alias chart_of_accounts
            DebitAccount = aliased(ChartOfAccounts)
            CreditAccount = aliased(ChartOfAccounts)

            # Build base query - CORRECTED InventoryV2 fields
            query = (
                db.session.query(
                    PurchaseLedgerInventory.id,
                    PurchaseLedgerInventory.created_at,
                    PurchaseLedgerInventory.inventory_id,
                    PurchaseLedgerInventory.description,
                    PurchaseLedgerInventory.amount,
                    DebitAccount.name.label("debit_account_name"),
                    DebitAccount.code.label("debit_account_code"),
                    DebitAccount.id.label("debit_account_id"),
                    DebitAccount.type.label("debit_account_type"),
                    CreditAccount.name.label("credit_account_name"),
                    CreditAccount.code.label("credit_account_code"),
                    CreditAccount.id.label("credit_account_id"),
                    CreditAccount.type.label("credit_account_type"),
                    # Inventory details - CORRECTED field names
                    InventoryV2.inventoryV2_id,
                    InventoryV2.itemname.label("inventory_name"),  # Changed from inventory_name to itemname
                    InventoryV2.BatchNumber.label("batch_number"),  # Using BatchNumber as identifier
                    InventoryV2.quantity.label("quantity"),
                    InventoryV2.unitPrice.label("unit_price"),
                    InventoryV2.Suppliername.label("supplier_name")
                )
                .join(DebitAccount, PurchaseLedgerInventory.debit_account_id == DebitAccount.id)
                .join(CreditAccount, PurchaseLedgerInventory.credit_account_id == CreditAccount.id)
                .join(InventoryV2, PurchaseLedgerInventory.inventory_id == InventoryV2.inventoryV2_id)
            )

            # Apply filters
            if search:
                search_term = f"%{search}%"
                query = query.filter(
                    db.or_(
                        PurchaseLedgerInventory.description.ilike(search_term),
                        DebitAccount.name.ilike(search_term),
                        DebitAccount.code.ilike(search_term),
                        CreditAccount.name.ilike(search_term),
                        CreditAccount.code.ilike(search_term),
                        InventoryV2.itemname.ilike(search_term),  # Changed from inventory_name
                        InventoryV2.BatchNumber.ilike(search_term),  # Using BatchNumber for search
                        InventoryV2.Suppliername.ilike(search_term),
                        PurchaseLedgerInventory.inventory_id.cast(db.String).ilike(search_term)
                    )
                )

            if inventory_id:
                query = query.filter(PurchaseLedgerInventory.inventory_id == inventory_id)

            if debit_account_id:
                query = query.filter(PurchaseLedgerInventory.debit_account_id == debit_account_id)

            if credit_account_id:
                query = query.filter(PurchaseLedgerInventory.credit_account_id == credit_account_id)

            if account_id:
                query = query.filter(
                    db.or_(
                        PurchaseLedgerInventory.debit_account_id == account_id,
                        PurchaseLedgerInventory.credit_account_id == account_id
                    )
                )

            if start_date:
                try:
                    start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                    query = query.filter(PurchaseLedgerInventory.created_at >= start_date_obj)
                except ValueError:
                    pass

            if end_date:
                try:
                    end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                    end_date_obj = end_date_obj.replace(hour=23, minute=59, second=59)
                    query = query.filter(PurchaseLedgerInventory.created_at <= end_date_obj)
                except ValueError:
                    pass

            if min_amount is not None:
                query = query.filter(PurchaseLedgerInventory.amount >= min_amount)

            if max_amount is not None:
                query = query.filter(PurchaseLedgerInventory.amount <= max_amount)

            # Get total count
            total_count = query.count()
            total_pages = (total_count + per_page - 1) // per_page
            offset = (page - 1) * per_page
            
            # Apply pagination
            paginated_query = query.order_by(PurchaseLedgerInventory.created_at.desc())\
                .offset(offset)\
                .limit(per_page)\
                .all()

            # Prepare results
            data = []
            for row in paginated_query:
                data.append({
                    "id": row.id,
                    "created_at": row.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    "inventory_id": row.inventory_id,
                    "description": row.description,
                    "debit_account": {
                        "id": row.debit_account_id,
                        "name": row.debit_account_name,
                        "code": row.debit_account_code,
                        "type": row.debit_account_type
                    },
                    "credit_account": {
                        "id": row.credit_account_id,
                        "name": row.credit_account_name,
                        "code": row.credit_account_code,
                        "type": row.credit_account_type
                    },
                    "amount": float(row.amount),
                    "inventory": {
                        "id": row.inventoryV2_id,
                        "name": row.inventory_name,  # This is now itemname
                        "batch_number": row.batch_number,
                        "quantity": float(row.quantity) if row.quantity else 0,
                        "unit_price": float(row.unit_price) if row.unit_price else 0,
                        "supplier_name": row.supplier_name
                    }
                })

            # Get summary statistics
            summary_query = db.session.query(
                db.func.count(PurchaseLedgerInventory.id).label('total_entries'),
                db.func.sum(PurchaseLedgerInventory.amount).label('total_amount'),
                db.func.avg(PurchaseLedgerInventory.amount).label('average_amount'),
                db.func.max(PurchaseLedgerInventory.amount).label('max_amount'),
                db.func.min(PurchaseLedgerInventory.amount).label('min_amount'),
                db.func.count(db.distinct(PurchaseLedgerInventory.inventory_id)).label('unique_inventories'),
                db.func.count(db.distinct(PurchaseLedgerInventory.debit_account_id)).label('unique_debit_accounts'),
                db.func.count(db.distinct(PurchaseLedgerInventory.credit_account_id)).label('unique_credit_accounts'),
                db.func.count(db.distinct(InventoryV2.Suppliername)).label('unique_suppliers')
            ).join(InventoryV2, PurchaseLedgerInventory.inventory_id == InventoryV2.inventoryV2_id)

            # Apply same filters to summary query
            if search:
                summary_query = summary_query.filter(
                    db.or_(
                        PurchaseLedgerInventory.description.ilike(f"%{search}%"),
                        InventoryV2.itemname.ilike(f"%{search}%"),  # Changed from inventory_name
                        InventoryV2.BatchNumber.ilike(f"%{search}%"),
                        InventoryV2.Suppliername.ilike(f"%{search}%")
                    )
                )

            if inventory_id:
                summary_query = summary_query.filter(PurchaseLedgerInventory.inventory_id == inventory_id)

            if debit_account_id:
                summary_query = summary_query.filter(PurchaseLedgerInventory.debit_account_id == debit_account_id)

            if credit_account_id:
                summary_query = summary_query.filter(PurchaseLedgerInventory.credit_account_id == credit_account_id)

            if account_id:
                summary_query = summary_query.filter(
                    db.or_(
                        PurchaseLedgerInventory.debit_account_id == account_id,
                        PurchaseLedgerInventory.credit_account_id == account_id
                    )
                )

            if start_date:
                try:
                    start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                    summary_query = summary_query.filter(PurchaseLedgerInventory.created_at >= start_date_obj)
                except ValueError:
                    pass

            if end_date:
                try:
                    end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                    end_date_obj = end_date_obj.replace(hour=23, minute=59, second=59)
                    summary_query = summary_query.filter(PurchaseLedgerInventory.created_at <= end_date_obj)
                except ValueError:
                    pass

            if min_amount is not None:
                summary_query = summary_query.filter(PurchaseLedgerInventory.amount >= min_amount)

            if max_amount is not None:
                summary_query = summary_query.filter(PurchaseLedgerInventory.amount <= max_amount)

            summary = summary_query.first()

            # Additional summary: Top suppliers by purchase amount
            supplier_summary = db.session.query(
                InventoryV2.Suppliername.label("supplier_name"),
                db.func.count(PurchaseLedgerInventory.id).label("purchase_count"),
                db.func.sum(PurchaseLedgerInventory.amount).label("total_purchased"),
                db.func.avg(PurchaseLedgerInventory.amount).label("avg_purchase")
            ).join(InventoryV2, PurchaseLedgerInventory.inventory_id == InventoryV2.inventoryV2_id)

            # Apply filters to supplier summary
            if search:
                supplier_summary = supplier_summary.filter(
                    InventoryV2.Suppliername.ilike(f"%{search}%") |
                    InventoryV2.itemname.ilike(f"%{search}%")
                )

            if start_date:
                try:
                    start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                    supplier_summary = supplier_summary.filter(PurchaseLedgerInventory.created_at >= start_date_obj)
                except ValueError:
                    pass

            if end_date:
                try:
                    end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                    end_date_obj = end_date_obj.replace(hour=23, minute=59, second=59)
                    supplier_summary = supplier_summary.filter(PurchaseLedgerInventory.created_at <= end_date_obj)
                except ValueError:
                    pass

            supplier_summary = supplier_summary.group_by(InventoryV2.Suppliername)\
                .order_by(db.func.sum(PurchaseLedgerInventory.amount).desc())\
                .limit(5).all()

            return jsonify({
                "data": data,
                "pagination": {
                    "total": total_count,
                    "page": page,
                    "per_page": per_page,
                    "pages": total_pages,
                    "has_next": page < total_pages,
                    "has_prev": page > 1,
                    "next_num": page + 1 if page < total_pages else None,
                    "prev_num": page - 1 if page > 1 else None
                },
                "summary": {
                    "total_entries": summary.total_entries or 0,
                    "total_amount": float(summary.total_amount or 0),
                    "average_amount": float(summary.average_amount or 0),
                    "max_amount": float(summary.max_amount or 0),
                    "min_amount": float(summary.min_amount or 0),
                    "unique_inventories": summary.unique_inventories or 0,
                    "unique_debit_accounts": summary.unique_debit_accounts or 0,
                    "unique_credit_accounts": summary.unique_credit_accounts or 0,
                    "unique_suppliers": summary.unique_suppliers or 0,
                    "top_suppliers": [{
                        "supplier_name": row.supplier_name,
                        "purchase_count": row.purchase_count,
                        "total_purchased": float(row.total_purchased or 0),
                        "avg_purchase": float(row.avg_purchase or 0)
                    } for row in supplier_summary]
                }
            })

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500


class BankTransfersLedgerList(Resource):
    @jwt_required()
    def get(self):
        try:
            # Get query parameters
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 20, type=int)
            search = request.args.get('search', '', type=str)
            bank_transaction_id = request.args.get('bank_transaction_id', type=int)
            debit_account_id = request.args.get('debit_account_id', type=int)
            credit_account_id = request.args.get('credit_account_id', type=int)
            account_id = request.args.get('account_id', type=int)
            start_date = request.args.get('start_date', type=str)
            end_date = request.args.get('end_date', type=str)
            min_amount = request.args.get('min_amount', type=float)
            max_amount = request.args.get('max_amount', type=float)
            
            # Alias chart_of_accounts
            DebitAccount = aliased(ChartOfAccounts)
            CreditAccount = aliased(ChartOfAccounts)
            DebitAccountForBank = aliased(ChartOfAccounts)
            CreditAccountForBank = aliased(ChartOfAccounts)

            # Build base query - FIXED: Create aliases first
            query = (
                db.session.query(
                    BankTransfersLedger.id,
                    BankTransfersLedger.created_at,
                    BankTransfersLedger.bank_transaction_id,
                    BankTransfersLedger.description,
                    BankTransfersLedger.amount,
                    DebitAccount.name.label("debit_account_name"),
                    DebitAccount.code.label("debit_account_code"),
                    DebitAccount.id.label("debit_account_id"),
                    DebitAccount.type.label("debit_account_type"),
                    CreditAccount.name.label("credit_account_name"),
                    CreditAccount.code.label("credit_account_code"),
                    CreditAccount.id.label("credit_account_id"),
                    CreditAccount.type.label("credit_account_type"),
                    # BankingTransaction fields
                    BankingTransaction.id.label("bank_transaction_ref_id"),
                    BankingTransaction.Transaction_type_debit,
                    BankingTransaction.Transaction_type_credit,
                    # BankAccount fields
                    BankAccount.id.label("bank_account_id"),
                    BankAccount.Account_name.label("bank_account_name"),
                    BankAccount.Account_Balance.label("bank_account_balance"),
                    BankAccount.chart_account_id.label("bank_chart_account_id"),
                    # Linked ChartOfAccounts for bank account
                    DebitAccountForBank.name.label("linked_debit_account_name"),
                    DebitAccountForBank.code.label("linked_debit_account_code"),
                    CreditAccountForBank.name.label("linked_credit_account_name"),
                    CreditAccountForBank.code.label("linked_credit_account_code")
                )
                .join(DebitAccount, BankTransfersLedger.debit_account_id == DebitAccount.id)
                .join(CreditAccount, BankTransfersLedger.credit_account_id == CreditAccount.id)
                .outerjoin(BankingTransaction, BankTransfersLedger.bank_transaction_id == BankingTransaction.id)
                .outerjoin(BankAccount, BankingTransaction.account_id == BankAccount.id)
                # Left join to get linked ChartOfAccounts
                .outerjoin(
                    DebitAccountForBank, 
                    db.and_(
                        BankAccount.chart_account_id == DebitAccountForBank.id,
                        BankTransfersLedger.debit_account_id == DebitAccountForBank.id
                    )
                )
                .outerjoin(
                    CreditAccountForBank,
                    db.and_(
                        BankAccount.chart_account_id == CreditAccountForBank.id,
                        BankTransfersLedger.credit_account_id == CreditAccountForBank.id
                    )
                )
            )

            # Apply filters
            if search:
                search_term = f"%{search}%"
                query = query.filter(
                    db.or_(
                        BankTransfersLedger.description.ilike(search_term),
                        DebitAccount.name.ilike(search_term),
                        DebitAccount.code.ilike(search_term),
                        CreditAccount.name.ilike(search_term),
                        CreditAccount.code.ilike(search_term),
                        BankAccount.Account_name.ilike(search_term),
                        DebitAccountForBank.name.ilike(search_term),
                        CreditAccountForBank.name.ilike(search_term),
                        DebitAccountForBank.code.ilike(search_term),
                        CreditAccountForBank.code.ilike(search_term),
                        BankTransfersLedger.bank_transaction_id.cast(db.String).ilike(search_term),
                        BankingTransaction.id.cast(db.String).ilike(search_term)
                    )
                )

            if bank_transaction_id:
                query = query.filter(BankTransfersLedger.bank_transaction_id == bank_transaction_id)

            if debit_account_id:
                query = query.filter(BankTransfersLedger.debit_account_id == debit_account_id)

            if credit_account_id:
                query = query.filter(BankTransfersLedger.credit_account_id == credit_account_id)

            if account_id:
                query = query.filter(
                    db.or_(
                        BankTransfersLedger.debit_account_id == account_id,
                        BankTransfersLedger.credit_account_id == account_id
                    )
                )

            if start_date:
                try:
                    start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                    query = query.filter(BankTransfersLedger.created_at >= start_date_obj)
                except ValueError:
                    pass

            if end_date:
                try:
                    end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                    end_date_obj = end_date_obj.replace(hour=23, minute=59, second=59)
                    query = query.filter(BankTransfersLedger.created_at <= end_date_obj)
                except ValueError:
                    pass

            if min_amount is not None:
                query = query.filter(BankTransfersLedger.amount >= min_amount)

            if max_amount is not None:
                query = query.filter(BankTransfersLedger.amount <= max_amount)

            # Get total count
            total_count = query.count()
            total_pages = (total_count + per_page - 1) // per_page
            offset = (page - 1) * per_page
            
            # Apply pagination
            paginated_query = query.order_by(BankTransfersLedger.created_at.desc())\
                .offset(offset)\
                .limit(per_page)\
                .all()

            # Prepare results
            data = []
            for row in paginated_query:
                # Calculate net banking transaction amount
                bank_trans_debit = float(row.Transaction_type_debit) if row.Transaction_type_debit else 0
                bank_trans_credit = float(row.Transaction_type_credit) if row.Transaction_type_credit else 0
                bank_net_amount = bank_trans_debit - bank_trans_credit
                
                # Determine which account is linked to the bank account
                is_debit_account_linked = bool(row.linked_debit_account_name)
                is_credit_account_linked = bool(row.linked_credit_account_name)
                linked_account_name = row.linked_debit_account_name or row.linked_credit_account_name
                linked_account_code = row.linked_debit_account_code or row.linked_credit_account_code
                
                entry = {
                    "id": row.id,
                    "created_at": row.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    "bank_transaction_id": row.bank_transaction_id,
                    "description": row.description,
                    "debit_account": {
                        "id": row.debit_account_id,
                        "name": row.debit_account_name,
                        "code": row.debit_account_code,
                        "type": row.debit_account_type,
                        "is_linked_to_bank_account": is_debit_account_linked
                    },
                    "credit_account": {
                        "id": row.credit_account_id,
                        "name": row.credit_account_name,
                        "code": row.credit_account_code,
                        "type": row.credit_account_type,
                        "is_linked_to_bank_account": is_credit_account_linked
                    },
                    "amount": float(row.amount)
                }
                
                # Add banking transaction info if available
                if row.bank_transaction_ref_id:
                    entry["banking_transaction"] = {
                        "id": row.bank_transaction_ref_id,
                        "debit_amount": bank_trans_debit,
                        "credit_amount": bank_trans_credit,
                        "net_amount": bank_net_amount,
                        "transaction_type": "Debit" if bank_trans_debit > 0 else "Credit",
                        "bank_account": {
                            "id": row.bank_account_id,
                            "name": row.bank_account_name,
                            "balance": float(row.bank_account_balance) if row.bank_account_balance else 0,
                            "chart_account_id": row.bank_chart_account_id,
                            "linked_account_name": linked_account_name,
                            "linked_account_code": linked_account_code
                        }
                    }
                
                data.append(entry)

            # Get summary statistics - SIMPLIFIED to avoid complex joins
            summary_query = db.session.query(
                db.func.count(BankTransfersLedger.id).label('total_entries'),
                db.func.sum(BankTransfersLedger.amount).label('total_amount'),
                db.func.avg(BankTransfersLedger.amount).label('average_amount'),
                db.func.max(BankTransfersLedger.amount).label('max_amount'),
                db.func.min(BankTransfersLedger.amount).label('min_amount'),
                db.func.count(db.distinct(BankTransfersLedger.debit_account_id)).label('unique_debit_accounts'),
                db.func.count(db.distinct(BankTransfersLedger.credit_account_id)).label('unique_credit_accounts'),
                db.func.count(db.distinct(BankingTransaction.account_id)).label('linked_bank_accounts'),
                db.func.count(db.distinct(BankTransfersLedger.bank_transaction_id)).label('linked_bank_transactions')
            ).outerjoin(BankingTransaction, BankTransfersLedger.bank_transaction_id == BankingTransaction.id)

            # Apply filters to summary query
            if search:
                summary_query = summary_query.filter(
                    BankTransfersLedger.description.ilike(f"%{search}%")
                )

            if bank_transaction_id:
                summary_query = summary_query.filter(BankTransfersLedger.bank_transaction_id == bank_transaction_id)

            if start_date:
                try:
                    start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                    summary_query = summary_query.filter(BankTransfersLedger.created_at >= start_date_obj)
                except ValueError:
                    pass

            if end_date:
                try:
                    end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                    end_date_obj = end_date_obj.replace(hour=23, minute=59, second=59)
                    summary_query = summary_query.filter(BankTransfersLedger.created_at <= end_date_obj)
                except ValueError:
                    pass

            if min_amount is not None:
                summary_query = summary_query.filter(BankTransfersLedger.amount >= min_amount)

            if max_amount is not None:
                summary_query = summary_query.filter(BankTransfersLedger.amount <= max_amount)

            summary_data = summary_query.first()

            # Additional summaries - SIMPLIFIED
            debit_summary = db.session.query(
                ChartOfAccounts.name.label("account_name"),
                ChartOfAccounts.code.label("account_code"),
                ChartOfAccounts.type.label("account_type"),
                db.func.count(BankTransfersLedger.id).label("count"),
                db.func.sum(BankTransfersLedger.amount).label("total_debited"),
                db.func.avg(BankTransfersLedger.amount).label("average_debit")
            ).join(ChartOfAccounts, BankTransfersLedger.debit_account_id == ChartOfAccounts.id)\
             .group_by(ChartOfAccounts.name, ChartOfAccounts.code, ChartOfAccounts.type)\
             .order_by(db.func.sum(BankTransfersLedger.amount).desc())\
             .limit(10).all()

            credit_summary = db.session.query(
                ChartOfAccounts.name.label("account_name"),
                ChartOfAccounts.code.label("account_code"),
                ChartOfAccounts.type.label("account_type"),
                db.func.count(BankTransfersLedger.id).label("count"),
                db.func.sum(BankTransfersLedger.amount).label("total_credited"),
                db.func.avg(BankTransfersLedger.amount).label("average_credit")
            ).join(ChartOfAccounts, BankTransfersLedger.credit_account_id == ChartOfAccounts.id)\
             .group_by(ChartOfAccounts.name, ChartOfAccounts.code, ChartOfAccounts.type)\
             .order_by(db.func.sum(BankTransfersLedger.amount).desc())\
             .limit(10).all()

            # Bank account summary
            bank_account_summary = db.session.query(
                BankAccount.Account_name.label("bank_account_name"),
                BankAccount.Account_Balance.label("current_balance"),
                db.func.count(BankTransfersLedger.id).label("transaction_count"),
                db.func.sum(BankTransfersLedger.amount).label("total_amount")
            ).join(BankingTransaction, BankTransfersLedger.bank_transaction_id == BankingTransaction.id)\
             .join(BankAccount, BankingTransaction.account_id == BankAccount.id)\
             .group_by(BankAccount.Account_name, BankAccount.Account_Balance)\
             .order_by(db.func.sum(BankTransfersLedger.amount).desc())\
             .limit(10).all()

            # Monthly summary
            monthly_summary = db.session.query(
                db.func.extract('year', BankTransfersLedger.created_at).label("year"),
                db.func.extract('month', BankTransfersLedger.created_at).label("month"),
                db.func.count(BankTransfersLedger.id).label("transfer_count"),
                db.func.sum(BankTransfersLedger.amount).label("total_amount"),
                db.func.avg(BankTransfersLedger.amount).label("average_amount")
            )

            if start_date:
                try:
                    start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                    monthly_summary = monthly_summary.filter(BankTransfersLedger.created_at >= start_date_obj)
                except ValueError:
                    pass

            if end_date:
                try:
                    end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                    end_date_obj = end_date_obj.replace(hour=23, minute=59, second=59)
                    monthly_summary = monthly_summary.filter(BankTransfersLedger.created_at <= end_date_obj)
                except ValueError:
                    pass

            monthly_summary = monthly_summary.group_by(
                db.func.extract('year', BankTransfersLedger.created_at),
                db.func.extract('month', BankTransfersLedger.created_at)
            ).order_by(
                db.func.extract('year', BankTransfersLedger.created_at).desc(),
                db.func.extract('month', BankTransfersLedger.created_at).desc()
            ).limit(12).all()

            summary = {
                "total_entries": summary_data.total_entries or 0,
                "total_amount": float(summary_data.total_amount or 0),
                "average_amount": float(summary_data.average_amount or 0),
                "max_amount": float(summary_data.max_amount or 0),
                "min_amount": float(summary_data.min_amount or 0),
                "unique_debit_accounts": summary_data.unique_debit_accounts or 0,
                "unique_credit_accounts": summary_data.unique_credit_accounts or 0,
                "unique_bank_accounts": summary_data.linked_bank_accounts or 0,
                "linked_bank_transactions": summary_data.linked_bank_transactions or 0,
                "unlinked_transfers": (summary_data.total_entries or 0) - (summary_data.linked_bank_transactions or 0),
                "top_debit_accounts": [{
                    "account_name": row.account_name,
                    "account_code": row.account_code,
                    "account_type": row.account_type,
                    "count": row.count,
                    "total_debited": float(row.total_debited or 0),
                    "average_debit": float(row.average_debit or 0)
                } for row in debit_summary],
                "top_credit_accounts": [{
                    "account_name": row.account_name,
                    "account_code": row.account_code,
                    "account_type": row.account_type,
                    "count": row.count,
                    "total_credited": float(row.total_credited or 0),
                    "average_credit": float(row.average_credit or 0)
                } for row in credit_summary],
                "top_bank_accounts": [{
                    "bank_account_name": row.bank_account_name,
                    "current_balance": float(row.current_balance or 0),
                    "transaction_count": row.transaction_count,
                    "total_amount": float(row.total_amount or 0)
                } for row in bank_account_summary],
                "monthly_summary": [{
                    "year": int(row.year),
                    "month": int(row.month),
                    "month_name": datetime(2000, int(row.month), 1).strftime('%B'),
                    "transfer_count": row.transfer_count,
                    "total_amount": float(row.total_amount or 0),
                    "average_amount": float(row.average_amount or 0)
                } for row in monthly_summary]
            }

            return jsonify({
                "data": data,
                "pagination": {
                    "total": total_count,
                    "page": page,
                    "per_page": per_page,
                    "pages": total_pages,
                    "has_next": page < total_pages,
                    "has_prev": page > 1,
                    "next_num": page + 1 if page < total_pages else None,
                    "prev_num": page - 1 if page > 1 else None
                },
                "summary": summary
            })

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500