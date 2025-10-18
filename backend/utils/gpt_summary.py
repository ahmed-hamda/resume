import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    project=os.getenv("OPENAI_PROJECT_ID")
)

def summarize_with_gpt(text, max_words=600):
    prompt = f"""
Tu es un assistant intelligent. Résume ce texte en français de manière claire et structurée, avec des sections si possible. Le résumé doit faire moins de {max_words} mots.

Texte :
{text[:4000]}
    """

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.3
    )

    return response.choices[0].message.content.strip()
