
from app import db
from flask import jsonify, current_app
from flask_restful import Resource, reqparse
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from Server.Models.ShopstockV2 import ShopStockV2
from Server.Models.InventoryV2 import InventoryV2
from Server.Models.Users import Users
from Server.Models.CookedItems import CookedItems
from Server.Models.Shops import Shops
from Server.Models.StockItems import StockItems
from sqlalchemy import func
import difflib

class AddCookedItems(Resource):
    parser = reqparse.RequestParser()
    parser.add_argument('from_itemname', type=str, required=True, help="Source item name is required")
    parser.add_argument('quantity_to_move', type=int, required=True, help="Quantity to move is required")

    @jwt_required()
    def post(self, shop_id):
        args = self.parser.parse_args()
        from_itemname = args['from_itemname']
        quantity_to_move = args['quantity_to_move']
        users_id = get_jwt_identity()

        try:
            with db.session.begin_nested():
                # 1️⃣ Get source batches (latest first)
                from_stocks = (
                    ShopStockV2.query
                    .join(InventoryV2, InventoryV2.inventoryV2_id == ShopStockV2.inventoryv2_id)
                    .filter(
                        ShopStockV2.shop_id == shop_id,
                        ShopStockV2.itemname.ilike(f"%{from_itemname}%")
                    )
                    .order_by(InventoryV2.created_at.desc())
                    .all()
                )

                if not from_stocks:
                    return {"error": f"No stock found matching '{from_itemname}' in shop {shop_id}"}, 404

                total_available = sum(s.quantity for s in from_stocks)
                if quantity_to_move > total_available:
                    return {"error": f"Cannot move {quantity_to_move}, only {total_available} available"}, 400

                # 2️⃣ Determine the cooked equivalent
                if "pork" in from_itemname.lower():
                    to_itemname = "Mishkaki"  # 🥩 Always map pork to mishkaki
                    cooked_item = StockItems.query.filter(StockItems.item_name.ilike("%Mishkaki%")).first()
                    if not cooked_item:
                        return {"error": "No matching 'Mishkaki' item found in StockItems"}, 404
                else:
                    # Find cooked equivalent from StockItems table
                    stock_items = StockItems.query.filter(StockItems.item_name.ilike("Cooked%")).all()
                    if not stock_items:
                        return {"error": "No cooked items found in StockItems"}, 404

                    cooked_names = [s.item_name for s in stock_items]
                    possible_matches = difflib.get_close_matches(from_itemname, cooked_names, n=1, cutoff=0.4)
                    if not possible_matches:
                        return {"error": f"No matching cooked stock item found in StockItems for '{from_itemname}'"}, 404
                    to_itemname = possible_matches[0]

                # 3️⃣ Begin deduction
                qty_remaining = quantity_to_move
                moved_records = []
                created_entries = []

                for from_stock in from_stocks:
                    if qty_remaining <= 0:
                        break
                    if from_stock.quantity <= 0:
                        continue  # Skip empty batches

                    move_qty = min(qty_remaining, from_stock.quantity)
                    if move_qty <= 0:
                        continue

                    # Calculate per-unit cost
                    unit_cost = (
                        from_stock.total_cost / from_stock.quantity
                        if from_stock.quantity > 0 else 0
                    )

                    # Deduct from this batch
                    from_stock.quantity -= move_qty
                    from_stock.total_cost = unit_cost * from_stock.quantity
                    db.session.add(from_stock)

                    # 4️⃣ Check if cooked stock already exists in this shop
                    existing_cooked = (
                        ShopStockV2.query
                        .filter(
                            ShopStockV2.shop_id == shop_id,
                            ShopStockV2.itemname.ilike(f"%{to_itemname}%")
                        )
                        .first()
                    )

                    if existing_cooked:
                        existing_cooked.quantity += move_qty
                        existing_cooked.total_cost += unit_cost * move_qty
                        db.session.add(existing_cooked)
                        to_stock_id = existing_cooked.stockv2_id
                    else:
                        # Create new entry using same batch details
                        new_entry = ShopStockV2(
                            shop_id=shop_id,
                            inventoryv2_id=from_stock.inventoryv2_id,
                            transferv2_id=from_stock.transferv2_id,
                            BatchNumber=from_stock.BatchNumber,
                            itemname=to_itemname,
                            quantity=move_qty,
                            total_cost=unit_cost * move_qty
                        )
                        db.session.add(new_entry)
                        db.session.flush()
                        to_stock_id = new_entry.stockv2_id

                    # 5️⃣ Log conversion
                    log = CookedItems(
                        shop_id=shop_id,
                        from_itemname=from_itemname,
                        to_itemname=to_itemname,
                        quantity_moved=move_qty,
                        unit_cost=unit_cost,
                        total_cost=unit_cost * move_qty,
                        performed_by=users_id
                    )
                    db.session.add(log)

                    moved_records.append({
                        "from_stock_id": from_stock.stockv2_id,
                        "to_stock_id": to_stock_id,
                        "moved_quantity": move_qty,
                        "unit_cost": unit_cost
                    })

                    created_entries.append({
                        "itemname": to_itemname,
                        "quantity": move_qty,
                        "total_cost": unit_cost * move_qty
                    })

                    qty_remaining -= move_qty

                db.session.commit()

            return {
                "message": f"Successfully converted {quantity_to_move} from '{from_itemname}' → '{to_itemname}'",
                "details": moved_records,
                "created_entries": created_entries
            }, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            current_app.logger.error(f"DB Error: {str(e)}")
            return {"error": "Database error occurred"}, 500

        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Unexpected Error: {str(e)}")
            return {"error": str(e)}, 500
