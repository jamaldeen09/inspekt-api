# 🔍 Inspekt

Inspekt is an AI-powered API proxy and debugging tool built with TypeScript. It doesn't just fetch data — it analyzes the entire HTTP exchange: headers, status codes, and body, to provide a structured, actionable breakdown of what's happening under the hood.

---

## ✨ Features

- 🤖 **AI-Driven Analysis** — Automatically diagnoses 4xx/5xx errors and suggests specific fixes
- 🛡️ **Security Audit** — Flags information disclosure (like `X-Powered-By`) and missing security headers
- ⚡ **Performance Insights** — Detects rate-limiting, cache hits/misses, and latency issues
- 📦 **Smart Truncation** — Intelligently handles massive JSON/HTML payloads to ensure efficient AI processing without token waste
- 🔒 **Type-Safe** — Built from the ground up with TypeScript for a robust developer experience

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+)
- An [OpenRouter](https://openrouter.ai) API Key
- An [Upstash](https://upstash.com) Redis instance (for rate limiting)

### Installation

```bash
git clone https://github.com/jamaldeen09/inspekt-api
cd inspekt-api
npm install
```

### Environment Setup

Create a `.env` file in the root:

```env
PORT=4000
OPENROUTER_KEY=your_openrouter_key_here
UPSTASH_REDIS_REST_URL=your_upstash_redis_url_here
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token_here
```

### Run the Server

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

---

## 🛠 API Usage

### `POST /api/v1/analyze`

Proxies a request to your target URL and returns the raw response plus an optional AI analysis.

#### Query Parameters

| Parameter    | Type    | Default | Description                            |
|--------------|---------|---------|----------------------------------------|
| `ai_analysis` | boolean | `true`  | Set to `false` to skip the AI overview |

#### Request Body

```json
{
  "url": "https://api.example.com",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer token123"
  },
  "body": {
    "key": "value"
  }
}
```

| Field     | Type   | Required | Description                                  |
|-----------|--------|----------|----------------------------------------------|
| `url`     | string | ✅ Yes   | The target API URL (must be http or https)   |
| `method`  | string | ✅ Yes   | HTTP method: `GET`, `POST`, `PUT`, `PATCH`, `DELETE` |
| `headers` | object | ❌ No    | Request headers to forward                   |
| `body`    | object | ❌ No    | Request body to forward                      |

#### Success Response `200 OK`

```json
{
  "success": true,
  "message": "Analysis completed successfully",
  "data": {
    "response": { /* Raw API response from the target URL */ },
    "analysis": {
      "summary": "One sentence description of what happened",
      "status": { "code": 200, "meaning": "OK", "expected": true },
      "diagnosis": "Why the server responded this way",
      "issues": [],
      "fixes": [],
      "headers": {
        "notable": [],
        "missing": [],
        "security_flags": []
      },
      "body": {
        "explanation": "What the body contains and means",
        "anomalies": []
      },
      "performance_flags": [],
      "severity": "ok"
    }
  }
}
```

#### Rate Limit Headers

Every response includes standard rate limit headers:

| Header                | Description                              |
|-----------------------|------------------------------------------|
| `X-RateLimit-Limit`     | Maximum requests allowed in the window  |
| `X-RateLimit-Remaining` | Requests remaining in the current window |
| `X-RateLimit-Reset`     | Timestamp when the window resets        |

---

## 🧠 Smart Error Handling

Inspekt categorizes failures to help you debug faster:

- **4xx/5xx Errors** — The AI analyzes the error body and headers to explain why the remote server rejected the request
- **Gateway Timeout (508)** — Triggered when the upstream server fails to respond in time
- **Parsing Errors** — Safely catches and reports when the AI generates malformed JSON
- **Context Management** — Automatically truncates large payloads at 8,000 characters to fit within AI context windows while keeping the original response intact for the user

---

## 🔧 Troubleshooting

Common issues and how Inspekt handles them:

| Issue | Cause | Resolution |
|-------|-------|------------|
| **AI Parsing Error** | Model wrapped JSON in markdown or added extra text | Inspekt automatically strips backticks — if it persists, retry the request |
| **508 Gateway Timeout** | Upstream API is unreachable or too slow | Verify the target URL is correct and the server isn't behind a firewall |
| **401 Unauthorized** | Missing or invalid `OPENROUTER_KEY` | Check your `.env` file and ensure the key has active credits |
| **429 Rate Limited** | AI provider request limit hit | Wait a few seconds — OpenRouter free-tier models have strict RPM limits |
| **Context Exceeded** | API response body too large for AI context | Inspekt auto-truncates at 8,000 chars via `truncateData()` to prevent this |
| **Empty Analysis** | `ai_analysis` query param set to `false` | Ensure your request URL isn't accidentally appending `?ai_analysis=false` |

---

## 📜 License

Licensed under the ISC License.

Created by Olatunji Jamaldeen
------------------------------
## 🔧 Troubleshooting

Common issues and how Inspekt handles them:

| Issue | Cause | Resolution |
|-------|-------|------------|
| **AI Parsing Error** | Model wrapped JSON in markdown or added extra text | Inspekt automatically strips backticks — if it persists, retry the request |
| **508 Gateway Timeout** | Upstream API is unreachable or too slow | Verify the target URL is correct and the server isn't behind a firewall |
| **429 Rate Limited** | AI provider request limit hit | Wait a few seconds — OpenRouter free-tier models have strict RPM limits |
| **Context Exceeded** | API response body too large for AI context | Inspekt auto-truncates at 8,000 chars via `truncateData()` to prevent this |
| **Empty Analysis** | `ai_analysis` query param set to `false` | Ensure your request URL isn't accidentally appending `?ai_analysis=false` |
------------------------------

