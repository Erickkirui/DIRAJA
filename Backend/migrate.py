from app import db, create_app
from config import app_config  # <-- import your config
from Server.Models.Sales import Sales
from Server.Models.SoldItems import SoldItem

config_name = "production"  # or "development", depending on your case
app = create_app(app_config[config_name])  # <-- pass the right config

with app.app_context():
    sales_records = Sales.query.all()
    for sale in sales_records:
        if sale.item_name:
            sold_item = SoldItem(
                sales_id=sale.sales_id,
                item_name=sale.item_name,
                quantity=sale.quantity,
                metric=sale.metric,
                unit_price=sale.unit_price,
                total_price=sale.total_price,
                BatchNumber=sale.BatchNumber,
                stock_id=sale.stock_id,
                Cost_of_sale=sale.Cost_of_sale,
                Purchase_account=sale.Purchase_account
            )
            db.session.add(sold_item)
    db.session.commit()

    print("✅ Migration complete.")

