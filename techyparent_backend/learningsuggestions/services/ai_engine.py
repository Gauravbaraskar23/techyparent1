# services/ai_engine.py
# # services/ai_engine.py
import requests
from django.conf import settings


class AIEngine:

    @staticmethod
    def generate_reply(child, session, message, history):
        try:
            # Build conversation history (optional)
            past_messages = ""
            for msg in history:
                role = "User" if msg.sender == "child" else "Assistant"
                past_messages += f"{role}: {msg.content}\n"

            prompt = f"""
You are a friendly AI learning assistant for children.

Child name: {child.name}

Rules:
- Be simple and friendly
- Encourage learning
- Give short answers
- Use emojis sometimes

Conversation:
{past_messages}

User: {message}
Assistant:
"""

            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "mistralai/mistral-7b-instruct",  # FREE model
                    "messages": [
                        {"role": "user", "content": prompt}
                    ]
                }
            )

            data = response.json()

            return data["choices"][0]["message"]["content"]

        except Exception as e:
            print("🔥 AI ERROR:", str(e))
            return "Hmm 🤔 I'm having trouble right now. Try again!"
# import random
# import re


# class AIEngine:

#     @staticmethod
#     def generate_reply(child, session, message, history):
#         msg = message.lower().strip()

#         # 👋 Greetings
#         if re.search(r"\b(hi|hello|hey)\b", msg):
#             return f"Hello {child.name}! 😊 What do you want to learn today?"

#         # 👤 Name
#         elif "your name" in msg:
#             return "I am your learning assistant 🤖"

#         # 🌞 Science
#         elif "sun" in msg:
#             return "The Sun is a big star 🌞 that gives us light and heat!"

#         elif "moon" in msg:
#             return "The Moon 🌙 is Earth's natural satellite. It shines at night!"

#         elif "earth" in msg:
#             return "Earth 🌍 is the planet where we live!"

#         # ➗ Math
#         elif "table" in msg:
#             return "Which table do you want? Example: 2, 5, 10 😊"

#         elif re.match(r"\d+\s*[\+\-\*/]\s*\d+", msg):
#             try:
#                 result = eval(msg)
#                 return f"The answer is {result} 😊"
#             except:
#                 return "Oops 😅 I couldn't calculate that."

#         # 🧠 Learning encouragement
#         elif "study" in msg:
#             return "Studying is great! 📚 What subject do you like?"

#         elif "help" in msg:
#             return "I'm here to help you 😊 Ask me anything!"

#         elif "2 table" in msg:
#             return "2 x 1 = 2\n2 x 2 = 4\n2 x 3 = 6\n2 x 4 = 8\n2 x 5 = 10\n2 x 6 = 12\n2 x 7 = 14\n2 x 8 = 16\n2 x 9 = 18\n2 x 10 = 20"
#         # 🎮 Fun
#         elif "joke" in msg:
#             jokes = [
#                 "Why did the student eat his homework? Because the teacher said it was a piece of cake! 🍰",
#                 "Why is math so cool? Because it has problems 😄",
#                 "Why did the computer go to school? To become smarter! 💻"
#             ]
#             return random.choice(jokes)

#         # 👋 Exit
#         elif "bye" in msg:
#             return "Goodbye! 👋 Keep learning and smiling 😊"

#         # 🤖 Smart fallback (uses history)
#         else:
#             if history:
#                 return "That's interesting! Tell me more about it 😊"
#             return random.choice([
#                 "Hmm 🤔 I am still learning that!",
#                 "Can you explain more? 😊",
#                 "Let's learn together! 🌟",
#                 "That's a great question!"
#             ])
# # from google import genai
# # from django.conf import settings


# # class AIEngine:

# #     @staticmethod
# #     def generate_reply(child, session, message, history):
# #         try:
# #             client = genai.Client(api_key=settings.GEMINI_API_KEY)

# #             system_prompt = f"""
# # You are a friendly AI learning assistant for children.

# # Child name: {child.name}

# # Rules:
# # - Be simple
# # - Be friendly
# # - Keep answers short
# # - Encourage learning
# # """

# #             # Build conversation
# #             contents = []

# #             contents.append({
# #                 "role": "user",
# #                 "parts": [{"text": system_prompt}]
# #             })

# #             # Add last 5 history messages
# #             for msg in history[-5:]:
# #                 role = "model" if msg.sender == "assistant" else "user"
# #                 contents.append({
# #                     "role": role,
# #                     "parts": [{"text": msg.content}]
# #                 })

# #             # Add current message
# #             contents.append({
# #                 "role": "user",
# #                 "parts": [{"text": message}]
# #             })

# #             # 🔥 MAIN CALL
# #             response = client.models.generate_content(
# #                 model="gemini-1.5-flash",
# #                 contents=contents
# #             )

# #             return response.text

# #         except Exception as e:
# #             print("🔥 GEMINI ERROR:", str(e))
# #             return "AI temporarily unavailable 😅"