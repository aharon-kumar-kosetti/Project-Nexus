const BASE = "/api/support";

async function handleResponse(res, fallbackMessage) {
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

export async function fetchSupportMessages() {
    const res = await fetch(`${BASE}/messages`, { credentials: "include" });
    return handleResponse(res, "Failed to fetch support messages");
}

export async function sendSupportMessage(messageText) {
    const res = await fetch(`${BASE}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messageText }),
    });
    return handleResponse(res, "Failed to send message");
}

export async function markSupportMessageRead(id) {
    const res = await fetch(`${BASE}/messages/${id}/read`, {
        method: "PATCH",
        credentials: "include",
    });
    return handleResponse(res, "Failed to mark message as read");
}
