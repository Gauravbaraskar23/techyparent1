import firebase_admin
from firebase_admin import credentials, messaging

cred = credentials.Certificate("firebase_config.json")
firebase_admin.initialize_app(cred)

def send_fcm_notification(device_token, title, message):
    notification = messaging.Message(
        notification=messaging.Notification(title=title, body=message),
        token=device_token
    )
    messaging.send(notification)
