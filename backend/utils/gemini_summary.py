import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configuration de l'API Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Modèle Gemini utilisé
model = genai.GenerativeModel("gemini-2.5-flash")  # tu peux mettre "gemini-2.5-flash"

def chunk_text(text, max_chars=6000):
    """
    Découpe un texte en blocs de taille max_chars
    pour respecter les limites de l'API Gemini.
    """
    chunks = []
    while len(text) > max_chars:
        split_index = text.rfind(" ", 0, max_chars)
        if split_index == -1:
            split_index = max_chars
        chunks.append(text[:split_index])
        text = text[split_index:].strip()
    if text:
        chunks.append(text)
    return chunks

def summarize_with_gemini(text, max_words=800):
    """
    Résume un texte en plusieurs parties si nécessaire,
    puis fusionne les résumés.
    """
    chunks = chunk_text(text, max_chars=6000)
    partial_summaries = []

    for i, chunk in enumerate(chunks, start=1):
        prompt = f"""
Tu es un assistant pédagogique expert capable de résumer tout type de document
(cours, article scientifique, texte littéraire, rapport technique, etc.).

Ton objectif est de produire un résumé clair, concis et structuré qui conserve :
- Les idées principales et secondaires importantes
- Les notions clés, définitions et concepts essentiels
- Les détails techniques, paramètres et exemples si le texte en contient
- Les explications importantes pour comprendre le sujet
- Les étapes ou procédures décrites dans le document

Règles :
1. Structure le résumé avec des titres et sous-titres.
2. Utilise des listes à puces ou numérotées si nécessaire.
3. Adapte le niveau de détail à la complexité du texte.
4. Ne pas omettre les sections situées à la fin du texte.
5. Reste neutre et objectif.

Résumé de la partie {i} sur {len(chunks)} (max {max_words} mots) :

Texte :
{chunk}
"""
        response = model.generate_content(prompt)
        partial_summaries.append(response.text.strip())

    # Fusionner les résumés partiels
    summaries_text = "\n\n".join(partial_summaries)  # ✅ Correction ici
    fusion_prompt = f"""
Voici plusieurs résumés partiels d'un même document :

{summaries_text}

Fusionne-les en un seul résumé clair, structuré et cohérent,
sans répétitions, en conservant tous les points importants.
Ne dépasse pas {max_words} mots.
"""
    fusion_response = model.generate_content(fusion_prompt)
    return fusion_response.text.strip()


def call_gemini_api(prompt: str) -> str:
    """
    Envoie un prompt brut à Gemini et retourne le texte généré.
    """
    model = genai.GenerativeModel("gemini-2.5-flash")
    resp = model.generate_content(prompt)
    return resp.text if resp and resp.text else ""