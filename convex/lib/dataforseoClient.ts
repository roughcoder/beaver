/**
 * DataForSEO TypeScriptClient wrapper for Convex Node actions.
 * Handles authentication, request hashing, retries, and cost extraction.
 */

import { DataforseoLabsApi, SerpApi, BacklinksApi } from "dataforseo-client";

let labsApiInstance: DataforseoLabsApi | null = null;
let serpApiInstance: SerpApi | null = null;
let backlinksApiInstance: BacklinksApi | null = null;

function getAuthHeaders(): { Authorization: string } {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error(
      "DataForSEO credentials not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables."
    );
  }

  const credentials = Buffer.from(`${login}:${password}`).toString("base64");
  return { Authorization: `Basic ${credentials}` };
}

function createAuthenticatedFetch(): typeof fetch {
  const authHeaders = getAuthHeaders();
  
  return async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers);
    headers.set("Authorization", authHeaders.Authorization);
    headers.set("Content-Type", "application/json");
    
    const urlStr = typeof url === "string" ? url : url.toString();
    const bodyStr = init?.body ? (typeof init.body === "string" ? init.body : JSON.stringify(init.body)) : undefined;
    
    console.log(`[DataForSEO] Making request to: ${urlStr}`);
    console.log(`[DataForSEO] Method: ${init?.method || "GET"}`);
    if (bodyStr) {
      console.log(`[DataForSEO] Request body:`, bodyStr.substring(0, 500)); // Limit log size
    }
    
    try {
      const response = await fetch(url, {
        ...init,
        headers,
      });
      
      console.log(`[DataForSEO] Response status: ${response.status} ${response.statusText}`);
      
      // If not OK, clone response to read body without consuming it
      if (!response.ok) {
        const clonedResponse = response.clone();
        try {
          const responseText = await clonedResponse.text();
          console.error(`[DataForSEO] Error response status: ${response.status} ${response.statusText}`);
          console.error(`[DataForSEO] Error response body:`, responseText.substring(0, 2000));
          
          // Try to parse as JSON to get structured error
          try {
            const errorJson = JSON.parse(responseText);
            console.error(`[DataForSEO] Parsed error JSON:`, JSON.stringify(errorJson, null, 2));
          } catch {
            // Not JSON, that's fine
          }
        } catch (e) {
          console.error(`[DataForSEO] Could not read error response body:`, e);
        }
      }
      
      return response;
    } catch (error) {
      // Provide more context in error message
      console.error(`[DataForSEO] Fetch error:`, error);
      throw new Error(
        `DataForSEO API request failed: ${error instanceof Error ? error.message : String(error)}. URL: ${urlStr}`
      );
    }
  };
}

export function getLabsApi(): DataforseoLabsApi {
  if (!labsApiInstance) {
    labsApiInstance = new DataforseoLabsApi("https://api.dataforseo.com", { fetch: createAuthenticatedFetch() });
  }
  return labsApiInstance;
}

export function getSerpApi(): SerpApi {
  if (!serpApiInstance) {
    serpApiInstance = new SerpApi("https://api.dataforseo.com", { fetch: createAuthenticatedFetch() });
  }
  return serpApiInstance;
}

export function getBacklinksApi(): BacklinksApi {
  if (!backlinksApiInstance) {
    backlinksApiInstance = new BacklinksApi("https://api.dataforseo.com", { fetch: createAuthenticatedFetch() });
  }
  return backlinksApiInstance;
}

export interface ApiCallResult<T = unknown> {
  data: T;
  costUsd: number;
  tasksCount?: number;
  tasksCostUsd?: number[];
  statusCode?: number;
  statusMessage?: string;
}

interface DataForSeoTask {
  cost?: number;
  status_code?: number;
  status_message?: string;
}

interface DataForSeoResponse {
  status_code?: number;
  status_message?: string;
  tasks?: DataForSeoTask[];
}

function extractCostAndStatus(response: unknown): {
  costUsd: number;
  tasksCount: number;
  tasksCostUsd: number[];
  statusCode?: number;
  statusMessage?: string;
} {
  const resp = response as DataForSeoResponse;
  const statusCode = resp.status_code;
  const statusMessage = resp.status_message;
  let costUsd = 0;
  let tasksCount = 0;
  const tasksCostUsd: number[] = [];

  if (resp.tasks && Array.isArray(resp.tasks)) {
    tasksCount = resp.tasks.length;
    for (const task of resp.tasks) {
      const taskCost = task.cost || 0;
      costUsd += taskCost;
      tasksCostUsd.push(taskCost);
    }
  }

  return {
    costUsd,
    tasksCount,
    tasksCostUsd,
    statusCode,
    statusMessage,
  };
}

/**
 * Make a DataForSEO Labs API call with retry logic and cost extraction.
 */
