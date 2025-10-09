from flask_restful import Resource
from flask import request, jsonify
from Server.Models.PushSubscription import PushSubscription
from app import db

class PushSubscribe(Resource):
    def post(self):
        """Save a user's or shop's push notification subscription (no authentication)."""
        data = request.get_json()

        user_id = data.get("user_id")
        shop_id = data.get("shop_id")
        subscription = data.get("subscription")

        if not subscription:
            return {"error": "Missing subscription data"}, 400

        existing = PushSubscription.query.filter_by(
            endpoint=subscription["endpoint"]
        ).first()

        if not existing:
            try:
                new_sub = PushSubscription(
                    user_id=user_id,
                    shop_id=shop_id,
                    endpoint=subscription["endpoint"],
                    p256dh=subscription["keys"]["p256dh"],
                    auth=subscription["keys"]["auth"],
                )
                db.session.add(new_sub)
                db.session.commit()
                return {"message": "Subscription saved"}, 201
            except Exception as e:
                db.session.rollback()
                return {"error": str(e)}, 500
        else:
            return {"message": "Subscription already exists"}, 200
