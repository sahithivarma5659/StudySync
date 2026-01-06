from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import random
from functools import wraps

# Firebase Admin SDK
import firebase_admin
from firebase_admin import credentials, auth

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
QUESTIONS_DIR = os.path.join(BASE_DIR, "questions")


# ---------- FIREBASE INITIALIZATION (Environment Variables) ----------
def initialize_firebase():
    """
    Initialize Firebase Admin SDK using environment variables.
    No JSON file required - reads credentials from env vars.
    """
    if firebase_admin._apps:
        return  # Already initialized
    
    # Read credentials from environment variables
    firebase_credentials = {
        "type": "service_account",
        "project_id": os.environ.get("FIREBASE_PROJECT_ID"),
        "private_key_id": os.environ.get("FIREBASE_PRIVATE_KEY_ID"),
        "private_key": os.environ.get("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n"),
        "client_email": os.environ.get("FIREBASE_CLIENT_EMAIL"),
        "client_id": os.environ.get("FIREBASE_CLIENT_ID"),
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": os.environ.get("FIREBASE_CLIENT_CERT_URL")
    }
    
    # Validate required environment variables
    required_vars = ["FIREBASE_PROJECT_ID", "FIREBASE_PRIVATE_KEY", "FIREBASE_CLIENT_EMAIL"]
    missing_vars = [var for var in required_vars if not os.environ.get(var)]
    
    if missing_vars:
        print(f"⚠️ Warning: Missing Firebase env vars: {missing_vars}")
        print("Firebase authentication will be disabled.")
        return False
    
    try:
        cred = credentials.Certificate(firebase_credentials)
        firebase_admin.initialize_app(cred)
        print("✅ Firebase Admin SDK initialized successfully")
        return True
    except Exception as e:
        print(f"❌ Firebase initialization error: {e}")
        return False


# ---------- TOKEN VERIFICATION DECORATOR ----------
def verify_firebase_token(f):
    """
    Decorator to verify Firebase ID token from Authorization header.
    Usage: @verify_firebase_token on any route that requires authentication.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Skip verification if Firebase is not initialized
        if not firebase_admin._apps:
            return f(*args, **kwargs)
        
        auth_header = request.headers.get("Authorization")
        
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401
        
        token = auth_header.split("Bearer ")[1]
        
        try:
            decoded_token = auth.verify_id_token(token)
            request.user = decoded_token  # Attach user info to request
            return f(*args, **kwargs)
        except auth.InvalidIdTokenError:
            return jsonify({"error": "Invalid token"}), 401
        except auth.ExpiredIdTokenError:
            return jsonify({"error": "Token expired"}), 401
        except Exception as e:
            return jsonify({"error": f"Authentication failed: {str(e)}"}), 401
    
    return decorated_function


# ---------- APP SETUP ----------
app = Flask(__name__)
CORS(app)

# Initialize Firebase on app startup
initialize_firebase()


# Use relative paths for production compatibility
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "..", "data")  # Goes up one level to StudySync/data

# ---------- HOME ----------
@app.route("/")
def home():
    return jsonify({"status": "StudySync Backend Running"})

# ---------- UPLOAD SYLLABUS ----------
@app.route("/upload-syllabus", methods=["POST"])
def upload_syllabus():
    if "syllabus" not in request.files:
        return jsonify({"error": "No syllabus file"}), 400

    file = request.files["syllabus"]
    syllabus_dir = os.path.join(DATA_DIR, "syllabus")
    os.makedirs(syllabus_dir, exist_ok=True)

    save_path = os.path.join(syllabus_dir, file.filename)
    file.save(save_path)

    print("✅ Syllabus saved at:", save_path)
    return jsonify({"message": "Syllabus uploaded successfully"}), 200

# ---------- UPLOAD PYQs ----------
@app.route("/upload-pyqs", methods=["POST"])
def upload_pyqs():
    files = request.files.getlist("pyqs")
    if not files:
        return jsonify({"error": "No PYQ files"}), 400

    pyq_dir = os.path.join(DATA_DIR, "pyqs")
    os.makedirs(pyq_dir, exist_ok=True)

    for file in files:
        save_path = os.path.join(pyq_dir, file.filename)
        file.save(save_path)
        print("✅ PYQ saved at:", save_path)

    return jsonify({"message": "PYQs uploaded successfully"}), 200

# ---------- READ SYLLABUS ----------
def read_syllabus_text():
    syllabus_dir = os.path.join(DATA_DIR, "syllabus")
    if not os.path.exists(syllabus_dir):
        return ""

    files = os.listdir(syllabus_dir)
    return " ".join(files)



# ---------- GENERATE QUIZ ----------
@app.route("/get-quiz", methods=["POST"])
def get_quiz():

    data = request.json
    units = data.get("units", [])

    quiz = {}

    for unit in units:
        file_path = os.path.join(QUESTIONS_DIR, f"unit{unit}.json")

        if os.path.exists(file_path):
            with open(file_path, "r") as f:
                questions = json.load(f)["questions"]
                quiz[f"unit_{unit}"] = random.sample(questions, 5)

    return jsonify({ "quiz": quiz })


# ---------- PROTECTED ROUTE EXAMPLE ----------
@app.route("/protected")
@verify_firebase_token
def protected_route():
    """Example of a protected route that requires Firebase authentication"""
    user = getattr(request, 'user', None)
    if user:
        return jsonify({
            "message": "Access granted",
            "user_id": user.get("uid"),
            "email": user.get("email")
        })
    return jsonify({"message": "Access granted (Firebase not configured)"})


# ---------- RUN ----------
if __name__ == "__main__":
    # Use PORT from environment variable for Render deployment
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV") != "production"
    app.run(host="0.0.0.0", port=port, debug=debug)