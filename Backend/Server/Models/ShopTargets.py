from app import db
from sqlalchemy.orm import validates
from sqlalchemy import CheckConstraint


class ShopTargets(db.Model):
    __tablename__ = "shop_targets"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    shop_id = db.Column(
        db.Integer,
        db.ForeignKey("shops.shops_id", ondelete="CASCADE"),
        nullable=False
    )
    assigned_by_user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.users_id"),
        nullable=False
    )
    assigned_by_name = db.Column(db.String(100), nullable=False)
    target_type = db.Column(db.String(20), nullable=False)
    target_amount = db.Column(db.Float, nullable=False)
    current_sales = db.Column(db.Float, default=0.0, nullable=False)
    status = db.Column(db.String(20), default="not_achieved", nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)

    assigned_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
        nullable=False
    )

    is_active = db.Column(db.Boolean, default=True, nullable=False)

    created_at = db.Column(db.DateTime, server_default=db.func.now())

    shop = db.relationship("Shops", backref=db.backref("targets", lazy=True))
    assigned_by = db.relationship("Users", lazy=True)

    @validates("target_type")
    def validate_target_type(self, key, value):
        allowed = ["daily", "weekly", "monthly"]
        assert value in allowed, f"Target type must be one of {allowed}"
        return value

    @validates("status")
    def validate_status(self, key, value):
        allowed = ["achieved", "not_achieved"]
        assert value in allowed, f"Status must be one of {allowed}"
        return value

    __table_args__ = (
        CheckConstraint(
            "target_type IN ('daily', 'weekly', 'monthly')",
            name="check_target_type"
        ),
        CheckConstraint(
            "status IN ('achieved', 'not_achieved')",
            name="check_target_status"
        ),
        CheckConstraint(
            "end_date >= start_date",
            name="check_valid_target_dates"
        ),
    )

    def __repr__(self):
        return (
            f"<ShopTarget shop_id={self.shop_id}, "
            f"type={self.target_type}, "
            f"target={self.target_amount}, "
            f"current_sales={self.current_sales}, "
            f"status={self.status}>"
        )