export async function callLabsApi<T = unknown>(
  method: string,
  payload: unknown,
  maxRetries: number = 3
): Promise<ApiCallResult<T>> {
  const api = getLabsApi();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[DataForSEO] Calling ${method} (attempt ${attempt + 1}/${maxRetries + 1})`);
      console.log(`[DataForSEO] Payload:`, JSON.stringify(payload, null, 2));
      
      let response: unknown;
      
      // Type assertions needed because DataForSEO client has strict types
      // but we accept unknown payloads for flexibility
      if (method === "keyword_suggestions") {
        response = await api.googleKeywordSuggestionsLive(payload as never);
      } else if (method === "related_keywords") {
        response = await api.googleRelatedKeywordsLive(payload as never);
      } else if (method === "keyword_overview") {
        response = await api.googleKeywordOverviewLive(payload as never);
      } else if (method === "bulk_keyword_difficulty") {
        response = await api.googleBulkKeywordDifficultyLive(payload as never);
      } else {
        throw new Error(`Unknown Labs method: ${method}`);
      }

      console.log(`[DataForSEO] Response received for ${method}`);
      const resp = response as DataForSeoResponse;
      console.log(`[DataForSEO] Response status_code:`, resp?.status_code);
      console.log(`[DataForSEO] Response status_message:`, resp?.status_message);

      const { costUsd, tasksCount, tasksCostUsd, statusCode, statusMessage } = extractCostAndStatus(response);

      return {
        data: response as T,
        costUsd,
        tasksCount,
        tasksCostUsd: tasksCostUsd.length > 0 ? tasksCostUsd : undefined,
        statusCode,
        statusMessage,
      };
    } catch (error: unknown) {
      // Enhanced error logging
      console.error(`[DataForSEO] Error calling ${method} (attempt ${attempt + 1}):`, error);
      console.error(`[DataForSEO] Error type:`, error?.constructor?.name);
      console.error(`[DataForSEO] Error string:`, String(error));
      
      if (error && typeof error === "object") {
        // Try to extract more details from the error
        const errorObj = error as Record<string, unknown>;
        
        // Log all error properties
        const errorDetails: Record<string, unknown> = {};
        for (const key in errorObj) {
          try {
            const value = errorObj[key];
            // Stringify if it's an object, but limit size
            if (value && typeof value === "object") {
              errorDetails[key] = JSON.stringify(value).substring(0, 500);
            } else {
              errorDetails[key] = value;
            }
          } catch {
            errorDetails[key] = "[unable to serialize]";
          }
        }
        console.error(`[DataForSEO] Error details:`, errorDetails);
        
        // Check if it's an ApiException with more details
        if ("status" in errorObj) {
          const status = errorObj.status as number;
          console.error(`[DataForSEO] HTTP Status: ${status}`);
          
          // Don't retry on 4xx errors (client errors)
          if (status >= 400 && status < 500) {
            const errorMessage = errorObj.message 
              ? String(errorObj.message)
              : `DataForSEO API error: HTTP ${status}`;
            throw new Error(`${errorMessage}. Payload: ${JSON.stringify(payload)}`);
          }
        }
      }
      
      lastError = error instanceof Error ? error : new Error(String(error));

      // Exponential backoff for retries
      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`[DataForSEO] Retrying ${method} after ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  const finalError = lastError || new Error("Failed to call DataForSEO Labs API after retries");
  console.error(`[DataForSEO] Final error for ${method}:`, finalError);
  throw new Error(`${finalError.message}. Method: ${method}, Payload: ${JSON.stringify(payload)}`);
}

/**
 * Make a DataForSEO SERP API call with retry logic and cost extraction.
 */
export async function callSerpApi<T = unknown>(
  method: string,
  payload: unknown,
  maxRetries: number = 3
): Promise<ApiCallResult<T>> {
  const api = getSerpApi();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      let response: unknown;
      
      // Type assertion needed because DataForSEO client has strict types
      if (method === "google_organic_live_advanced") {
        response = await api.googleOrganicLiveAdvanced(payload as never);
      } else {
        throw new Error(`Unknown SERP method: ${method}`);
      }

      const { costUsd, tasksCount, tasksCostUsd, statusCode, statusMessage } = extractCostAndStatus(response);

      return {
        data: response as T,
        costUsd,
        tasksCount,
        tasksCostUsd: tasksCostUsd.length > 0 ? tasksCostUsd : undefined,
        statusCode,
        statusMessage,
      };
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (error && typeof error === "object" && "status" in error) {
        const status = (error as { status: number }).status;
        if (status >= 400 && status < 500) {
          throw error;
        }
      }

      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error("Failed to call DataForSEO SERP API after retries");
}

/**
 * Make a DataForSEO Backlinks API call with retry logic and cost extraction.
 */
export async function callBacklinksApi<T = unknown>(
  method: string,
  payload: unknown,
  maxRetries: number = 3
): Promise<ApiCallResult<T>> {
  const api = getBacklinksApi();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      let response: unknown;
      
      // Type assertion needed because DataForSEO client has strict types
      if (method === "bulk_pages_summary") {
        response = await api.bulkPagesSummaryLive(payload as never);
      } else {
        throw new Error(`Unknown Backlinks method: ${method}`);
      }

      const { costUsd, tasksCount, tasksCostUsd, statusCode, statusMessage } = extractCostAndStatus(response);

      return {
        data: response as T,
        costUsd,
        tasksCount,
        tasksCostUsd: tasksCostUsd.length > 0 ? tasksCostUsd : undefined,
        statusCode,
        statusMessage,
      };
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (error && typeof error === "object" && "status" in error) {
        const status = (error as { status: number }).status;
        if (status >= 400 && status < 500) {
          throw error;
        }
      }

      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error("Failed to call DataForSEO Backlinks API after retries");
}

