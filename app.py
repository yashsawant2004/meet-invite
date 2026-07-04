import json
import os
import smtplib
import ssl
from datetime import datetime
from email.mime.text import MIMEText

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "responses.json")

# Optional: fill these in (or set as environment variables) if you want the
# app to also EMAIL you the moment she picks a date, instead of just saving
# it to responses.json. Leave them blank to skip emailing entirely.
MAIL_USERNAME = os.environ.get("MAIL_USERNAME", "")        # your gmail address
MAIL_APP_PASSWORD = os.environ.get("MAIL_APP_PASSWORD", "")  # gmail "app password", not your real password
MAIL_TO = os.environ.get("MAIL_TO", "yashsawant390@gmail.com")

# Secret key to view the private results page at /responses?key=...
# Change this to something only you know, especially if you deploy this
# publicly (e.g. as an environment variable ADMIN_KEY on your host).
ADMIN_KEY = os.environ.get("ADMIN_KEY", "changeme123")


def save_response(entry: dict) -> None:
    responses = []
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                responses = json.load(f)
        except (json.JSONDecodeError, OSError):
            responses = []
    responses.append(entry)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(responses, f, indent=2)


def maybe_send_email(entry: dict) -> None:
    """Sends an email only if MAIL_USERNAME + MAIL_APP_PASSWORD are configured."""
    if not (MAIL_USERNAME and MAIL_APP_PASSWORD):
        return
    try:
        body = f"She picked a date! 🎁\n\nDate: {entry['date']}\nNote: {entry['note'] or '(none)'}\nReceived: {entry['received_at']}"
        msg = MIMEText(body)
        msg["Subject"] = "She picked a date!"
        msg["From"] = MAIL_USERNAME
        msg["To"] = MAIL_TO

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
            server.login(MAIL_USERNAME, MAIL_APP_PASSWORD)
            server.sendmail(MAIL_USERNAME, [MAIL_TO], msg.as_string())
    except Exception as exc:  # noqa: BLE001
        # Never let a mail failure break the page for her — just log it.
        print(f"[gift-invite] Could not send email: {exc}")


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/submit", methods=["POST"])
def submit():
    data = request.get_json(force=True, silent=True) or {}
    date = (data.get("date") or "").strip()
    note = (data.get("note") or "").strip()

    if not date:
        return jsonify({"ok": False, "error": "No date provided"}), 400

    entry = {
        "date": date,
        "note": note,
        "received_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }

    save_response(entry)
    maybe_send_email(entry)

    print(f"[gift-invite] New date picked: {entry['date']}  |  note: {entry['note'] or '(none)'}")
    return jsonify({"ok": True})


def load_responses() -> list:
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return []


@app.route("/responses")
def view_responses():
    """Private page only you should know the URL to: /responses?key=YOUR_ADMIN_KEY"""
    key = request.args.get("key", "")
    if key != ADMIN_KEY:
        return (
            "Not authorized. Open this page as "
            "<code>/responses?key=YOUR_ADMIN_KEY</code> "
            "(the key is set in app.py or the ADMIN_KEY environment variable).",
            401,
        )
    responses = list(reversed(load_responses()))
    return render_template("responses.html", responses=responses)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
