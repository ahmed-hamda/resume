import json
import re
from utils.gemini_summary import call_gemini_api

def generate_quiz_from_summary(summary: str) -> dict:
    """
    Génère un quiz JSON à partir d’un résumé en utilisant Gemini,
    limité uniquement à des questions Vrai/Faux.
    """
    prompt = f"""
    Tu es un générateur de quiz. À partir du texte suivant :

    ----
    {summary}
    ----

    Génère un quiz au format JSON STRICT, sans texte avant/après, 
    avec UNIQUEMENT des questions Vrai/Faux (type "boolean").
    ⚠️ Pas de questions ouvertes, pas de QCM avec plusieurs choix.

    Format attendu :
    {{
      "title": "Titre du quiz",
      "questions": [
        {{
          "id": "q1",
          "type": "boolean",
          "text": "Question ?",
          "answer": [0],   // 0 = Faux, 1 = Vrai
          "explanation": "explication courte"
        }}
      ]
    }}
    """

    try:
        raw = call_gemini_api(prompt)

        # 🔍 Extraire uniquement la partie JSON
        match = re.search(r'\{.*\}', raw, re.S)
        if not match:
            raise ValueError("Pas de JSON trouvé dans la sortie Gemini")

        quiz_json = json.loads(match.group(0))

        # sécurité minimale
        if "questions" not in quiz_json or not isinstance(quiz_json["questions"], list):
            raise ValueError("Quiz JSON invalide")

        return quiz_json

    except Exception as e:
        print(f"⚠️ Gemini quiz gen failed → fallback : {e}")
        return {
            "title": "Quiz (fallback)",
            "questions": [
                {
                    "id": "q1",
                    "type": "boolean",
                    "text": "Le résumé a bien été généré ?",
                    "answer": [1],
                    "explanation": "Question générée en fallback."
                }
            ]
        }
