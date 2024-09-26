import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate


app = Flask(__name__)
db = SQLAlchemy()

def initialize_models():
    pass

def create_app(config_name):
    app.config.from_object(config_name)
   
    #Initialize DB with app
    db.init_app(app)
    migrate = Migrate(app, db)
   
    # Create database schemas
    with app.app_context():
        initialize_models()


    return app