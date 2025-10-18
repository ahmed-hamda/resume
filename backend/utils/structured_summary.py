from transformers import pipeline
import re
from PyPDF2 import PdfReader

# 1. Résumeur (modèle gratuit BART de HuggingFace)
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

# 2. Extraire le texte du PDF
def extract_text_from_pdf(file_path):
    text = ""
    with open(file_path, 'rb') as file:
        reader = PdfReader(file)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()

# 3. Identifier les sections
def split_into_sections(text):
    pattern = r"(?:(?:Chapitre|Section|Classe|Format|Architecture|Mode|Introduction)[^\n]*)"
    matches = re.split(pattern, text)
    titles = re.findall(pattern, text)
    return list(zip(titles, matches[1:]))

# 4. Résumer une section
def summarize_section(title, content):
    content = content.strip().replace("\n", " ")
    words = content.split()

    if len(words) < 40:
        return {"section": title.strip(), "summary": "⚠️ Contenu trop court pour générer un résumé."}

    try:
        content = " ".join(words[:1000])  # éviter dépassement tokens
        result = summarizer(content, max_length=150, min_length=40, do_sample=False)
        if result and "summary_text" in result[0]:
            return {"section": title.strip(), "summary": result[0]["summary_text"]}
        else:
            return {"section": title.strip(), "summary": "⚠️ Résumé non généré (résultat vide)."}
    except Exception as e:
        return {"section": title.strip(), "summary": f"⚠️ Erreur de résumé : {str(e)}"}


# 5. Résumé structuré global
def generate_structured_summary(text):
    sections = split_into_sections(text)
    summaries = [summarize_section(title, content) for title, content in sections]
    
    # 🔥 Corrigé : construire une chaîne finale
    return "\n\n".join([f"## {s['section']}\n{s['summary']}" for s in summaries])


