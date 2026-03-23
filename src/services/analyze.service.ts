import OpenAI from 'openai';
import envData from '../lib/env-data.js';
import { ApiResponseData } from '../types/api.types.js';

// Type of the analyze function
type Analyze = (args: {
  url: string;
  method: string;
  reqHeaders: any;
  resHeaders: any;
  body: any;
  status: number;
}) => Promise<{
  success: boolean;
  message?: string;
  error?: ApiResponseData["error"];
  data?: unknown;
  raw?: any
}>

// Open ai client
const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: envData.OPENROUTER_KEY,
});

/**
 * Analyzes an api response
 * @param args 
 * @returns 
 */
const analyze: Analyze = async (args) => {
  try {
    const response = await client.chat.completions.create({
      model: 'stepfun/step-3.5-flash:free',
      messages: [
        {
          role: "system" as const,
          content: `
                    You are an expert API response analyst. You receive raw HTTP response data and return a structured JSON analysis. Be precise, technical, and actionable. No filler.

Return ONLY a valid JSON object in this exact shape:
{
  "summary": "One sentence: what this endpoint does and what happened",
  "status": {
    "code": 500,
    "meaning": "What this status code means in plain English",
    "expected": true/false (was this status expected for this type of endpoint?)
  },
  "diagnosis": "The most likely reason this response was returned",
  "issues": ["issue 1", "issue 2"],
  "fixes": ["actionable fix 1", "actionable fix 2"],
  "headers": {
    "notable": ["any important or unusual headers explained"],
    "missing": ["headers that should be here but aren't e.g. Content-Type, CORS"],
    "security_flags": ["any security concerns in headers"]
  },
  "body": {
    "explanation": "What the body contains and means",
    "anomalies": ["anything weird or unexpected in the body"]
  },
  "performance_flags": ["rate limiting concerns, slow response indicators, etc"],
  "severity": "ok | warning | critical"
}
  `,
        },
        {
          role: "user" as const,
          content: `
                      Analyze this API response:

URL: ${args.url}
Method: ${args.method}
Request Headers: ${JSON.stringify(args.reqHeaders, null, 2)}
Response Status: ${args.status}
Response Headers: ${JSON.stringify(args.resHeaders, null, 2)}
Response Body: ${JSON.stringify(args.body, null, 2)}


Be precise. Return only the JSON object, no markdown, no backticks.
                    `
        }
      ],
    });

    // Clean the response
    const raw = response.choices[0].message.content || "";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    // Parse the cleaned response
    let parsed = null
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      return {
        success: false,
        message: "The AI generated a response but it wasn't valid JSON.",
        error: {
          code: "AI_PARSING_ERROR",
          statusCode: 500
        },
      };
    }
    return { success: true, data: parsed };
  } catch (err: any) {
    // Determine the status and message from the SDK error object
    const status = err?.status;
    const errorMessage = err?.message || "An unexpected AI analysis error occurred";

    // Rate limit hit 
    if (status === 429) {
      return {
        success: false,
        message: "The AI analysis is currently rate-limited. Please wait a moment.",
        error: {
          code: "RATE_LIMITED",
          statusCode: 429,
          details: errorMessage
        }
      };
    }

    // Auth issue (API Key is wrong or expired)
    else if (status === 401) {
      return {
        success: false,
        message: "AI Configuration error: Invalid API key.",
        error: {
          code: "INVALID_API_KEY",
          statusCode: 401
        }
      };
    }

    // 3. Model/Service unavailable (Overloaded or down)
    else if (status === 503 || status === 502 || status === 504) {
      return {
        success: false,
        message: "the AI model is currently overloaded or unavailable. Try again later.",
        error: {
          code: "MODEL_UNAVAILABLE",
          statusCode: status,
        }
      };
    }

    // Context Window / Token Limit (Prompt was too big)
    else if (status === 400 && errorMessage.includes("context_length")) {
      return {
        success: false,
        message: "The API response was too large for the AI to analyze.",
        error: {
          code: "CONTEXT_WINDOW_EXCEEDED",
          statusCode: 400
        }
      };
    }

    // Random unexpected errors (Network, Parsing, etc.)
    else {
      return {
        success: false,
        message: "AI Analysis failed due to an internal error.",
        error: {
          code: "AI_ANALYSIS_FAILED",
          statusCode: status ?? 500,
          details: errorMessage
        }
      };
    }
  }
}
// Response Time: ${args.responseTime}ms

export default analyze