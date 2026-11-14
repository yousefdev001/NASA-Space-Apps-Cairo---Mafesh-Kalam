import os
import httpx

key = os.getenv("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY")
payload = {
    "contents": [{"parts": [{"text": "Hello, answer in JSON: {\"status\": \"ready\"}"}]}],
    "generationConfig": {"response_mime_type": "application/json"}
}
r = httpx.post(
    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={key}",
    json=payload,
    timeout=10.0
)
print("Status:", r.status_code)
if r.status_code == 200:
    print("Content:", r.json()["candidates"][0]["content"]["parts"][0]["text"])
else:
    print("Error:", r.text)
