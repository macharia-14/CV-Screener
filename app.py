from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
from utils import extract_keywords, process_resume, export_results

UPLOAD_FOLDER = 'uploads'
KEYWORDS_FOLDER = os.path.join(UPLOAD_FOLDER, 'keywords')
RESUMES_FOLDER = os.path.join(UPLOAD_FOLDER, 'resumes')
RESULTS_FOLDER = 'results'

app = Flask(__name__)
CORS(app)

os.makedirs(KEYWORDS_FOLDER, exist_ok=True)
os.makedirs(RESUMES_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/scan', methods=['POST'])
def scan():
    keyword_file = request.files.get('keyword_file')
    keywords_raw = request.form.get('keywords', '')
    resumes = request.files.getlist('cv_files')
    output_format = request.form.get('format', 'csv')
    
    if not keyword_file and not keywords_raw:
       return jsonify({'error': 'Missing keyword file or resumes'}), 400


    if not resumes:
       return jsonify({'error': 'No resumes provided'}), 400        
    
    keywords = []

    if keyword_file:
        keyword_path = os.path.join(KEYWORDS_FOLDER, keyword_file.filename)
        keyword_file.save(keyword_path)
        keywords += extract_keywords(keyword_path)

    if keywords_raw:
        keywords += [k.strip() for k in keywords_raw.split(',')if k.strip()]

    results = []
    for resume in resumes:
        resume_path = os.path.join(RESUMES_FOLDER, resume.filename)
        resume.save(resume_path)
        score, matched_keywords = process_resume(resume_path, keywords)
        results.append({
            'fileName': resume.filename, 
            'score': score, 
            'matchedKeywords': matched_keywords
        })

    print("✅ Returning results:", results)

    return jsonify({'results': results})

if __name__ == '__main__':
    app.run(debug=True)
