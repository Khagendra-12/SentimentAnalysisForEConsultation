import os
from PyPDF2 import PdfReader
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import torch.nn.functional as F


tokenizer = AutoTokenizer.from_pretrained("nlptown/bert-base-multilingual-uncased-sentiment")
model = AutoModelForSequenceClassification.from_pretrained("nlptown/bert-base-multilingual-uncased-sentiment")


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


def analyze_pdf_overall(file_path):
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"

    comments = [line.strip() for line in text.split("\n") if line.strip()]

    all_scores = []
    for c in comments:
        tokens = tokenizer.encode(c, return_tensors="pt", truncation=True, padding=True)
        outputs = model(tokens)
        probs = F.softmax(outputs.logits, dim=1)
        stars = torch.arange(1, 6)
        weighted_avg = (probs * stars).sum().item()
        all_scores.append(weighted_avg)

    overall_stars = sum(all_scores) / len(all_scores)

    if overall_stars <= 2.5:
        category = "Negative"
        fine_score = int((2.5 - overall_stars) / (2.5 - 1.0) * 99 + 1)
    elif overall_stars <= 3.5:
        category = "Neutral"
        fine_score = int((overall_stars - 2.5) / (3.5 - 2.5) * 99 + 1)
    else:
        category = "Positive"
        fine_score = int((overall_stars - 3.5) / (5.0 - 3.5) * 99 + 1)

    return {
    "file": os.path.basename(file_path),
    "category": category,
    "stars": round(overall_stars, 2),
    "fine_score": fine_score
}

pdf_file = input("Enter the full path of your PDF file: ").strip()
result = analyze_pdf_overall(pdf_file)

print(f"\n=== Overall Sentiment for {result['file']} ===")
print(f"Category: {result['category']}")
print(f"Stars: {result['stars']}")
print(f"Fine Score: {result['fine_score']}")

