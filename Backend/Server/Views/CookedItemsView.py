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

class AddCookedItems(Resource):
    parser = reqparse.RequestParser()
    parser.add_argument('from_itemname', type=str, required=True, help="Source (raw) item name is required")
    parser.add_argument('to_itemname', type=str, required=True, help="Destination (cooked) item name is required")
    parser.add_argument('quantity_to_move', type=int, required=True, help="Quantity to move is required")

    @jwt_required()
    def post(self, shop_id):
        args = self.parser.parse_args()
        from_itemname = args['from_itemname']
        to_itemname = args['to_itemname']
        quantity_to_move = args['quantity_to_move']
        users_id = get_jwt_identity()

        try:
            with db.session.begin_nested():
                # 1️⃣ Validate that the cooked item exists in StockItems
                cooked_item = StockItems.query.filter(
                    StockItems.item_name.ilike(f"%{to_itemname}%")
                ).first()
                
                if not cooked_item:
                    return {"error": f"No matching cooked item found in StockItems for '{to_itemname}'"}, 404
                
                # Optional: You might want to verify it's actually a cooked item
                # if "cooked" not in cooked_item.item_name.lower():
                #     return {"error": f"Item '{to_itemname}' is not a cooked item"}, 400

                # 2️⃣ Get source batches (latest first)
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

                    # Calculate per-unit cost safely
                    if from_stock.quantity is None or from_stock.quantity <= 0:
                        unit_cost = 0
                    elif from_stock.total_cost is None:
                        unit_cost = 0
                        current_app.logger.warning(
                            f"Stock {from_stock.stockv2_id} has NULL total_cost. "
                            f"Item: {from_stock.itemname}, Batch: {from_stock.BatchNumber}"
                        )
                    else:
                        unit_cost = from_stock.total_cost / from_stock.quantity

                    # Deduct from this batch
                    from_stock.quantity -= move_qty
                    
                    # Update total_cost safely
                    if unit_cost is not None:
                        from_stock.total_cost = unit_cost * from_stock.quantity
                    else:
                        from_stock.total_cost = 0
                    
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
                        # Add to total_cost safely
                        if unit_cost is not None:
                            existing_cooked.total_cost += unit_cost * move_qty
                        else:
                            existing_cooked.total_cost = existing_cooked.total_cost or 0
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
                            total_cost=(unit_cost * move_qty) if unit_cost is not None else 0
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
                        unit_cost=unit_cost or 0,
                        total_cost=(unit_cost * move_qty) if unit_cost is not None else 0,
                        performed_by=users_id
                    )
                    db.session.add(log)

                    moved_records.append({
                        "from_stock_id": from_stock.stockv2_id,
                        "to_stock_id": to_stock_id,
                        "moved_quantity": move_qty,
                        "unit_cost": unit_cost or 0
                    })

                    created_entries.append({
                        "itemname": to_itemname,
                        "quantity": move_qty,
                        "total_cost": (unit_cost * move_qty) if unit_cost is not None else 0
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