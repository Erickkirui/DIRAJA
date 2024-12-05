from app import create_app
from config import app_config

config_name = "production"
app = create_app(app_config)

if __name__ == '__main__':

    # app.run(host='0.0.0.0' , port=5000) for running on local host
    app.run()