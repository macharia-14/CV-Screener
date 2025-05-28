import os
import docx
import PyPDF2
import pandas as pd
from fpdf import FPDF
from docx import Document
from datetime import datetime

def extract_text_from_docx(file_path):
    try:
        doc = docx.Document(file_path)
        return '\n'.join([p.text for p in doc.paragraphs])
    except Exception:
        return ""

def extract_text_from_pdf(file_path):
    try:
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            return "\n".join([page.extract_text() or "" for page in reader.pages])
    except Exception:
        return ""

def extract_keywords(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".txt":
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read().split(',')
    elif ext == ".docx":
        content = extract_text_from_docx(file_path)
        return content.split(',')
    return []

def process_resume(file_path, keywords):
    ext = os.path.splitext(file_path)[1].lower()
    text = extract_text_from_pdf(file_path) if ext == '.pdf' else extract_text_from_docx(file_path)
    text = text.lower()
    return sum(1 for kw in keywords if kw.strip().lower() in text)

def export_results(results, format='csv'):
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"results_{timestamp}.{format}"
    filepath = os.path.join('results', filename)
    df = pd.DataFrame(results)

    if format == 'csv':
        df.to_csv(filepath, index=False)
    elif format == 'txt':
        with open(filepath, 'w', encoding='utf-8') as f:
            for _, row in df.iterrows():
                f.write(f"{row['filename']}: {row['match_score']} matches\n")
    elif format == 'docx':
        document = Document()
        document.add_heading("CV Screening Results", level=1)
        for _, row in df.iterrows():
            document.add_paragraph(f"{row['filename']}: {row['match_score']} matches")
        document.save(filepath)
    elif format == 'pdf':
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        pdf.cell(200, 10, "CV Screening Results", ln=True)
        for _, row in df.iterrows():
            pdf.cell(200, 10, f"{row['filename']}: {row['match_score']} matches", ln=True)
        pdf.output(filepath)

    return filepath
