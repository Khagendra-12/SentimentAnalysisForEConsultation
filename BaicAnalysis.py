import os
from PyPDF2 import PdfReader
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import torch.nn.functional as F
import sys

# (Your functions remain the same)
tokenizer = AutoTokenizer.from_pretrained("nlptown/bert-base-multilingual-uncased-sentiment")
model = AutoModelForSequenceClassification.from_pretrained("nlptown/bert-base-multilingual-uncased-sentiment")

def analyze_pdf_overall(file_path):
    # ... (function content is unchanged)
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

    overall_stars = sum(all_scores) / len(all_scores) if all_scores else 0

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


if __name__ == "__main__":
    if len(sys.argv) > 1:
        pdf_file = sys.argv[1]
    else:
        pdf_file = input("Enter the full path of your PDF file: ").strip()

    if os.path.exists(pdf_file):
        result = analyze_pdf_overall(pdf_file)
        # --- CHANGE ---
        # Print both values on separate lines for the server to read
        print(f"Category: {result['category']}")
        print(f"Fine_Score: {result['fine_score']}")
        # --- END CHANGE ---
    else:
        print("Error: File not found")