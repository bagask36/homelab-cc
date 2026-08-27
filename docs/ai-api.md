# AI API (chatbot)

Homelab Command Center exposes an **OpenAI-compatible** HTTP API in front of Ollama on the homelab. Use it from any chatbot, SDK, or HTTP client.

Keys are created in the dashboard: **Ollama → API keys**. The secret (`hcc_…`) is shown **once**.

## Base URL

```text
https://hcc.mhswmr.net/api/v1
```

On the LAN (host network, default port):

```text
http://<host-ip>:3001/api/v1
```

Do not call Ollama (`:11434`) from the internet. Only this proxy is meant to be public, and only with a Bearer key.

## Authentication

Every request needs:

```http
Authorization: Bearer hcc_<secret>
```

| Status | Meaning |
|---|---|
| `401` | Missing or invalid key |
| `403` | Key is locked to another model |
| `502` | Dashboard cannot reach Ollama |

Optional: when you create the key, pick **Restrict to model** so the chatbot cannot switch models.

## Endpoints

| Method | Path | Use |
|---|---|---|
| `GET` | `/models` | List models available to this key |
| `POST` | `/chat/completions` | Chatbot (recommended) |
| `POST` | `/completions` | Raw prompt completion |
| `POST` | `/embeddings` | Embeddings |

CORS (`Authorization`, `Content-Type`) is enabled. For a public website, keep the key on a **server**, not in the browser.

Timeout: **5 minutes** per request (first load of a large model can be slow).

---

### `GET /models`

```bash
curl https://hcc.mhswmr.net/api/v1/models \
  -H "Authorization: Bearer hcc_…"
```

```json
{
  "object": "list",
  "data": [
    { "id": "llama3.2:latest", "object": "model" }
  ]
}
```

Use `id` as `model` in chat requests. Names must match Ollama (including the tag, e.g. `:latest`).

---

### `POST /chat/completions`

This is the endpoint for a chatbot. Same shape as [OpenAI Chat Completions](https://platform.openai.com/docs/api-reference/chat/create).

**Request**

```json
{
  "model": "llama3.2:latest",
  "messages": [
    { "role": "system", "content": "You are a helpful homelab assistant." },
    { "role": "user", "content": "What is Docker?" }
  ],
  "stream": false,
  "temperature": 0.7
}
```

| Field | Required | Notes |
|---|---|---|
| `model` | yes | From `GET /models` |
| `messages` | yes | `system`, `user`, `assistant` |
| `stream` | no | `true` = SSE token stream |
| `temperature` | no | Passed through to Ollama |
| `max_tokens` | no | Passed through when supported |

**Response** (`stream: false`)

```json
{
  "id": "chatcmpl-…",
  "object": "chat.completion",
  "model": "llama3.2:latest",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Docker is a container runtime…"
      },
      "finish_reason": "stop"
    }
  ]
}
```

Assistant text: `choices[0].message.content`.

**Streaming** (`stream: true`)

Response is `text/event-stream`. Each line is `data: {json}` with `choices[0].delta.content`; stream ends with `data: [DONE]`.

---

## Chatbot examples

Replace `hcc_…` and `llama3.2:latest` with your key and model.

### curl (one reply)

```bash
curl https://hcc.mhswmr.net/api/v1/chat/completions \
  -H "Authorization: Bearer hcc_…" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2:latest",
    "messages": [
      {"role": "system", "content": "You are a concise assistant."},
      {"role": "user", "content": "Say hello in one sentence."}
    ]
  }'
```

### curl (stream)

```bash
curl -N https://hcc.mhswmr.net/api/v1/chat/completions \
  -H "Authorization: Bearer hcc_…" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2:latest",
    "stream": true,
    "messages": [{"role": "user", "content": "Write a haiku about servers."}]
  }'
```

### Python (conversation)

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://hcc.mhswmr.net/api/v1",
    api_key="hcc_…",
)

MODEL = "llama3.2:latest"
messages = [
    {"role": "system", "content": "You are a helpful assistant."},
]

while True:
    user = input("You: ").strip()
    if not user:
        break
    messages.append({"role": "user", "content": user})
    reply = client.chat.completions.create(model=MODEL, messages=messages)
    text = reply.choices[0].message.content
    print("Bot:", text)
    messages.append({"role": "assistant", "content": text})
```

Stream tokens:

```python
stream = client.chat.completions.create(
    model=MODEL,
    messages=messages,
    stream=True,
)
for chunk in stream:
    delta = chunk.choices[0].delta.content
    if delta:
        print(delta, end="", flush=True)
```

### JavaScript / TypeScript

```ts
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://hcc.mhswmr.net/api/v1",
  apiKey: process.env.HCC_API_KEY,
});

const completion = await client.chat.completions.create({
  model: "llama3.2:latest",
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello" },
  ],
});

console.log(completion.choices[0].message.content);
```

### Next.js (server route)

Keep the key in env (`HCC_API_KEY`). The browser talks to *your* app; your app talks to Homelab CC.

```ts
// app/api/chat/route.ts
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://hcc.mhswmr.net/api/v1",
  apiKey: process.env.HCC_API_KEY,
});

export async function POST(request: Request) {
  const { messages } = await request.json();
  const completion = await client.chat.completions.create({
    model: "llama3.2:latest",
    messages,
  });
  return Response.json({
    reply: completion.choices[0].message.content,
  });
}
```

---

## Building a chatbot

1. Generate a key on **Ollama** (name e.g. `chatbot`). Optionally lock it to one model.
2. `GET /models` and pick an `id`.
3. On each user message, `POST /chat/completions` with the **full** `messages` array (system + history + new user turn).
4. Append the assistant `content` to history for the next turn.
5. Use `stream: true` if the UI should type out tokens.

Ollama must be running and the model pulled (`ollama pull …`). Load the model once from the dashboard (**Run**) if the first chat request times out.

## Errors

```json
{
  "error": {
    "message": "Invalid API key",
    "type": "invalid_request_error"
  }
}
```

Revoke a leaked key on the same Ollama page; it stops working immediately.
