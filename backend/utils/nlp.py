from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer
from PyPDF2 import PdfReader
import nltk

# Vérification et téléchargement du tokenizer de NLTK
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

def extract_text_from_pdf(file_path):
    """Lit un PDF et retourne tout le texte sous forme de string."""
    text = ""
    with open(file_path, 'rb') as file:
        reader = PdfReader(file)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()

from langdetect import detect

def generate_summary(text, sentence_count=5):
    if len(text.split()) < 20:
        return text

    language = detect(text)  # 'fr', 'en', etc.
    lang = "french" if language.startswith("fr") else "english"

    parser = PlaintextParser.from_string(text, Tokenizer(lang))
    summarizer = LsaSummarizer()
    doc_sentences = list(parser.document.sentences)
    nb_sentences = min(sentence_count, len(doc_sentences))
    summary = summarizer(parser.document, nb_sentences)
    return " ".join(str(sentence) for sentence in summary)

