(function attachAstraeonApi(window) {
  "use strict";

  const configuredBaseUrl = window.ASTRAEON_API_BASE_URL || "http://localhost:5000";
  const API_BASE_URL = configuredBaseUrl.replace(/\/$/, "");
  const TOKEN_KEY = "token";

  class ApiError extends Error {
    constructor(message, status, payload) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.payload = payload;
    }
  }

  const getToken = () => localStorage.getItem(TOKEN_KEY);
  const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
  const clearToken = () => localStorage.removeItem(TOKEN_KEY);

  const request = async (path, options = {}) => {
    const { authenticated = false, headers = {}, ...fetchOptions } = options;
    const requestHeaders = { Accept: "application/json", ...headers };
    const token = getToken();

    if (fetchOptions.body !== undefined && !requestHeaders["Content-Type"]) {
      requestHeaders["Content-Type"] = "application/json";
    }
    if (authenticated && token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }

    let response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, { ...fetchOptions, headers: requestHeaders });
    } catch (error) {
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        console.error("Astraeon API request failed", { path, error });
      }
      throw new ApiError("Unable to reach the server. Please try again.", 0);
    }

    const payload = await response.json().catch(() => ({ success: false, message: "Unexpected response from server." }));
    if (!response.ok || !payload.success) {
      throw new ApiError(payload.message || "Unable to complete this request.", response.status, payload);
    }
    return payload;
  };

  window.AstraeonApi = { API_BASE_URL, ApiError, request, getToken, setToken, clearToken };
})(window);
