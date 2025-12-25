from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import os

# ---------- APP SETUP ----------
app = Flask(__name__)
CORS(app)

client = OpenAI()  # uses OPENAI_API_KEY from env

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

# ---------- MOCK QUIZ (FALLBACK) ----------
def mock_quiz():
    return [
        {
            "question": "What is DBMS?",
            "options": ["Software", "Hardware", "Network", "Protocol"],
            "answer": 0
        },
        {
            "question": "Which language is used to query databases?",
            "options": ["HTML", "SQL", "CSS", "Python"],
            "answer": 1
        }
    ]

# ---------- GENERATE QUIZ ----------
@app.route("/generate-quiz", methods=["GET"])
def generate_quiz():
    syllabus_text = read_syllabus_text()

    try:
        # 🔥 TRY REAL AI
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "Generate 2 MCQ quiz questions in JSON format."
                },
                {
                    "role": "user",
                    "content": f"Syllabus topics: {syllabus_text}"
                }
            ]
        )

        quiz_text = response.choices[0].message.content
        return jsonify({
            "source": "openai",
            "quiz": quiz_text
        })

    except Exception as e:
        # 🟡 FALLBACK (VERY IMPORTANT)
        print("⚠️ OpenAI failed, using mock quiz:", e)

        return jsonify({
            "source": "mock",
            "quiz": mock_quiz()
        })

# ---------- RUN ----------
if __name__ == "__main__":
    app.run(debug=True)