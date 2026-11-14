import httpx, os, dotenv
dotenv.load_dotenv()
key = os.getenv("GROQ_API_KEY")

r = httpx.post(
    "https://api.groq.com/openai/v1/chat/completions",
    headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    json={
        "model": "openai/gpt-oss-20b",
        "messages": [{"role": "user", "content": "Hello, return JSON: {\"status\": \"ok\"}"}],
        "response_format": {"type": "json_object"},
        "reasoning_effort": "low",
        "max_completion_tokens": 1500
    },
    timeout=10.0
)
print("Status:", r.status_code)
if r.status_code == 200:
    msg = r.json()["choices"][0]["message"]
    print("Content:", msg.get("content"))
    print("Usage:", r.json().get("usage"))
else:
    print("Error:", r.text)
