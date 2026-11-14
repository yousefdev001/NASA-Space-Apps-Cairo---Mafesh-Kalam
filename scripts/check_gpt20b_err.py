import sys, os
sys.path.insert(0, os.path.abspath("."))
import asyncio, httpx, dotenv
dotenv.load_dotenv()
from shared.system_prompts import AURAMED_COPILOT_CHAT_INSTRUCTIONS

async def test():
    key = os.getenv("GROQ_API_KEY")
    prompt = "USER INQUIRY: What should I do for headache?\nEVALUATED CLINICAL SEVERITY: Nominal\nProvide instructions."
    payload = {
        "model": "openai/gpt-oss-20b",
        "messages": [
            {"role": "system", "content": AURAMED_COPILOT_CHAT_INSTRUCTIONS},
            {"role": "user", "content": prompt}
        ],
        "response_format": {"type": "json_object"},
        "reasoning_effort": "low",
        "max_completion_tokens": 1500,
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.post("https://api.groq.com/openai/v1/chat/completions", headers={"Authorization": f"Bearer {key}"}, json=payload)
        print("Status:", r.status_code)
        print("Response:", r.text)

asyncio.run(test())
