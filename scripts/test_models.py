import httpx, os, dotenv
dotenv.load_dotenv()
key = os.getenv("GROQ_API_KEY")

for m in ["openai/gpt-oss-20b", "qwen/qwen3.8-27b", "openai/gpt-oss-120b"]:
    try:
        r = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={
                "model": m,
                "messages": [
                    {"role": "system", "content": "You are a medical AI. Return output formatted strictly as a JSON object."},
                    {"role": "user", "content": "Brief advice for headache. Respond in JSON with a summary field."}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.2,
                "max_completion_tokens": 1000
            },
            timeout=10.0
        )
        print(f"=== Model: {m} ===")
        print("Status:", r.status_code)
        if r.status_code == 200:
            print("Response:", r.json()["choices"][0]["message"]["content"][:200])
        else:
            print("Error:", r.text[:200])
    except Exception as e:
        print(f"Error testing {m}: {e}")
