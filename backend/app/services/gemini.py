from google import genai

from app.core.config import settings


MODEL_NAME = "gemini-3.5-flash-lite"


def generate_inventory_explanation(inventory_data: dict) -> str:
    """
    Generate a human-readable explanation of inventory risk.

    Gemini is used only for explanation.
    All numerical calculations are performed by our analytics engine.
    """

    if not settings.GEMINI_API_KEY:
        return "AI explanation is unavailable because the Gemini API key is not configured."

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    prompt = f"""
You are an inventory risk analyst.

Explain the following inventory situation in simple,
professional language suitable for an inventory management dashboard.

Rules:
- Use ONLY the facts provided below.
- Do NOT recalculate any numerical values.
- Do NOT change any numerical values.
- Do NOT invent missing information.
- Explain why the inventory is risky.
- Explain the important factors such as expiry, excess stock,
  demand, and redistribution.
- Give a short practical recommendation based only on the
  provided facts.
- Keep the response concise.

Inventory facts:
{inventory_data}

Return:
1. Risk explanation
2. Recommended action
"""

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
        )

        return response.text or "No AI explanation was generated."

    except Exception as e:
        return f"Gemini error: {type(e).__name__}: {e}"