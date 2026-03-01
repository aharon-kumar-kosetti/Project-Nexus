const AUTH_BASE = "/api/auth";

async function handleAuthResponse(res, fallbackMessage) {
    if (res.ok) return res.json();

    let message = fallbackMessage;
    try {
        const data = await res.json();
        if (data?.error) message = data.error;
    } catch {
        // keep fallback message
    }

    const error = new Error(message);
    error.status = res.status;
    throw error;
}

export function login(userId, password) {
    return fetch(`${AUTH_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, password }),
    }).then((res) => handleAuthResponse(res, "Login failed"));
}

export function register(userId, password) {
    return fetch(`${AUTH_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, password }),
    }).then((res) => handleAuthResponse(res, "Registration failed"));
}

export function getSession() {
    return fetch(`${AUTH_BASE}/me`, {
        credentials: "include",
    }).then((res) => handleAuthResponse(res, "Session check failed"));
}

export function logout() {
    return fetch(`${AUTH_BASE}/logout`, {
        method: "POST",
        credentials: "include",
    }).then((res) => handleAuthResponse(res, "Logout failed"));
}

export function updatePassword(targetUserId, newPassword) {
    return fetch(`${AUTH_BASE}/users/${encodeURIComponent(targetUserId)}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword }),
    }).then((res) => handleAuthResponse(res, "Password update failed"));
}
