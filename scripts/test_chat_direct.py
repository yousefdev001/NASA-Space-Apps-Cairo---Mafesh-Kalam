import sys, os
sys.path.insert(0, os.path.abspath("."))
import asyncio
from services.rag_service.gateway.llm_gateway import gateway_instance

async def inspect():
    print("Testing generate directly...")
    try:
        provider, res = await gateway_instance.generate(
            prompt="USER INQUIRY: Astronaut has headache.\nEVALUATED CLINICAL SEVERITY: Nominal\nProvide immediate advice.",
            system_instruction="You are AuraMed Flight Surgeon AI. Return output formatted strictly as a JSON object with keys: emergency_assessment (with evidence_summary), steps (list of objects with instruction and source_chunk_id)."
        )
        print("Provider:", provider)
        print("Raw response:", res)
    except Exception as e:
        print("Exception:", e)

asyncio.run(inspect())
