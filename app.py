import os
import pdfplumber
from analysis import analyze_text
import nltk
nltk.download("punkt")
nltk.download("stopwords")
nltk.download("punkt_tab")


def load_pdfs_from_folder(folder_path):
    """
    Load text from all PDFs in a folder.
    Returns dict: {filename: text}
    """
    pdf_texts = {}
    for filename in os.listdir(folder_path):
        if filename.lower().endswith(".pdf"):
            file_path = os.path.join(folder_path, filename)
            all_text = ""
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        all_text += page_text + " "
            pdf_texts[filename] = all_text.strip()
    return pdf_texts

def main():
    folder = input("Enter path to PDF folder: ").strip()
    if not os.path.exists(folder):
        print("Folder does not exist!")
        return

    pdf_texts = load_pdfs_from_folder(folder)
    if not pdf_texts:
        print("No PDF files found in the folder.")
        return

    for filename, text in pdf_texts.items():
        print(f"\n=== Analysis for {filename} ===")
        if not text:
            print("No text extracted from this PDF.")
            continue

        result = analyze_text(text)
        if not result:
            print("No keywords detected.")
            continue

        for word, info in result.items():
            print(f"{word}: count={info['count']}, sentiment={info['sentiment']}")

if __name__ == "__main__":
    main()
