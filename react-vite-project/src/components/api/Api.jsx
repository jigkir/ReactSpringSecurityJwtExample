import fetcher from '../../utils/fetcher.js';

// region Shared response handling
async function toError(response) {
    let body = {};
    try {
        body = await response.json();
    } catch {
        // non-JSON body
    }
    const error = new Error(body.message || `Erreur ${response.status}`);
    error.status = response.status;
    error.body = body;
    return error;
}

// For endpoints that return a JSON body
async function handleResponse(response) {
    if (!response.ok) throw await toError(response);
    return response.json();
}

// For endpoints that return no body (PUT scope/hide/main)
async function handleEmpty(response) {
    if (!response.ok) throw await toError(response);
}

// endregion

// region Login
export async function login(email, password) {
    const response = await fetcher("login", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json;charset=UTF-8",
        },
        body: JSON.stringify({email, password}),
    });
    return handleResponse(response);
}

// endregion

// region Current User
export async function getCurrentUser() {
    const response = await fetcher("users/current", {});
    return handleResponse(response);
}

// endregion

// region Student CVs
export async function getCvCount(studentId) {
    const response = await fetcher(`student/${studentId}/cvs/count`, {});
    return handleResponse(response);
}

export async function getStudentCvs(studentId) {
    const response = await fetcher(`student/${studentId}/cvs`, {method: "GET"});
    return handleResponse(response);
}

// Returns {id, fileName, content (Base64)}
export async function getStudentCvFile(studentId, cvId) {
    const response = await fetcher(`student/${studentId}/cvs/${cvId}`, {method: "GET"});
    return handleResponse(response);
}

// scope: "public" | "private"
export async function setCvScope(studentId, cvId, scope) {
    const response = await fetcher(`student/${studentId}/cvs/${cvId}/${scope}`, {method: "PUT"});
    return handleEmpty(response);
}

export async function hideCv(studentId, cvId) {
    const response = await fetcher(`student/${studentId}/cvs/${cvId}/hide`, {method: "PUT"});
    return handleEmpty(response);
}

export async function setMainCv(studentId, cvId) {
    const response = await fetcher(`student/${studentId}/cvs/${cvId}/main`, {method: "PUT"});
    return handleEmpty(response);
}

//endregion

// region Manager CVs
export async function getPendingCvs() {
    const response = await fetcher("manager/cvs/pending", {method: "GET"});
    return handleResponse(response);
}

// Returns {id, fileName, content (Base64)}
export async function getManagerCvFile(cvId) {
    const response = await fetcher(`manager/cvs/${cvId}/file`, {method: "GET"});
    return handleResponse(response);
}

// Returns the updated ManagerCvResponseDto (with the new status)
export async function approveCv(cvId) {
    const response = await fetcher(`manager/cvs/${cvId}/approve`, {method: "PUT"});
    return handleResponse(response);
}

// The backend requires a non-empty comment (CvRejectionDto)
export async function rejectCv(cvId, comment) {
    const response = await fetcher(`manager/cvs/${cvId}/reject`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({comment}),
    });
    return handleResponse(response);
}

// endregion