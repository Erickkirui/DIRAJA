from app import db
from sqlalchemy import func

class BrokenEggsLog(db.Model):
    __tablename__ = "broken_eggs_loging"

    reclassification_id = db.Column(db.Integer, primary_key=True)

    # Source stock
    from_stockv2_id = db.Column(
        db.Integer,
        db.ForeignKey("shop_stock_v2.stockv2_id"),
        nullable=False
    )

    from_inventoryv2_id = db.Column(
        db.Integer,
        db.ForeignKey("inventoryV2.inventoryV2_id"),
        nullable=False
    )

    # Destination stock (optional but recommended)
    to_stockv2_id = db.Column(
        db.Integer,
        db.ForeignKey("shop_stock_v2.stockv2_id"),
        nullable=True
    )

    to_inventoryv2_id = db.Column(
        db.Integer,
        db.ForeignKey("inventoryV2.inventoryV2_id"),
        nullable=True
    )

    shop_id = db.Column(
        db.Integer,
        db.ForeignKey("shops.shops_id"),
        nullable=False
    )

    quantity = db.Column(db.Integer, nullable=False)

    unit_cost = db.Column(db.Numeric(10, 2), nullable=True)
    total_cost = db.Column(db.Numeric(12, 2), nullable=True)

    reclassified_by = db.Column(
        db.Integer,
        db.ForeignKey("users.users_id"),
        nullable=False
    )

    reclassification_date = db.Column(
        db.DateTime,
        nullable=False,
        server_default=func.now()
    )

    reason = db.Column(db.String(255))

    # Relationships
    from_stock = db.relationship(
        "ShopStockV2",
        foreign_keys=[from_stockv2_id],
        backref="reclassifications_out"
    )

    to_stock = db.relationship(
        "ShopStockV2",
        foreign_keys=[to_stockv2_id],
        backref="reclassifications_in"
    )

    from_inventory = db.relationship(
        "InventoryV2",
        foreign_keys=[from_inventoryv2_id]
    )

    to_inventory = db.relationship(
        "InventoryV2",
        foreign_keys=[to_inventoryv2_id]
    )

    user = db.relationship(
        "Users",
        backref="stock_reclassifications"
    )
