# from flask import request, jsonify
# from flask_restful import Resource, Api
# from Server import app, db_chain  # import your app and db_chain


# class AskAI(Resource):
#     def post(self):
#         data = request.get_json()
#         question = data.get("question", "")

#         if not question:
#             return {"error": "No question provided"}, 400

#         try:
#             response = db_chain.run(question)
#             return {"answer": response}, 200
#         except Exception as e:
#             return {"error": str(e)}, 500
