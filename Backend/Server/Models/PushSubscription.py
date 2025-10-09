from app import db

class PushSubscription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, nullable=True)  # can be null for global/user-only subs
    user_id = db.Column(db.Integer, nullable=True)  # allow targeting individual users
    endpoint = db.Column(db.String(512), nullable=False, unique=True)
    p256dh = db.Column(db.String(256), nullable=False)
    auth = db.Column(db.String(128), nullable=False)

    def __repr__(self):
        return f"<PushSubscription user={self.user_id} shop={self.shop_id}>"
