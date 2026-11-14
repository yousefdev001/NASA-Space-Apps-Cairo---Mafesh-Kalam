import sys, os
sys.path.insert(0, os.path.abspath("."))
import asyncio, traceback
from services.rag_service.routers.chat import chat_with_auramed, ChatMessageRequest

async def inspect():
    req = ChatMessageRequest(query="What should I do for headache?")
    try:
        res = await chat_with_auramed(req)
        print("Provider:", res.active_provider)
        print("Summary:", res.summary)
        print("Response:", res.response)
    except Exception as e:
        traceback.print_exc()

asyncio.run(inspect())
