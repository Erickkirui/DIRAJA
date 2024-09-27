import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate


app = Flask(__name__)
db = SQLAlchemy()

def initialize_models():
    from Server.Models.Users import Users
    from Server.Models.Shops import Shops
    from Server.Models.Sales import Sales
    from Server.Models.Bank import Bank
    from Server.Models.Customers import Customers
    from Server.Models.Employees import Employees

def create_app(config_name):
    app.config.from_object(config_name)
    app.config["SQLALCHEMY_DATABASE_URI"] = 'sqlite:///app.db'
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
    #Initialize DB with app
    db.init_app(app)
    migrate = Migrate(app, db)
   
    # Create database schemas
    with app.app_context():
        initialize_models()
        


    return app