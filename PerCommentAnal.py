import os
from PyPDF2 import PdfReader
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import torch.nn.functional as F
import spacy
import sys
import json

# Load NLP and ML models
nlp = spacy.load("en_core_web_sm")
tokenizer = AutoTokenizer.from_pretrained("nlptown/bert-base-multilingual-uncased-sentiment")
model = AutoModelForSequenceClassification.from_pretrained("nlptown/bert-base-multilingual-uncased-sentiment")

def extract_sentences(text):
    doc = nlp(text)
    return [sent.text.strip() for sent in doc.sents if sent.text.strip()]

def predict_custom_sentiment(text):
    # This function remains unchanged
    tokens = tokenizer.encode(text, return_tensors="pt", truncation=True, padding=True)
    outputs = model(tokens)
    probs = F.softmax(outputs.logits, dim=1)
    stars = torch.arange(1, 6)
    weighted_avg = (probs * stars).sum().item()
    
    if weighted_avg <= 2.5:
        category = "Negative"
        fine_score = int((2.5 - weighted_avg) / (2.5 - 1.0) * 99 + 1)
    elif weighted_avg <= 3.5:
        category = "Neutral"
        fine_score = int((weighted_avg - 2.5) / (3.5 - 2.5) * 99 + 1)
    else:
        category = "Positive"
        fine_score = int((weighted_avg - 3.5) / (5.0 - 3.5) * 99 + 1)

    return {"stars": round(weighted_avg, 2), "category": category, "score": fine_score}

def analyze_pdf_per_comment(file_path):
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    except Exception as e:
        return {"error": f"Failed to read PDF: {str(e)}"}

    comments_text = extract_sentences(text)
    results = []
    total_score = 0
    for i, c in enumerate(comments_text, 1):
        res = predict_custom_sentiment(c)
        total_score += res['score']
        results.append({
            "id": i,
            "text": c,
            "score": res['score']
        })
    
    overall_score = round(total_score / len(results)) if results else 0
    
    return {
        "comments": results,
        "overallScore": overall_score
    }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        pdf_file = sys.argv[1]
    else:
        print(json.dumps({"error": "No file path provided."}))
        sys.exit(1)

    if os.path.exists(pdf_file):
        analysis_result = analyze_pdf_per_comment(pdf_file)
        # Output the entire result as a single JSON string
        print(json.dumps(analysis_result))
    else:
        print(json.dumps({"error": f"File not found: {pdf_file}"}))