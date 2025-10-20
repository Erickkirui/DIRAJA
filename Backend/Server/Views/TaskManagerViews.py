from flask import request, jsonify
from flask_restful import Resource
from app import db
from Server.Models.TaskManager import TaskManager
from Server.Models.Users import Users
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from flask import request, make_response, jsonify
from functools import wraps
import datetime
from flask_jwt_extended import jwt_required


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
    @check_role('manager')
    def post(self):
        data = request.get_json()

        try:
            new_task = TaskManager(
                user_id=data.get("user_id"),  
                assignee_id=data.get("assignee_id"),
                task=data.get("task"),
                assigned_date=datetime.datetime.utcnow(),
                due_date=datetime.datetime.strptime(data["due_date"], "%Y-%m-%d") if data.get("due_date") else None,
                status=data.get("status", "Pending"),
                closing_date=datetime.datetime.strptime(data["closing_date"], "%Y-%m-%d") if data.get("closing_date") else None
            )

            db.session.add(new_task)
            db.session.commit()

            return {
                "message": "Task created successfully",
                "task": {
                    "task_id": new_task.task_id,
                    "task": new_task.task,
                    "assignee_id": new_task.assignee_id,
                    "status": new_task.status,
                    "due_date": str(new_task.due_date) if new_task.due_date else None
                }
            }, 201   

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 400

class GetTasks(Resource):
    @jwt_required()
    @check_role('manager')
    def get(self):
        tasks = TaskManager.query.all()
        if not tasks:
            return {"message": "No tasks found"}, 404

        return [
            {
                "task_id": task.task_id,
                "assigner_id": task.user_id,
                "assignee_id": task.assignee_id,
                "task": task.task,
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
        task = TaskManager.query.get(task_id)
        if not task:
            return jsonify({"error": "Task not found"}), 404

        return jsonify({
            "task_id": task.task_id,
            "assigner_id": task.user_id,
            "assignee_id": task.assignee_id,
            "task": task.task,
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
        tasks = TaskManager.query.filter_by(assignee_id=user_id, status="Pending").all()
        if not tasks:
            return jsonify({"message": "No pending tasks for this user"})

        return jsonify([
            {
                "task_id": t.task_id,
                "task": t.task,
                "due_date": str(t.due_date),
                "assigned_date": str(t.assigned_date),
                "status": t.status
            } for t in tasks
        ])


class ViewTask(Resource):
    @jwt_required()
    def get(self, task_id):
        task = TaskManager.query.get(task_id)
        if not task:
            return jsonify({"error": "Task not found"}), 404

        return jsonify({
            "task_id": task.task_id,
            "task": task.task,
            "assigner_id": task.user_id,
            "assignee_id": task.assignee_id,
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