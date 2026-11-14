import sys, os
sys.path.insert(0, os.path.abspath("."))
import asyncio, traceback
from services.rag_service.gateway.ollama_client import OllamaClient

async def run():
    c = OllamaClient()
    try:
        r = await c.generate_json("Hello, return JSON: {\"reply\": \"hi\"}")
        print("Ollama result:", r)
    except Exception as e:
        print("Exception type:", type(e), "repr:", repr(e))
        traceback.print_exc()

asyncio.run(run())
