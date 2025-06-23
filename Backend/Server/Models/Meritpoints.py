from app import db
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func


class MeritPoints(db.Model):
    __tablename__ = "merit_points"

    meritpoint_id = db.Column(db.Integer, primary_key=True)
    reason = db.Column(db.String(255), nullable=False)
    point = db.Column(db.Integer, nullable=False)  # Can be positive or negative
    created_at = db.Column(db.DateTime, nullable=True)

    def __str__(self):
        return f"{self.reason} ({self.point:+})"
