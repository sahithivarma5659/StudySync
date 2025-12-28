from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import random

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
QUESTIONS_DIR = os.path.join(BASE_DIR, "questions")


# ---------- APP SETUP ----------
app = Flask(__name__)
CORS(app)



BASE_DIR = "/Users/sahithichokkam/Desktop/Project_BeginX/StudySync"
DATA_DIR = os.path.join(BASE_DIR, "data")

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



# ---------- RUN ----------
if __name__ == "__main__":
    app.run(debug=True)