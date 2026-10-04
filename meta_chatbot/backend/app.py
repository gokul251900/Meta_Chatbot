import os
from typing import List
from openai import OpenAI
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
if not NVIDIA_API_KEY:
    raise RuntimeError(
        "NVIDIA_API_KEY is not configured. Create backend/.env and add your NVIDIA API key."
    )

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=NVIDIA_API_KEY,
)

MODEL_NAME = "meta/muse-glimmer-30b"

app = FastAPI(
    title="AI Programming Assistant",
    description="AI programming assistant powered by an NVIDIA-hosted model",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_INSTRUCTION = """
You are an expert AI Programming Assistant.

Your primary purpose is helping users learn programming, develop software,
debug errors, design applications, and understand AI/ML concepts.

Support Python, Java, JavaScript, TypeScript, C, C++, C#, HTML, CSS, SQL,
MongoDB, FastAPI, Django, React, Node.js, Git/GitHub, DSA, AI, ML, and DL.

When explaining:
- Use simple language.
- Start from fundamentals.
- Give practical examples.
- Explain code line by line when useful.
- Explain why code works and common mistakes.

When debugging:
1. Identify the likely cause.
2. Explain it.
3. Show corrected code.
4. Explain the correction.
5. Give required commands if applicable.

When writing code:
- Use Markdown code blocks with the language name.
- Prefer clean, readable code.
- Mention dependencies when necessary.
- Do not invent libraries or APIs.

For larger projects:
1. Explain architecture.
2. Create folder structure.
3. Build backend.
4. Build frontend.
5. Connect components.
6. Explain configuration.
7. Explain how to run and test.
8. Explain common errors.

If the user says "teach me", teach progressively with examples.
Do not execute dangerous commands or provide instructions intended to compromise systems.
Be accurate, practical, and beginner-friendly.
"""


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: List[Message] = []


class ChatResponse(BaseModel):
    response: str


@app.get("/")
def root():
    return {"message": "AI Programming Assistant API is running"}


@app.get("/api/health")
def health():
    return {"status": "ok", "model": MODEL_NAME}


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    try:
        messages = [{"role": "system", "content": SYSTEM_INSTRUCTION}]
        for m in request.history:
            role = m.role if m.role in ("user", "assistant", "system") else "user"
            messages.append({"role": role, "content": m.content})
        messages.append({"role": "user", "content": request.message})

        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            temperature=1,
            top_p=0.95,
            max_tokens=8192,
            stream=False,
        )

        content = completion.choices[0].message.content
        if not content:
            raise HTTPException(status_code=500, detail="Model returned an empty response.")

        return ChatResponse(response=content)

    except HTTPException:
        raise
    except Exception as e:
        print("Chat completion error:", e)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    # quick manual smoke test — not run on import/reload
    test = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": "Which number is larger, 9.11 or 9.8?"}],
        temperature=1,
        top_p=0.95,
        max_tokens=256,
        stream=False,
    )
    print(test.choices[0].message.content)