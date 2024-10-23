import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager


app = Flask(__name__)
db = SQLAlchemy()
jwt = JWTManager()

def initialize_models():
    from Server.Models.Users import Users
    from Server.Models.Shops import Shops
    from Server.Models.Sales import Sales
    from Server.Models.Bank import Bank
    from Server.Models.Customers import Customers
    from Server.Models.Employees import Employees
    from Server.Models.EmployeeLoan import  EmployeeLoan
    from Server.Models.Stock import Stock
    from Server.Models.Expenses import Expenses 
    from Server.Models.Inventory import Inventory
    from Server.Models.Shopstock import ShopStock
    # from Server.Models.Distribution import Distribution
    from Server.Models.Transfer import Transfer
    # from Server.Models.Purchases import Purchases

def initialize_views():
    from  Server.Views import api_endpoint
    app.register_blueprint(api_endpoint)


def create_app(config_name):
    app.config.from_object(config_name)
    app.config["SQLALCHEMY_DATABASE_URI"] = 'sqlite:///app.db'
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    #JWT SETUP KEY
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 86000))
    
    #Initialize DB with app
    db.init_app(app)
    migrate = Migrate(app, db)
    jwt.init_app(app)
   
    # Create database schemas
    with app.app_context():
        initialize_models()

    initialize_views()


        


    return app