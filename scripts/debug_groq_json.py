import sys, os
sys.path.insert(0, os.path.abspath("."))
import asyncio, httpx, dotenv, time
dotenv.load_dotenv()
from shared.system_prompts import AURAMED_COPILOT_CHAT_INSTRUCTIONS

async def test():
    key = os.getenv("GROQ_API_KEY")
    prompt = "USER INQUIRY: What should I do for headache?\nEVALUATED CLINICAL SEVERITY: Nominal\nProvide instructions."
    
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "openai/gpt-oss-20b",
        "messages": [
            {"role": "system", "content": AURAMED_COPILOT_CHAT_INSTRUCTIONS},
            {"role": "user", "content": prompt}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
        "max_completion_tokens": 1200,
    }
    print("Waiting 2s for token bucket...")
    await asyncio.sleep(2.0)
    async with httpx.AsyncClient(timeout=20.0) as http:
        resp = await http.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
        print("Status code:", resp.status_code)
        if resp.status_code == 200:
            print("Content:", resp.json()["choices"][0]["message"]["content"][:300])
        else:
            print("Error text:", resp.text)

asyncio.run(test())
