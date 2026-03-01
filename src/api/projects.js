// ═══════════════════════════════════════════════════
// API CLIENT — Frontend Fetch Wrapper
// ═══════════════════════════════════════════════════

const BASE = "/api/projects";

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

/** Fetch all projects from the database */
export async function fetchProjects(options = {}) {
    const query = new URLSearchParams();
    if (options.all === true) {
        query.set("all", "true");
    }

    const url = query.toString() ? `${BASE}?${query.toString()}` : BASE;
    const res = await fetch(url, { credentials: "include" });
    return handleResponse(res, "Failed to fetch projects");
}

export async function fetchUsers() {
    const res = await fetch(`${BASE}/users`, { credentials: "include" });
    return handleResponse(res, "Failed to fetch users");
}

export async function fetchSharedProjects() {
    const res = await fetch(`${BASE}/shared`, { credentials: "include" });
    return handleResponse(res, "Failed to fetch shared projects");
}

export async function searchProjectUsers(projectId, userId) {
    const query = new URLSearchParams({ projectId, userId });
    const res = await fetch(`${BASE}/users/search?${query.toString()}`, { credentials: "include" });
    return handleResponse(res, "Failed to search users");
}

export async function fetchProjectAccess(projectId) {
    const res = await fetch(`${BASE}/${encodeURIComponent(projectId)}/access`, { credentials: "include" });
    return handleResponse(res, "Failed to fetch project access");
}

export async function grantProjectReadAccess(projectId, userId) {
    const res = await fetch(`${BASE}/${encodeURIComponent(projectId)}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
    });
    return handleResponse(res, "Failed to grant project access");
}

export async function revokeProjectReadAccess(projectId, userId) {
    const res = await fetch(`${BASE}/${encodeURIComponent(projectId)}/access/${encodeURIComponent(userId)}`, {
        method: "DELETE",
        credentials: "include",
    });
    return handleResponse(res, "Failed to revoke project access");
}

/** Create a new project */
export async function createProject(project) {
    const res = await fetch(BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(project),
    });
    return handleResponse(res, "Failed to create project");
}

/** Update an existing project */
export async function updateProject(project) {
    const res = await fetch(`${BASE}/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(project),
    });
    return handleResponse(res, "Failed to update project");
}

/** Delete a project */
export async function deleteProject(id) {
    const res = await fetch(`${BASE}/${id}`, { method: "DELETE", credentials: "include" });
    return handleResponse(res, "Failed to delete project");
}

/** Upload files to a project */
export async function uploadDocs(projectId, files) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const res = await fetch(`${BASE}/${projectId}/docs`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });
    return handleResponse(res, "Failed to upload files");
}

/** Delete a doc from a project */
export async function deleteDoc(projectId, docId) {
    const res = await fetch(`${BASE}/${projectId}/docs/${docId}`, {
        method: "DELETE",
        credentials: "include",
    });
    return handleResponse(res, "Failed to delete doc");
}
