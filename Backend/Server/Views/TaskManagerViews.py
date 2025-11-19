from flask import request, jsonify
from flask_restful import Resource
from app import db
import json
from Server.Models.TaskManager import TaskManager
from Server.Models.PushSubscription import PushSubscription
from pywebpush import webpush, WebPushException
from Server.Models.Users import Users
from functools import wraps
from pywebpush import webpush, WebPushException
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from flask import request, make_response, jsonify
from functools import wraps
import datetime
from flask import current_app
from flask_jwt_extended import jwt_required
from sqlalchemy.orm import joinedload


def check_role(required_role):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = Users.query.get(current_user_id)
            if user and user.role != required_role:
                 return make_response( jsonify({"error": "Unauthorized access"}), 403 )       
            current_user_id = get_jwt_identity()
            user = Users.query.get(current_user_id)
            if user and user.role != required_role:
                 return make_response( jsonify({"error": "Unauthorized access"}), 403 )       
            return fn(*args, **kwargs)
        return decorator
    return wrapper


class CreateTask(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()

        try:
            # Validate status
            allowed_statuses = ["Pending", "Complete", "In Progress"]
            status = data.get("status", "Pending")

            if status not in allowed_statuses:
                return {
                    "error": f"Invalid status '{status}'. Allowed values are: {', '.join(allowed_statuses)}"
                }, 400

            new_task = TaskManager(
                user_id=data.get("user_id"),
                assignee_id=data.get("assignee_id"),
                task=data.get("task"),
                priority=data.get("priority"),
                assigned_date=datetime.datetime.utcnow(),
                due_date=datetime.datetime.strptime(data["due_date"], "%Y-%m-%d") if data.get("due_date") else None,
                status=status,
                closing_date=datetime.datetime.strptime(data["closing_date"], "%Y-%m-%d") if data.get("closing_date") else None
            )

            db.session.add(new_task)
            db.session.commit()

            # ✅ Send push notification to the assignee
            self.send_push_to_user(new_task.assignee_id, new_task.task, new_task.priority)

            return {
                "message": "Task created successfully",
                "task": {
                    "task_id": new_task.task_id,
                    "task": new_task.task,
                    "assignee_id": new_task.assignee_id,
                    "status": new_task.status,
                    "priority": new_task.priority,
                    "due_date": str(new_task.due_date) if new_task.due_date else None
                }
            }, 201

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 400

    def send_push_to_user(self, user_id, task_name, priority):
        """Send push notification to all subscriptions for a user."""
        subscriptions = PushSubscription.query.filter_by(user_id=user_id).all()
        if not subscriptions:
            print(f"No push subscriptions found for user {user_id}")
            return

        # ✅ Fetch VAPID keys from app config
        vapid_private_key = current_app.config.get("VAPID_PRIVATE_KEY")
        vapid_email = current_app.config.get("VAPID_EMAIL")

        payload = {
            "title": f"New Task Assigned ({priority} Priority)",
            "body": f"{task_name}",
            "icon": "/logo192.png",
        }

        for sub in subscriptions:
            try:
                webpush(
                    subscription_info={
                        "endpoint": sub.endpoint,
                        "keys": {
                            "p256dh": sub.p256dh,
                            "auth": sub.auth,
                        },
                    },
                    data=json.dumps(payload),
                    vapid_private_key=vapid_private_key,
                    vapid_claims={"sub": vapid_email},
                )
                print(f"Push sent to user {user_id} subscriber {sub.id}")
            except WebPushException as e:
                print(f"Push failed for {sub.id}: {repr(e)}")


class GetTasks(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        # Use joinedload to eagerly load the assigner and assignee relationships
        tasks = TaskManager.query.options(
            joinedload(TaskManager.assigner),
            joinedload(TaskManager.assignee)
        ).all()
        
        if not tasks:
            return {"message": "No tasks found"}, 404

        return [
            {
                "task_id": task.task_id,
                "assigner_id": task.user_id,
                "assigner_username": task.assigner.username if task.assigner else "Unknown",
                "assignee_id": task.assignee_id,
                "assignee_username": task.assignee.username if task.assignee else "Unknown",
                "task": task.task,
                "priority":task.priority,
                "assigned_date": str(task.assigned_date),
                "due_date": str(task.due_date) if task.due_date else None,
                "status": task.status,
                "closing_date": str(task.closing_date) if task.closing_date else None
            }
            for task in tasks
        ], 200


class TaskResource(Resource):
    @jwt_required()
    def get(self, task_id):
        # Use joinedload to eagerly load the assigner and assignee relationships
        task = TaskManager.query.options(
            joinedload(TaskManager.assigner),
            joinedload(TaskManager.assignee)
        ).get(task_id)
        
        if not task:
            return jsonify({"error": "Task not found"}), 404

        return jsonify({
            "task_id": task.task_id,
            "assigner_id": task.user_id,
            "assigner_username": task.assigner.username if task.assigner else "Unknown",
            "assignee_id": task.assignee_id,
            "assignee_username": task.assignee.username if task.assignee else "Unknown",
            "task": task.task,
            "priority":task.priority,
            "assigned_date": str(task.assigned_date),
            "due_date": str(task.due_date),
            "status": task.status,
            "closing_date": str(task.closing_date)
        })

    @jwt_required()
    def put(self, task_id):
        task = TaskManager.query.get(task_id)
        if not task:
            return jsonify({"error": "Task not found"}), 404

        data = request.get_json()

        try:
            task.task = data.get("task", task.task)
            task.assignee_id = data.get("assignee_id", task.assignee_id)
            task.status = data.get("status", task.status)
            task.priority = data.get("priority", task.priority)
            if data.get("due_date"):
                task.due_date = datetime.datetime.strptime(data["due_date"], "%Y-%m-%d")
            if data.get("closing_date"):
                task.closing_date = datetime.datetime.strptime(data["closing_date"], "%Y-%m-%d")

            db.session.commit()

            return jsonify({"message": "Task updated successfully"})

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 400

    @jwt_required()
    def delete(self, task_id):
        task = TaskManager.query.get(task_id)
        if not task:
            return jsonify({"error": "Task not found"}), 404

        try:
            db.session.delete(task)
            db.session.commit()
            return jsonify({"message": "Task deleted successfully"})
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 400


class PendingTasks(Resource):
    @jwt_required()
    def get(self, user_id):
        # Use joinedload to eagerly load the assigner relationship
        tasks = TaskManager.query.options(
            joinedload(TaskManager.assigner)
        ).filter_by(assignee_id=user_id, status="Pending").all()
        
        if not tasks:
            return jsonify({"message": "No pending tasks for this user"})

        return jsonify([
            {
                "task_id": t.task_id,
                "task": t.task,
                "priority": t.priority,
                "assigner_username": t.assigner.username if t.assigner else "Unknown",
                "due_date": str(t.due_date),
                "assigned_date": str(t.assigned_date),
                "status": t.status
            } for t in tasks
        ])


class ViewTask(Resource):
    @jwt_required()
    def get(self, task_id):
        # Use joinedload to eagerly load the assigner and assignee relationships
        task = TaskManager.query.options(
            joinedload(TaskManager.assigner),
            joinedload(TaskManager.assignee)
        ).get(task_id)
        
        if not task:
            return jsonify({"error": "Task not found"}), 404

        return jsonify({
            "task_id": task.task_id,
            "task": task.task,
            "assigner_id": task.user_id,
            "assigner_username": task.assigner.username if task.assigner else "Unknown",
            "assignee_id": task.assignee_id,
            "priority": task.priority,
            "assignee_username": task.assignee.username if task.assignee else "Unknown",
            "assigned_date": str(task.assigned_date),
            "due_date": str(task.due_date),
            "status": task.status,
            "closing_date": str(task.closing_date) if task.closing_date else None
        })


class AcknowledgeTask(Resource):
    @jwt_required()
    def put(self, task_id):
        task = TaskManager.query.get(task_id)
        if not task:
            return jsonify({"error": "Task not found"}), 404

        if task.status == "Pending":
            task.status = "In Progress"
        elif task.status == "In Progress":
            task.status = "Closed"
            task.closing_date = datetime.datetime.utcnow()
        else:
            return jsonify({"message": f"Task is already {task.status}"}), 400

        try:
            db.session.commit()
            return jsonify({"message": f"Task status updated to {task.status}"})
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 400


class CompleteTask(Resource):
    @jwt_required()
    def put(self, task_id):
        """
        Mark a task as complete
        """
        task = TaskManager.query.get(task_id)
        if not task:
            return {"error": "Task not found"}, 404

        # Check if task is already completed
        if task.status == "Complete":
            return {"message": "Task is already completed"}, 400

        try:
            # Update task status to complete and set closing date
            task.status = "Complete"
            task.closing_date = datetime.datetime.utcnow()
            
            db.session.commit()

            return {
                "message": "Task marked as complete successfully",
                "task": {
                    "task_id": task.task_id,
                    "status": task.status,
                    "closing_date": str(task.closing_date)
                }
            }, 200

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 400

