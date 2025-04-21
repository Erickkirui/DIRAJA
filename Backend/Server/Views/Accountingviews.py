from  flask_restful import Resource,reqparse
from Server.Models.AccountTypes import AccountTypes
from Server.Models.ChartOfAccounts import ChartOfAccounts
from Server.Models.ItemAccountsTable import ItemAccounts
from app import db 
from flask import request,make_response,jsonify
from flask_jwt_extended import jwt_required
from Server.Models.Inventory import Inventory
from Server.Models.Sales import Sales
from Server.Models.Users import Users
from Server.Models.Shops import Shops

class CreateAccount(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()

        name = data.get('name')
        type_ = data.get('type')

        if not name or not type_:
            return make_response(jsonify({"message": "Both 'name' and 'type' are required."}), 400)

        new_type = AccountTypes(name=name, type=type_)

        try:
            db.session.add(new_type)
            db.session.commit()
            return make_response(jsonify({
                "message": "Account type created successfully.",
                "account_type": {
                    "id": new_type.id,
                    "name": new_type.name,
                    "type": new_type.type
                }
            }), 201)
        except Exception as e:
            db.session.rollback()
            return make_response(jsonify({"message": "Error creating account type.", "error": str(e)}), 500)

        
class AccountTypeListResource(Resource):
    @jwt_required()
    def get(self):
        try:
            account_types = AccountTypes.query.all()
            results = [
                {
                    "id": acct.id,
                    "name": acct.name,
                    "type": acct.type
                } for acct in account_types
            ]
            return make_response(jsonify(results), 200)
        except Exception as e:
            return make_response(jsonify({
                "message": "Error fetching account types.",
                "error": str(e)
            }), 500)
        
class AccountTypeResource(Resource):
    # GET an account type by ID
    @jwt_required()
    def get(self, id):
        account_type = AccountTypes.query.get(id)
        
        if not account_type:
            return make_response(jsonify({"message": "Account type not found."}), 404)
        
        return make_response(jsonify({
            "id": account_type.id,
            "name": account_type.name,
            "type": account_type.type
        }), 200)

    # PUT (update) an account type by ID
    @jwt_required()
    def put(self, id):
        data = request.get_json()
        account_type = AccountTypes.query.get(id)

        if not account_type:
            return make_response(jsonify({"message": "Account type not found."}), 404)

        name = data.get('name', account_type.name)
        type_ = data.get('type', account_type.type)

        # Check if the type already exists
        if AccountTypes.query.filter_by(type=type_).first() and type_ != account_type.type:
            return make_response(jsonify({"message": f"Account type '{type_}' already exists."}), 409)

        account_type.name = name
        account_type.type = type_

        try:
            db.session.commit()
            return make_response(jsonify({
                "message": "Account type updated successfully.",
                "account_type": {
                    "id": account_type.id,
                    "name": account_type.name,
                    "type": account_type.type
                }
            }), 200)
        except Exception as e:
            db.session.rollback()
            return make_response(jsonify({"message": "Error updating account type.", "error": str(e)}), 500)

    # DELETE an account type by ID
    @jwt_required()
    def delete(self, id):
        account_type = AccountTypes.query.get(id)

        if not account_type:
            return make_response(jsonify({"message": "Account type not found."}), 404)

        try:
            db.session.delete(account_type)
            db.session.commit()
            return make_response(jsonify({"message": "Account type deleted successfully."}), 200)
        except Exception as e:
            db.session.rollback()
            return make_response(jsonify({"message": "Error deleting account type.", "error": str(e)}), 500)
        

class CreateChartOfAccounts(Resource):
    # POST a new chart of account entry
    @jwt_required()
    def post(self):
        data = request.get_json()

        # Extract fields from the request data
        account_name = data.get('Account')
        account_type_id = data.get('account_type_id')

        # Check if account_name and account_type_id are provided
        if not account_name or not account_type_id:
            return make_response(jsonify({"message": "Account name and account type ID are required."}), 400)

        # Check if the account type exists
        account_type = AccountTypes.query.get(account_type_id)
        if not account_type:
            return make_response(jsonify({"message": "Invalid account type ID."}), 400)

        # Create a new ChartOfAccounts entry
        new_chart_of_account = ChartOfAccounts(
            Account=account_name,
            account_type_id=account_type_id
        )

        try:
            db.session.add(new_chart_of_account)
            db.session.commit()

            return make_response(jsonify({
                "message": "Chart of account created successfully.",
                "chart_of_account": {
                    "id": new_chart_of_account.id,
                    "Account": new_chart_of_account.Account,
                    "account_type_id": new_chart_of_account.account_type_id,
                    "account_type": new_chart_of_account.account_type.type
                }
            }), 201)
        except Exception as e:
            db.session.rollback()
            return make_response(jsonify({"message": "Error creating chart of account.", "error": str(e)}), 500)
        

class ChartOfAccountsList(Resource):
    # GET all chart of account entries
    @jwt_required()
    def get(self):
        try:
            # Retrieve all chart of account records from the database
            chart_of_accounts = ChartOfAccounts.query.all()

            # If no records exist
            if not chart_of_accounts:
                return make_response(jsonify({"message": "No chart of accounts found."}), 404)

            # Prepare the list of chart of accounts
            result = []
            for account in chart_of_accounts:
                result.append({
                    "id": account.id,
                    "account": account.Account,
                    "account_type": account.account_type.name
                })

            return make_response(jsonify({"chart_of_accounts": result}), 200)

        except Exception as e:
            return make_response(jsonify({"message": "Error fetching chart of accounts.", "error": str(e)}), 500)
        

class ChartOfAccountResource(Resource):
    @jwt_required()
    def get(self, id):
        account = ChartOfAccounts.query.get(id)
        if not account:
            return make_response(jsonify({"message": "Chart of Account not found"}), 404)

        return make_response(jsonify({
            "id": account.id,
            "Account": account.Account,
            "account_type_id": account.account_type_id,
            "account_type": account.account_type.type
        }), 200)

    @jwt_required()
    def put(self, id):
        parser = reqparse.RequestParser()
        parser.add_argument('Account', type=str, required=True, help='Account name is required')
        parser.add_argument('account_type_id', type=int, required=True, help='Account type ID is required')
        data = parser.parse_args()

        account = ChartOfAccounts.query.get(id)
        if not account:
            return make_response(jsonify({"message": "Chart of Account not found"}), 404)

        # Check if provided account_type_id exists
        account_type = AccountTypes.query.get(data['account_type_id'])
        if not account_type:
            return make_response(jsonify({"message": "Invalid account_type_id"}), 400)

        account.Account = data['Account']
        account.account_type_id = data['account_type_id']
        db.session.commit()

        return make_response(jsonify({"message": "Chart of Account updated successfully"}), 200)

    @jwt_required()
    def delete(self, id):
        account = ChartOfAccounts.query.get(id)
        if not account:
            return make_response(jsonify({"message": "Chart of Account not found"}), 404)

        db.session.delete(account)
        db.session.commit()
        return make_response(jsonify({"message": "Chart of Account deleted successfully"}), 200)
    
class CreateItemAccount(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()

        item = data.get('item')
        chart_account_ids = data.get('chart_account_ids')  # Expecting a list of chart_of_accounts IDs

        if not item or not isinstance(chart_account_ids, list) or not chart_account_ids:
            return {"message": "Missing or invalid fields. 'item' and 'chart_account_ids' are required."}, 400

        try:
            # Create the item
            new_item_account = ItemAccounts(item=item)

            # Query chart accounts
            chart_accounts = ChartOfAccounts.query.filter(ChartOfAccounts.id.in_(chart_account_ids)).all()

            if not chart_accounts:
                return {"message": "No valid chart accounts found for given IDs."}, 400

            # Assign the relationships
            new_item_account.chart_accounts = chart_accounts

            # Save to DB
            db.session.add(new_item_account)
            db.session.commit()

            return {
                "message": "Item account created successfully.",
                "item_account": {
                    "id": new_item_account.id,
                    "item": new_item_account.item,
                    "chart_accounts": [account.id for account in new_item_account.chart_accounts]
                }
            }, 201

        except Exception as e:
            db.session.rollback()
            return {"message": "An error occurred.", "error": str(e)}, 500

        
class GetAllItemAccounts(Resource):
    @jwt_required()
    def get(self):
        try:
            items = ItemAccounts.query.all()
            item_list = []
            for item in items:
                # Collect the account names associated with this item account
                account_names = [account.Account for account in item.chart_accounts]

                item_list.append({
                    "id": item.id,
                    "item": item.item,
                    "accounts": account_names  # Return list of associated account names
                })
                
            return {"item_accounts": item_list}, 200

        except Exception as e:
            return {"message": "Failed to fetch item accounts", "error": str(e)}, 500


class PurchasesLedger(Resource):
    @jwt_required()
    def get(self):
        try:
            # 🔍 Only get inventories where Transcation_type_debit > 0
            inventories = Inventory.query.filter(Inventory.Transcation_type_debit > 0).order_by(Inventory.created_at.desc()).all()

            all_inventory = [{
                "suppliername": inventory.Suppliername,
                "itemname": inventory.itemname,
                "initial_quantity": inventory.initial_quantity,
                "remaining_quantity": inventory.quantity,
                "amountPaid": inventory.amountPaid,
                "balance": inventory.ballance,
                "created_at": inventory.created_at,
                "unitPrice": inventory.unitPrice,
                "source": inventory.source,
                "transcation_type_debit": inventory.Transcation_type_debit,
                "trasnaction_type_credit": inventory.Trasnaction_type_credit
            } for inventory in inventories]

            return make_response(jsonify(all_inventory), 200)

        except Exception as e:
            return {"error": str(e)}, 500



class SalesLedger(Resource):

    @jwt_required()
    def get(self):
        try:
            # Query sales where Purchase_account is greater than zero
            sales = Sales.query.filter(Sales.Purchase_account > 0).order_by(Sales.created_at.desc()).all()

            # If no sales found
            if not sales:
                return {"message": "No sales found"}, 404

            # Format sales data into a list of dictionaries
            sales_data = []
            for sale in sales:
                # Fetch username and shop name manually using user_id and shop_id
                user = Users.query.filter_by(users_id=sale.user_id).first()
                shop = Shops.query.filter_by(shops_id=sale.shop_id).first()

                # Handle cases where user or shop may not be found
                username = user.username if user else "Unknown User"
                shopname = shop.shopname if shop else "Unknown Shop"

                # Process multiple payment methods using the `payment` relationship
                payment_data = [
                    {
                        "payment_method": payment.payment_method,
                        "amount_paid": payment.amount_paid,
                        "created_at": payment.created_at,
                        "balance": payment.balance,  # Include balance field
                    }
                    for payment in sale.payment  # Using correct relationship
                ]

                # Calculate total amount paid
                total_amount_paid = sum(payment["amount_paid"] for payment in payment_data)

                sales_data.append({
                    "sale_id": sale.sales_id,
                    "user_id": sale.user_id,
                    "username": username,
                    "shop_id": sale.shop_id,
                    "shopname": shopname,
                    "customer_name": sale.customer_name,
                    "status": sale.status,
                    "customer_number": sale.customer_number,
                    "item_name": sale.item_name,
                    "quantity": sale.quantity,
                    "batchnumber": sale.BatchNumber,
                    "metric": sale.metric,
                    "unit_price": sale.unit_price,
                    "total_price": sale.total_price,
                    "total_amount_paid": total_amount_paid,
                    "payment_methods": payment_data,
                    "created_at": sale.created_at,
                    "balance": sale.balance,
                    "note": sale.note,
                    "Purchase_account": sale.Purchase_account,
                    "Cost_of_sale": sale.Cost_of_sale
                })

            return make_response(jsonify(sales_data), 200)

        except Exception as e:
            return {"error": str(e)}, 500
