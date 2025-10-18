import os
from anthropic import Anthropic, HUMAN_PROMPT, AI_PROMPT
from dotenv import load_dotenv

load_dotenv()  # Charge la clé depuis .env

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def summarize_with_claude(text, model="claude-3-haiku-20240307", max_tokens=1024):
    prompt = (
        f"{HUMAN_PROMPT} Résume le texte suivant en français, de manière claire et structurée "
        f"(avec des sections si possible). Le résumé doit faire moins de {max_tokens} tokens.\n\n"
        f"{text[:12000]}"  # Tronqué pour éviter les dépassements
        f"\n{AI_PROMPT}"
    )

    response = client.completions.create(
        prompt=prompt,
        model=model,
        max_tokens_to_sample=max_tokens,
        temperature=0.5
    )

    return response.completion.strip()
