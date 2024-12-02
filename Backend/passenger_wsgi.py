import sys
import os
from config import app_config

# Add the application directory to the path
sys.path.insert(0, os.path.dirname(__file__))

# Import the app object from your Flask app module
from app import create_app

# Set the environment and initialize the app with your configuration
config_name = "production"
app = create_app(app_config[config_name])  # Pass the correct config from app_config

# Passenger requires 'application' as the entry point
application = app