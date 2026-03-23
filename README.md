---

🔍 Inspekt
Inspekt is an AI-powered API proxy and debugging tool built with TypeScript. It doesn't just fetch data; it analyzes the entire HTTP exchange—headers, status codes, and body—to provide a structured, actionable breakdown of what’s happening under the hood.

---

✨ Features

- 🤖 AI-Driven Analysis: Automatically diagnoses 4xx/5xx errors and suggests specific fixes.
- 🛡️ Security Audit: Flags information disclosure (like X-Powered-By) and missing security headers.
- ⚡ Performance Insights: Detects rate-limiting, cache hits/misses, and latency issues.
- 📦 Smart Truncation: Intelligently handles massive JSON/HTML payloads to ensure efficient AI processing without token waste.
- 🔒 Type-Safe: Built from the ground up with TypeScript for a robust developer experience.

---

🚀 Quick Start1. Prerequisites

- Node.js (v18+)
- An OpenRouter API Key

2. Installation

git clone https://github.com
cd inspekt
npm install

3. Environment Setup
   Create a .env file in the root:

PORT=4000
OPENROUTER_KEY=your_key_here

4. Run the Server

# Development mode

npm run dev

# Production build

npm run build
npm start

---

🛠 API UsagePOST /api/v1/analyze
Proxies a request to your target URL and returns the data plus an optional AI analysis.
Query Parameters

| Parameter   | Type    | Default | Description                           |
| ----------- | ------- | ------- | ------------------------------------- |
| ai_analysis | boolean | true    | Set to false to skip the AI overview. |

Request Body

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

Success Response (200 OK)

{
"success": true,
"message": "Analysis completed successfully",
"data": {
"response": { /_ Raw API Response _/ },
"analysis": {
"summary": "...",
"status": { "code": 200, "meaning": "OK", "expected": true },
"diagnosis": "...",
"issues": [],
"fixes": [],
"headers": { "notable": [], "missing": [], "security_flags": [] },
"body": { "explanation": "...", "anomalies": [] },
"severity": "ok"
}
}
}

---

🧠 Smart Error Handling
Inspekt categorizes failures to help you debug faster:

- 4xx/5xx Errors: The AI analyzes the error body and headers to suggest why the remote server rejected the request.
- Gateway Timeout (508): Triggered when the upstream server fails to respond in time.
- Parsing Errors: Safely catches and reports when the AI generates malformed JSON.
- Context Management: Automatically truncates large payloads to fit within AI context windows while maintaining original data integrity for the user.

---

📜 License
Licensed under the ISC License.
Created by Olatunji Jamaldeen

---

This looks solid. I’ve refined those troubleshooting points to be more "dev-friendly" and added a few more based on the Context Window and Truncation logic we built.
Here is the updated Troubleshooting section to drop into your README.md:

------------------------------
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
------------------------------

