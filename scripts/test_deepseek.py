import sys, os
sys.path.insert(0, os.path.abspath("."))
import asyncio, time
from services.rag_service.gateway.ollama_client import OllamaClient

async def run():
    c = OllamaClient(default_model="deepseek-r1:8b", timeout_seconds=40.0)
    t0 = time.time()
    try:
        r = await c.generate_json("You are AuraMed. Return JSON: {\"reply\": \"DeepSeek is fast and ready\"}")
        print("Time:", round(time.time() - t0, 2), "s")
        print("Result:", r)
    except Exception as e:
        print("Error:", e)

asyncio.run(run())
