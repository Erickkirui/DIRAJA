import os
from flask import Flask

app = Flask(__name__)

def create_app(config_name):
    app.config.from_object(config_name)


    return app