import re
from collections import Counter
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from keybert import KeyBERT
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Initialize models
stop_words = set(stopwords.words("english"))
kw_model = KeyBERT()
analyzer = SentimentIntensityAnalyzer()

def clean_text(text):
    """
    Lowercase, remove non-alpha characters, tokenize, remove stopwords and short words
    """
    text = text.lower()
    text = re.sub(r"[^a-z\s]", " ", text)
    tokens = word_tokenize(text)
    tokens = [w for w in tokens if w not in stop_words and len(w) > 2]
    return tokens

def analyze_text(text, top_n_keywords=20):
    """
    Analyze text: keywords, frequency, sentiment
    Returns dict: {word: {count, sentiment}}
    """
    tokens = clean_text(text)
    counts = Counter(tokens)

    # Extract keywords using KeyBERT
    keywords = kw_model.extract_keywords(" ".join(tokens), top_n=top_n_keywords)
    keyword_set = set(word for word, _ in keywords)

    result = {}
    for word, freq in counts.items():
        if word in keyword_set:
            sentiment_score = analyzer.polarity_scores(word)["compound"]
            if sentiment_score >= 0.05:
                sentiment = "positive"
            elif sentiment_score <= -0.05:
                sentiment = "negative"
            else:
                sentiment = "neutral"

            result[word] = {"count": freq, "sentiment": sentiment}
    return result
