import express, { Request } from "express";
import cors from "cors"
import envData from "./lib/env-data.js";
import { CustomApiResponse } from "./types/api.types.js";
import { truncateData, validateUrl } from "./lib/utils.js";
import axios from "axios";
import analyze from "./services/analyze.service.js";
import { ratelimit } from "./upstash.js";
const app = express();

app.set('trust proxy', 1);

// Global middlewares
app.use(express.json());
app.use(cors({
    origin: "*",
    methods: ["POST"],
}));

// ** ----- Rate limiting global middleware ------
app.use(async (req, res: CustomApiResponse, next) => {
    const identifier = req.ip || "global"; // Limit by IP address
    const { 
        success, 
        limit, 
        reset, 
        remaining 
    } = await ratelimit.limit(identifier);

    // Send standard rate-limit headers (great for your "Inspekt" brand!)
    res.set({
        "X-RateLimit-Limit": limit,
        "X-RateLimit-Remaining": remaining,
        "X-RateLimit-Reset": reset,
    });

    if (!success) {
        return res.status(429).json({
            success: false,
            message: "Too many requests. Please slow down.",
            error: { code: "RATE_LIMITED", statusCode: 429 }
        });
    }
    next();
});

// ** Wrong method handler informs users that only
// ** POST requests are allowed
const wrongMethodHandler = (req: Request, res: CustomApiResponse) => {
    return res.status(405).json({
        success: false,
        message: `${req.method} is not allowed on this endpoint. Use POST`,
        data: {
            docs: "https://github.com/jamaldeen09/inspekt-api", 
            example: {
                method: "POST",
                url: "https://inspekt-api-production.up.railway.app/api/v1/analyze",
                body: { url: "https://jsonplaceholder.typicode.com/posts?_limit=5", method: "GET" }
            }
        }
    });
};

// ** ----- OTHER METHODS ----- ** \\
app.get("/api/v1/analyze", wrongMethodHandler);
app.put("/api/v1/analyze", wrongMethodHandler);
app.patch("/api/v1/analyze", wrongMethodHandler);
app.delete("/api/v1/analyze", wrongMethodHandler);


// ** ----- ENDPOINT | /api/v1/analyze --------
// ** Query params: ai_analysis - BOOLEAN |
// ** Params: none 
app.post("/api/v1/analyze", async (req, res: CustomApiResponse) => {
    const body = req.body;
    const query = req.query;
    const shouldAnalyze = query?.ai_analysis !== undefined ?
        String(query.ai_analysis).toLowerCase() === 'true'
        : true;

    // Validate the request body to make sure
    // it has the important fields like url and method
    if (!body?.url || !body?.method) {
        return res.status(400).json({
            success: false,
            message: "A url and a method must be provided",
            error: { code: "BAD_REQUEST", statusCode: 400 }
        });
    };

    // Make sure the url is a valid url
    if (body.url && !(validateUrl(body.url))) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid url",
            error: { code: "BAD_REQUEST", statusCode: 400 }
        })
    };

    // Make sure the method is a valid method
    if (body.method && !(["GET", "POST", "PUT", "PATCH", "DELETE"].includes(body.method))) {
        return res.status(400).json({
            success: false,
            message: "Method can only be: GET, POST, PUT, PATCH OR DELETE",
            error: { code: "BAD_REQUEST", statusCode: 400 }
        })
    }

    // Analysis variable
    let analysis = null;
    try {

        // Now we make an axios request so we can test
        // the client's requested api
        const axiosResponse = await axios({
            url: body.url,
            method: body.method,
            headers: body?.headers ?? {},
            data: body?.body ?? {},
        });

        // Make sure the requesting client chose to
        // analyze this response
        if (shouldAnalyze) {
            analysis = await analyze({
                url: body.url,
                reqHeaders: body?.headers ?? {},
                resHeaders: axiosResponse.headers,
                method: body.method,
                body: truncateData(axiosResponse.data),
                status: axiosResponse.status,
            });

            // Handle errors during the analysis
            if (analysis.error) {
                return res.status(analysis.error!.statusCode).json({
                    success: analysis.success,
                    message: analysis.message || "",
                    error: analysis.error,
                });
            }
        };

        return res.status(200).json({
            success: true,
            message: shouldAnalyze
                ? "Analysis completed successfully"
                : "Request successful, AI analysis was skipped as requested",
            data: {
                response: axiosResponse.data,
                analysis: analysis?.data ?? null,
            }
        })
    } catch (err) {
        // Axios errors
        if (axios.isAxiosError(err)) {
            // The server responded with a status code outside the 2xx range (400, 500, etc.)
            if (err.response) {
                const { status, headers, data } = err.response;

                // Make sure the requesting client chose to
                // analyze this response
                if (shouldAnalyze) {
                    analysis = await analyze({
                        url: body.url,
                        reqHeaders: body?.headers ?? {},
                        resHeaders: headers,
                        method: body.method,
                        body: truncateData(data),
                        status,
                    });

                    // Handle errors during the analysis
                    if (analysis.error) {
                        return res.status(analysis.error!.statusCode).json({
                            success: analysis.success,
                            message: analysis.message || "",
                            error: analysis.error,
                        });
                    }
                }

                return res.status(200).json({
                    success: true,
                    message: shouldAnalyze
                        ? "Analysis completed successfully"
                        : "Request successful, AI analysis was skipped as requested",
                    data: {
                        response: data,
                        analysis: analysis?.data ?? null,
                    }
                })
            }

            // The request was made but no response was received (e.g., network timeout)
            else if (err.request) {
                return res.status(508).json({
                    success: false,
                    message: "The upstream server is taking too long to respond",
                    error: { code: "GATEWAY_TIMEOUT", statusCode: 508 }
                })
            }
        } else {
            return res.status(500).json({
                success: false,
                message: "An internal error occurred while preparing the request",
                error: {
                    code: "REQUEST_SETUP_ERROR",
                    statusCode: 500,
                    details: err instanceof Error ? err.message : "Unknown setup error"
                }
            });
        }
    }
});

// Listen to a port
const port = envData.PORT
app.listen(port, () => console.log("Server is running on port:", port))