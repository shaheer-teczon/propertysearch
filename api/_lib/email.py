import os
import smtplib
from email.mime.text import MIMEText

from .config import logger


EMAIL_SMTP_SERVER = os.getenv("EMAIL_SMTP_SERVER")
EMAIL_SMTP_PORT = os.getenv("EMAIL_SMTP_PORT")


def send_email(to_email: str, subject: str, body: str) -> bool:
    """Send an email notification"""
    from_email = os.getenv("SENDER_EMAIL")
    email_password = os.getenv("EMAIL_PASSWORD")
    if not email_password:
        logger.warning("EMAIL_PASSWORD not set, skipping email send")
        return False

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = to_email

    try:
        with smtplib.SMTP_SSL(EMAIL_SMTP_SERVER, EMAIL_SMTP_PORT) as server:
            server.login(from_email, email_password)
            server.sendmail(from_email, to_email, msg.as_string())
        return True
    except smtplib.SMTPAuthenticationError:
        logger.error("Authentication Error: Check your Gmail credentials or app password")
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
    return False


def send_tour_confirmation_email(email, name, property_name, date, time):
    """
    Send confirmation email for tour scheduling using smtplib
    """
    from_email = os.getenv("SENDER_EMAIL")
    email_password = os.getenv("EMAIL_PASSWORD")
    if not email_password:
        logger.warning("EMAIL_PASSWORD not set, skipping tour confirmation email")
        return False

    smtp_server = os.getenv("EMAIL_SMTP_SERVER")
    smtp_port = os.getenv("EMAIL_SMTP_PORT")

    body = f"""
    Hello {name},

    Thank you for scheduling a tour of {property_name} on {date} at {time}.

    Your tour details:
    - Property: {property_name}
    - Date: {date}
    - Time: {time}

    Please arrive 5 minutes early. If you need to reschedule, please contact us as soon as possible.

    We look forward to showing you the property!

    Best regards,
    The Property Management Team
    """

    msg = MIMEText(body)
    msg["Subject"] = f"Your Tour of {property_name} is Confirmed!"
    msg["From"] = from_email
    msg["To"] = email

    try:
        server = smtplib.SMTP(smtp_server, int(smtp_port))
        server.starttls()
        server.login(from_email, email_password)
        text = msg.as_string()
        server.sendmail(from_email, email, text)
        server.quit()
        return True
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        return False
