from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

# Load the tokenizer and model
tokenizer = AutoTokenizer.from_pretrained("nlptown/bert-base-multilingual-uncased-sentiment")
model = AutoModelForSequenceClassification.from_pretrained("nlptown/bert-base-multilingual-uncased-sentiment")

# Function for sentiment prediction
def predict_sentiment(text):
    tokens = tokenizer.encode(text, return_tensors="pt", truncation=True, padding=True)
    result = model(tokens)
    logits = result.logits
    predictions = torch.argmax(logits, dim=1)
    return int(predictions) + 1   # labels are 1–5 stars

# Example
comment = "This consultation process is very useful."
print("Predicted Sentiment (Stars):", predict_sentiment(comment))
