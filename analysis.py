import re
from collections import Counter
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from keybert import KeyBERT
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

stop_words = set(stopwords.words("english"))
kw_model = KeyBERT()
analyzer = SentimentIntensityAnalyzer()

def clean_text(text):
    text = text.lower()
    text = re.sub(r"[^a-z\s]", " ", text)
    tokens = word_tokenize(text)
    tokens = [w for w in tokens if w not in stop_words and len(w) > 2]
    return tokens

# --- MODIFIED FUNCTION ---
def analyze_text(text, top_n_keywords=10, sentiment_filter=None):
    """
    Analyzes text and returns the top N keywords for a specific sentiment,
    sorted by frequency.
    """
    tokens = clean_text(text)
    counts = Counter(tokens)

    # Request more keywords from KeyBERT to ensure a good pool for filtering
    keywords = kw_model.extract_keywords(" ".join(tokens), top_n=top_n_keywords * 3)
    keyword_set = set(word for word, _ in keywords)

    result_list = []
    for word, freq in counts.items():
        if word in keyword_set:
            sentiment_score = analyzer.polarity_scores(word)["compound"]
            sentiment = "neutral"
            if sentiment_score >= 0.05:
                sentiment = "positive"
            elif sentiment_score <= -0.05:
                sentiment = "negative"

            # If a filter is provided, only add keywords that match the sentiment
            if sentiment_filter and sentiment == sentiment_filter:
                result_list.append({"word": word, "count": freq})
            elif not sentiment_filter:
                result_list.append({"word": word, "count": freq})

    # Sort the results by frequency (highest first) and take the top N
    sorted_results = sorted(result_list, key=lambda x: x['count'], reverse=True)
    
    # Convert the sorted list into the final dictionary format
    final_result = {item['word']: {"count": item['count']} for item in sorted_results[:top_n_keywords]}
    
    return final_result