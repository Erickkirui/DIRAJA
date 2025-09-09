from flask import request, current_app
from flask_restful import Resource
import re

# class AskAI(Resource):
#     def post(self):
#         data = request.get_json()
#         question = data.get("question", "")

#         if not question:
#             return {"error": "No question provided"}, 400

#         try:
#             # Step 1: Generate SQL query from LLM
#             sql = current_app.db_chain.invoke({"question": question})

#             # Step 2: Clean SQL (remove ```sql fences and extra newlines)
#             if isinstance(sql, dict) and "text" in sql:
#                 sql = sql["text"]

#             # Regex to remove markdown code blocks
#             sql = re.sub(r"```sql|```", "", sql).strip()

#             # Step 3: Execute query directly with database
#             result = current_app.sql_database.run(sql)

#             return {
#                 "sql": sql,
#                 "answer": str(result)
#             }, 200

#         except Exception as e:
#             return {"error": f"Error: {str(e)}"}, 500

# class AskAI(Resource):
#     def post(self):
#         data = request.get_json()
#         question = data.get("question", "")

#         if not question:
#             return {"error": "No question provided"}, 400

#         try:
#             # Step 1: Generate SQL query from LLM
#             sql = current_app.db_chain.invoke({"question": question})

#             # Step 2: Sanitize - remove any markdown, explanations, or extra text
#             sql = sql.replace("```sql", "").replace("```", "").strip()

#             # Keep only the first valid SQL statement (in case of hallucinations)
#             match = re.search(r"(SELECT|INSERT|UPDATE|DELETE).*?;", sql, re.IGNORECASE | re.DOTALL)
#             if match:
#                 sql = match.group(0).strip()
#             else:
#                 return {"error": "No valid SQL query was generated"}, 500

#             # Step 3: Execute SQL safely
#             result = current_app.sql_database.run(sql)

#             # Step 4: Generate a friendly explanation (separate from SQL)
#             explanation_prompt = f"""
#             The user asked: "{question}"

#             The SQL query executed was:
#             {sql}

#             The raw database result was:
#             {result}

#             Please explain the result in clear, simple language for a manager with no SQL knowledge.
#             """
#             explanation = current_app.llm.invoke(explanation_prompt)

#             return {
#                 "sql": sql,
#                 "result": str(result),
#                 "explanation": str(explanation)
#             }, 200

#         except Exception as e:
#             return {"error": f"Error: {str(e)}"}, 500



# class AskAI(Resource):
#     def post(self):
#         data = request.get_json()
#         question = data.get("question", "")

#         if not question:
#             return {"error": "No question provided"}, 400

#         try:
#             # Step 1: Generate SQL from the question
#             sql = current_app.db_chain.invoke({"question": question})

#             # 🛠️ Sanitize SQL - strip markdown fences and 'sql' hints
#             sql = re.sub(r"```sql|```", "", sql).strip()

#             # Step 2: Execute SQL against DB
#             result = current_app.sql_database.run(sql)

#             # Step 3: Use LLM to turn result into a natural answer
#             explanation_prompt = f"""
#             The user asked: "{question}"

#             The database returned: {result}

#             Give a clear, natural language answer for the user.
#             """
#             answer = current_app.llm.invoke(explanation_prompt)

#             return {"answer": answer.content}, 200

#         except Exception as e:
#             return {"error": f"Error: {str(e)}"}, 500




from flask import request, current_app
from flask_restful import Resource
import re
import os

DEBUG_MODE = os.getenv("DEBUG_MODE", "false").lower() == "true"

class AskAI(Resource):
    def post(self):
        data = request.get_json()
        question = data.get("question", "")

        if not question:
            return {"error": "No question provided"}, 400

        try:
            # Step 1: Generate SQL from the question
            sql = current_app.db_chain.invoke({"question": question})

            # 🛠️ Sanitize SQL - strip markdown fences and 'sql' hints
            sql = re.sub(r"```sql|```", "", sql).strip()

            # Step 2: Execute SQL against DB
            try:
                result = current_app.sql_database.run(sql)
            except Exception:
                # Friendly fallback if SQL execution fails
                return {
                    "answer": "I couldn't find a proper response from the database for your question. Please rephrase or try again."
                }, 200

            # Step 3: Use LLM to turn result into a natural answer
            explanation_prompt = f"""
            The user asked: "{question}"

            The database returned: {result}

            Give a clear, natural language answer for the user.
            """
            answer = current_app.llm.invoke(explanation_prompt)

            if DEBUG_MODE:
                # Show everything for debugging
                return {
                    "sql": sql,
                    "raw_result": str(result),
                    "answer": answer.content
                }, 200
            else:
                # Production mode → clean answer only
                return {"answer": answer.content}, 200

        except Exception as e:
            # Final catch-all fallback
            return {
                "answer": "Something went wrong while processing your request. Please try again later."
            }, 200

