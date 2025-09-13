import os
import pdfplumber
from analysis import analyze_text
import sys
import json

def load_specific_pdfs_text(folder_path, filenames):
    """
    Load and combine text from a specific list of PDF files in a folder.
    """
    all_text = ""
    for filename in filenames:
        if filename.lower().endswith(".pdf"):
            file_path = os.path.join(folder_path, filename)
            if os.path.exists(file_path):
                with pdfplumber.open(file_path) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            all_text += page_text + " "
    return all_text.strip()

if __name__ == "__main__":
    # --- NEW SCRIPT LOGIC ---
    # Arguments will be: script_name, folder_path, sentiment_filter, file1, file2, ...
    if len(sys.argv) < 4:
        print("Usage: python Keyword.py <folder_path> <sentiment_filter> <file1> <file2> ...")
        sys.exit(1)

    folder = sys.argv[1]
    sentiment_filter = sys.argv[2]
    # Map the frontend's "suggestive" to the backend's "neutral"
    if sentiment_filter == "suggestive":
        sentiment_filter = "neutral"
        
    filenames = sys.argv[3:]

    combined_text = load_specific_pdfs_text(folder, filenames)
    
    if not combined_text:
        print(json.dumps({})) # Print empty JSON if no text
        sys.exit(0)

    # Use the modified analyze_text function with the sentiment filter
    result = analyze_text(combined_text, sentiment_filter=sentiment_filter)

    # Print the result as a JSON string so the server can easily parse it
    print(json.dumps(result))