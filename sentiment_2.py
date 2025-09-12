from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import torch.nn.functional as F

# Load model and tokenizer
tokenizer = AutoTokenizer.from_pretrained("nlptown/bert-base-multilingual-uncased-sentiment")
model = AutoModelForSequenceClassification.from_pretrained("nlptown/bert-base-multilingual-uncased-sentiment")

def predict_custom_sentiment(text):
    tokens = tokenizer.encode(text, return_tensors="pt", truncation=True, padding=True)
    outputs = model(tokens)
    probs = F.softmax(outputs.logits, dim=1)  # probabilities for 1–5 stars
    stars = torch.arange(1, 6)                # tensor([1,2,3,4,5])
    weighted_avg = (probs * stars).sum().item()  # fractional star score
    
    # Determine category and fine score
    if weighted_avg <= 2.5:
        category = "Negative"
        fine_score = int((2.5 - weighted_avg) / (2.5 - 1.0) * 99 + 1)
    elif weighted_avg <= 3.5:
        category = "Neutral"
        fine_score = int((weighted_avg - 2.5) / (3.5 - 2.5) * 99 + 1)
    else:
        category = "Positive"
        fine_score = int((weighted_avg - 3.5) / (5.0 - 3.5) * 99 + 1)

    return {
        "text": text,
        "stars": round(weighted_avg, 2),
        "category": category,
        "fine_score": fine_score
    }

# Example
comments = [
    "This consultation is useless and badly managed.",
    "It was okay, nothing special.",
    "Very helpful and transparent process!"
]

for c in comments:
    print(predict_custom_sentiment(c))
