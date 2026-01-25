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