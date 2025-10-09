from app import db
import datetime

class TaskManager(db.Model):
    __tablename__ = "task_manager"

    task_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.users_id'), nullable=False)  # Assigner
    assignee_id = db.Column(db.Integer, db.ForeignKey('users.users_id'), nullable=False)  # Assignee
    task = db.Column(db.String(255), nullable=False)
    assigned_date = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)
    due_date = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(50), default="Pending", nullable=False)  # e.g., Pending, In Progress, Completed
    closing_date = db.Column(db.DateTime, nullable=True)

    # Relationships
    assigner = db.relationship('Users', foreign_keys=[user_id], backref='assigned_tasks')
    assignee = db.relationship('Users', foreign_keys=[assignee_id], backref='received_tasks')

    def __repr__(self):
        return (f"TaskManager(task_id={self.task_id}, user_id={self.user_id}, assignee_id={self.assignee_id}, "
                f"task='{self.task}', assigned_date='{self.assigned_date}', due_date='{self.due_date}', "
                f"status='{self.status}', closing_date='{self.closing_date}')")
