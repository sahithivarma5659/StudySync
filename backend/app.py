from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.expanduser("~/studysync_uploads")

@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "StudySync Backend Running"})

@app.route("/upload-syllabus", methods=["POST"])
def upload_syllabus():
    if "syllabus" not in request.files:
        return jsonify({"error": "No syllabus file"}), 400

    file = request.files["syllabus"]
    syllabus_dir = os.path.join(DATA_DIR, "syllabus")
    os.makedirs(syllabus_dir, exist_ok=True)

    file.save(os.path.join(syllabus_dir, file.filename))
    return jsonify({"message": "Syllabus uploaded successfully"}), 200

@app.route("/upload-pyqs", methods=["POST"])
def upload_pyqs():
    files = request.files.getlist("pyqs")
    if not files:
        return jsonify({"error": "No PYQ files"}), 400

    pyq_dir = os.path.join(DATA_DIR, "pyqs")
    os.makedirs(pyq_dir, exist_ok=True)

    for file in files:
        file.save(os.path.join(pyq_dir, file.filename))

    return jsonify({"message": "PYQs uploaded successfully"}), 200

if __name__ == "__main__":
    app.run(debug=True)