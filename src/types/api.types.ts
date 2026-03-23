import { Response, Request } from "express";

// ** Could possibly be extended, hence why its a basic type for now
export type CustomRequest = Request

export interface ApiResponseData {
    success: boolean;
    message: string;
    data?: unknown;
    error?: {
        code: string;
        statusCode: number;
        details?: unknown;
    }
};

export type CustomApiResponse = Response<ApiResponseData>