from  flask_restful import Resource,reqparse
from Server.Models.AccountTypes import AccountTypes
from Server.Models.ChartOfAccounts import ChartOfAccounts
from Server.Models.ItemAccountsTable import ItemAccounts
from app import db 
from flask import request,make_response,jsonify
from flask_jwt_extended import jwt_required


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
        chart_account_id = data.get('type')  # ID of chart_of_accounts

        if not item or not chart_account_id:
            return {"message": "Missing required fields."}, 400

        try:
            new_item_account = ItemAccounts(
                item=item,
                type=chart_account_id
            )
            db.session.add(new_item_account)
            db.session.commit()
            return {
                "message": "Item account created successfully.",
                "item_account": {
                    "id": new_item_account.id,
                    "item": new_item_account.item,
                    "type": new_item_account.type
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
                item_list.append({
                    "id": item.id,
                    "item": item.item,
                    "account": item.chart_account.Account  # Human-readable account name
                })
            return {"item_accounts": item_list}, 200

        except Exception as e:
            return {"message": "Failed to fetch item accounts", "error": str(e)}, 500
