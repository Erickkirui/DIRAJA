from flask import request, current_app
from flask_restful import Resource

class AskAI(Resource):
    def post(self):
        data = request.get_json()
        question = data.get("question", "")

        if not question:
            return {"error": "No question provided"}, 400

        try:
            response = current_app.db_chain.invoke({"query": question})
            
            # The response should have a 'text' key with the final answer
            if hasattr(response, 'get') and 'text' in response:
                return {"answer": response['text']}, 200
            else:
                # If not, try to access it as an attribute
                return {"answer": getattr(response, 'text', str(response))}, 200
                
        except Exception as e:
            return {"error": f"Error: {str(e)}"}, 500