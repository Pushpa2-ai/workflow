const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

const refreshAccessToken = async () => {
  const refresh = localStorage.getItem("refresh");

  if (!refresh) {
    return null;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/auth/token/refresh/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Refresh token expired");
    }

    const data = await response.json();

    localStorage.setItem("access", data.access);

    return data.access;
  } catch {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    window.location.href = "/login";

    return null;
  }
};

export const apiRequest = async (
  endpoint,
  options = {},
  retry = true
) => {
  let token = localStorage.getItem("access");

  const makeRequest = async (accessToken) => {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {}),
        ...options.headers,
      },
    });
  };

  let response = await makeRequest(token);

  if (response.status === 401 && retry) {
    token = await refreshAccessToken();

    if (!token) {
      throw new Error(
        "Session expired. Please login again."
      );
    }

    response = await makeRequest(token);
  }

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.message ||
        "Something went wrong"
    );
  }

  return data;
};