// ═══════════════════════════════════════════════════
// API CLIENT — Frontend Fetch Wrapper
// ═══════════════════════════════════════════════════

const BASE = "/api/projects";

/** Fetch all projects from the database */
export async function fetchProjects() {
    const res = await fetch(BASE);
    if (!res.ok) throw new Error("Failed to fetch projects");
    return res.json();
}

/** Create a new project */
export async function createProject(project) {
    const res = await fetch(BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
    });
    if (!res.ok) throw new Error("Failed to create project");
    return res.json();
}

/** Update an existing project */
export async function updateProject(project) {
    const res = await fetch(`${BASE}/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
    });
    if (!res.ok) throw new Error("Failed to update project");
    return res.json();
}

/** Delete a project */
export async function deleteProject(id) {
    const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete project");
    return res.json();
}

/** Upload files to a project */
export async function uploadDocs(projectId, files) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const res = await fetch(`${BASE}/${projectId}/docs`, {
        method: "POST",
        body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload files");
    return res.json();
}

/** Delete a doc from a project */
export async function deleteDoc(projectId, docId) {
    const res = await fetch(`${BASE}/${projectId}/docs/${docId}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete doc");
    return res.json();
}
