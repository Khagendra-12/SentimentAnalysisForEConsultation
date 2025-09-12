import os
from PyPDF2 import PdfReader
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import torch.nn.functional as F
import spacy

# load English (or multilingual model)
nlp = spacy.load("en_core_web_sm")   # or "xx_sent_ud_sm"

def extract_sentences(text):
    doc = nlp(text)
    comments = [sent.text.strip() for sent in doc.sents if sent.text.strip()]
    return comments

# Load model
tokenizer = AutoTokenizer.from_pretrained("nlptown/bert-base-multilingual-uncased-sentiment")
model = AutoModelForSequenceClassification.from_pretrained("nlptown/bert-base-multilingual-uncased-sentiment")

# Custom sentiment function
def predict_custom_sentiment(text):
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

    return {"stars": round(weighted_avg, 2), "category": category, "fine_score": fine_score}

# Analyze PDF
def analyze_pdf(file_path):
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    
    # Split by lines
    comments = extract_sentences(text)

    results = []
    for c in comments:
        res = predict_custom_sentiment(c)
        results.append(res)
    
    # Compute overall sentiment
    if results:
        avg_stars = sum(r["stars"] for r in results) / len(results)
        if avg_stars <= 2.5:
            category = "Negative"
            fine_score = int((2.5 - avg_stars) / (2.5 - 1.0) * 99 + 1)
        elif avg_stars <= 3.5:
            category = "Neutral"
            fine_score = int((avg_stars - 2.5) / (3.5 - 2.5) * 99 + 1)
        else:
            category = "Positive"
            fine_score = int((avg_stars - 3.5) / (5.0 - 3.5) * 99 + 1)
    else:
        avg_stars, category, fine_score = 3.0, "Neutral", 50
    
    return comments, results, {
        "file": os.path.basename(file_path),
        "category": category,
        "stars": round(avg_stars, 2),
        "fine_score": fine_score
    }

pdf_file = input("Enter the full path of your PDF file: ").strip()
comments, comment_results, overall_result = analyze_pdf(pdf_file)

print(f"\n=== Sentiment Analysis for PDF: {overall_result['file']} ===\n")

# Per-comment
for i, (c, r) in enumerate(zip(comments, comment_results), 1):
    print(f"\nComment {i}: {c}")
    print(f" → Sentiment: {r['category']} (Stars: {r['stars']}, Fine Score: {r['fine_score']})")

# Overall
print(f"\n=== Overall Sentiment ===")
print(f"Category: {overall_result['category']}")
print(f"Stars: {overall_result['stars']}")
print(f"Fine Score: {overall_result['fine_score']}")