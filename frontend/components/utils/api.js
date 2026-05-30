import { io } from "socket.io-client";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

// Helper to get authorization headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) return {};

  // For our backend authMiddleware, it supports BOTH headers:
  // 1. x-user-id & x-user-role
  // 2. Authorization Bearer token in "userId:role" format
  const parts = token.split(":");
  if (parts.length === 2) {
    return {
      "Authorization": `Bearer ${token}`,
      "x-user-id": parts[0],
      "x-user-role": parts[1]
    };
  }

  return {
    "Authorization": `Bearer ${token}`
  };
};

// Custom Fetch helper
export const apiFetch = async (endpoint, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  return response.json();
};

// Initialize WebSocket client
export const getSocket = () => {
  const token = localStorage.getItem("token");
  return io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"]
  });
};
