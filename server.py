import os
import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import json

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'Dataset')
ANALYSIS_SCRIPT = os.path.join(os.path.dirname(__file__), 'BaicAnalysis.py')
PER_COMMENT_SCRIPT = os.path.join(os.path.dirname(__file__), 'PerCommentAnal.py')
ALLOWED_EXTENSIONS = {'pdf'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
CORS(app)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def run_analysis(filepath):
    try:
        result = subprocess.run(
            ['python', ANALYSIS_SCRIPT, filepath],
            capture_output=True, text=True, check=True
        )
        category = "Unknown"
        fine_score = 0
        for line in result.stdout.splitlines():
            if 'Category:' in line:
                category = line.split('Category:')[1].strip()
            if 'Fine_Score:' in line:
                fine_score = int(line.split('Fine_Score:')[1].strip())
        return category, fine_score
    except Exception as e:
        print(f"Error running analysis: {e}")
        return "Error", 0

# --- MODIFIED ENDPOINT FOR MULTIPLE UPLOADS ---
@app.route('/api/upload', methods=['POST'])
def upload_and_analyze():
    # Use getlist to handle multiple files under the same field name
    files = request.files.getlist("files[]")
    
    if not files or all(f.filename == '' for f in files):
        return jsonify({"error": "No selected files"}), 400
    
    results = []
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            category, fine_score = run_analysis(filepath)
            sentiment_category = "suggestive" if category == "Neutral" else category.lower()
            
            results.append({
                "filename": filename,
                "category": sentiment_category,
                "score": fine_score
            })

    if not results:
        return jsonify({"error": "No valid PDF files were uploaded"}), 400

    return jsonify(results) # Return a list of results

# ... (rest of your server.py file is unchanged)
@app.route('/api/keywords', methods=['POST'])
def get_keywords():
    data = request.get_json()
    filenames = data.get('filenames')
    sentiment = data.get('sentiment')

    if not filenames or not sentiment:
        return jsonify({"error": "Missing filenames or sentiment"}), 400

    try:
        # Prepare arguments for the Keyword.py script
        args = ['python', 'Keyword.py', app.config['UPLOAD_FOLDER'], sentiment] + filenames
        
        result = subprocess.run(
            args,
            capture_output=True,
            text=True,
            check=True
        )
        # The script now outputs a clean JSON string
        keywords = json.loads(result.stdout)
        return jsonify(keywords)

    except subprocess.CalledProcessError as e:
        return jsonify({"error": "Keyword analysis script failed", "details": e.stderr}), 500
    except Exception as e:
        return jsonify({"error": "An error occurred during keyword analysis", "details": str(e)}), 500

@app.route('/api/review/<filename>', methods=['GET'])
def get_review_details(filename):
    # Sanitize filename to prevent directory traversal attacks
    safe_filename = secure_filename(filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename)

    if not os.path.exists(filepath):
        return jsonify({"error": "File not found"}), 404

    try:
        result = subprocess.run(
            ['python', PER_COMMENT_SCRIPT, filepath],
            capture_output=True, text=True, check=True
        )
        # The script now outputs a clean JSON string, so we parse it
        detailed_analysis = json.loads(result.stdout)
        return jsonify(detailed_analysis)

    except subprocess.CalledProcessError as e:
        return jsonify({"error": "Per-comment analysis script failed", "details": e.stderr}), 500
    except Exception as e:
        return jsonify({"error": "An error occurred during detailed analysis", "details": str(e)}), 500


if __name__ == '__main__':
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    app.run(debug=True, use_reloader=False, port=5001)