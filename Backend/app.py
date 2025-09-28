import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv
from flask_mail import Mail

load_dotenv()

# ---------- Extensions ----------
db = SQLAlchemy()
jwt = JWTManager()
mail = Mail()

# ---------- Models Import ----------
def initialize_models():
    """Import all models so SQLAlchemy can discover them."""
    from Server.Models.Users import Users
    from Server.Models.Shops import Shops
    from Server.Models.Sales import Sales
    from Server.Models.Bank import Bank
    from Server.Models.Customers import Customers
    from Server.Models.Employees import Employees
    from Server.Models.EmployeeLoan import EmployeeLoan
    from Server.Models.Stock import Stock
    from Server.Models.Expenses import Expenses
    from Server.Models.Inventory import Inventory
    from Server.Models.Shopstock import ShopStock
    from Server.Models.Paymnetmethods import SalesPaymentMethods
    from Server.Models.SoldItems import SoldItem
    from Server.Models.Transfer import Transfer
    from Server.Models.LiveStock import LiveStock
    from Server.Models.ShopTransfers import ShopTransfer
    from Server.Models.SystemStockTransfer import SystemStockTransfer
    from Server.Models.AccountTypes import AccountTypes
    from Server.Models.ChartOfAccounts import ChartOfAccounts
    from Server.Models.BankAccounts import BankAccount, BankingTransaction
    from Server.Models.ItemAccountsTable import ItemAccounts
    from Server.Models.SalesDepartment import SalesDepartment
    from Server.Models.Supplier import Suppliers, SupplierHistory
    from Server.Models.InventoryV2 import InventoryV2
    from Server.Models.ShopstockV2 import ShopStockV2
    from Server.Models.ExpenseCategory import ExpenseCategory
    from Server.Models.StockReport import StockReport


# ---------- Views Import ----------
def initialize_views(app):
    """Register Flask blueprints/resources."""
    from Server.Views import api_endpoint
    app.register_blueprint(api_endpoint)


def create_app(config_name):
    app = Flask(__name__)
    CORS(app)

    # Load config
    app.config.from_object(config_name)

    # Database config
    app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+pymysql://root:@localhost/Diraja"

    # JWT config
    app.config['JWT_SECRET_KEY'] = "Soweto@2024"
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = int(
        os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 2592000)
    )

    # Mail config
    app.config['MAIL_SERVER'] = 'mail.kulima.co.ke'
    app.config['MAIL_PORT'] = 465
    app.config['MAIL_USERNAME'] = 'kukuzetureports@kulima.co.ke'
    app.config['MAIL_PASSWORD'] = 'XZbZ{9ZSPZeg'
    app.config['MAIL_USE_SSL'] = True
    app.config['MAIL_USE_TLS'] = False
    app.config['MAIL_DEFAULT_SENDER'] = 'kukuzetureports@kulima.co.ke'

    # ✅ VAPID keys (from .env)
    app.config['VAPID_PUBLIC_KEY'] = os.getenv("VAPID_PUBLIC_KEY")
    app.config['VAPID_PRIVATE_KEY'] = os.getenv("VAPID_PRIVATE_KEY")
    app.config['VAPID_EMAIL'] = os.getenv("VAPID_EMAIL")  # e.g. "mailto:admin@yourdomain.com"

    # Init extensions
    db.init_app(app)
    Migrate(app, db)
    jwt.init_app(app)
    mail.init_app(app)

    # Import models
    with app.app_context():
        initialize_models()

    # Register views
    initialize_views(app)

    return app