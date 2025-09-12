import os
import pdfplumber
from analysis import analyze_text

def load_all_pdfs_text(folder_path):
    """
    Load and combine text from all PDFs in a folder.
    Returns a single combined text string.
    """
    all_text = ""
    for filename in os.listdir(folder_path):
        if filename.lower().endswith(".pdf"):
            file_path = os.path.join(folder_path, filename)
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        all_text += page_text + " "
    return all_text.strip()

def main():
    folder = input("Enter path to PDF folder: ").strip()
    if not os.path.exists(folder):
        print("Folder does not exist!")
        return

    combined_text = load_all_pdfs_text(folder)
    if not combined_text:
        print("No text extracted from PDFs.")
        return

    print(f"\n=== Combined Analysis for all PDFs in {folder} ===")
    result = analyze_text(combined_text)

    if not result:
        print("No keywords detected.")
        return

    for word, info in result.items():
        print(f"{word}: count={info['count']}, sentiment={info['sentiment']}")

if __name__ == "__main__":
    main()
