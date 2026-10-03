import fetcher from '../../utils/fetcher.js';

// region Shared response handling
// Maps an HTTP status to a translation KEY (translated at render time, never here).
const STATUS_I18N_KEYS = {
    400: "error.badRequest",
    401: "error.unauthorized",
    403: "error.forbidden",
    404: "error.notFound",
    409: "error.conflict",
    413: "error.tooLarge",
    422: "error.unprocessable",
};

function statusToI18n(status) {
    if (STATUS_I18N_KEYS[status]) return {key: STATUS_I18N_KEYS[status]};
    if (status >= 500) return {key: "error.server", options: {status}};
    return {key: "error.apiStatus", options: {status}};
}

async function toError(response) {
    let body = {};
    try {
        body = await response.json();
    } catch {
        // non-JSON body
    }
    const i18n = statusToI18n(response.status);
    const error = new Error(i18n.key);
    error.status = response.status;
    error.body = body;
    error.i18n = i18n;
    return error;
}

// For endpoints that return a JSON body
async function handleResponse(response) {
    if (!response.ok) throw await toError(response);
    return response.json();
}

// For endpoints that return no body (PUT scope/hide/main, signups)
async function handleEmpty(response) {
    if (!response.ok) throw await toError(response);
}

// POST a JSON payload to an endpoint that returns no useful body
async function postJson(path, payload) {
    const response = await fetcher(path, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json;charset=UTF-8",
        },
        body: JSON.stringify(payload),
    });
    return handleEmpty(response);
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

// region Reference data (public)
// Returns [{value, label}], accepting ["A","B"] or {disciplines: [...]} from the backend
export async function getDisciplines() {
    const response = await fetcher("disciplines", {});
    const data = await handleResponse(response);
    const list = Array.isArray(data) ? data : (data.disciplines ?? []);
    return list.map((d) => ({
        value: typeof d === "string" ? d : d.value,
        label: typeof d === "string" ? d : (d.label ?? d.value),
    }));
}

// Returns string[], accepting ["STUDENT",...] or {roles: [...]} from the backend
export async function getRoles() {
    const response = await fetcher("roles", {});
    const data = await handleResponse(response);
    const list = Array.isArray(data) ? data : (data.roles ?? []);
    return list.map((r) => String(typeof r === "string" ? r : (r.value ?? r)));
}

// endregion

// region Signup
// All reject with an Error carrying .status and .body (e.g. body.field on 409)
export const signupStudent = (payload) => postJson("student/signup", payload);
export const signupTeacher = (payload) => postJson("teacher/signup", payload);
export const signupEmployer = (payload) => postJson("employer/signup", payload);

// endregion

// region Student CVs
export async function getCvCount(studentId) {
    const response = await fetcher(`student/${studentId}/cvs/count`, {});
    return handleResponse(response);
}

// Returns the max CV size in bytes (public endpoint)
export async function getMaxCvSize() {
    const response = await fetcher("max-cv-size", {method: "GET"});
    return handleResponse(response);
}

// Uploads a PDF (multipart). Do NOT set Content-Type: the browser adds the multipart boundary.
// Throws an Error with .status on failure.
export async function uploadCv(studentId, file) {
    const form = new FormData();
    form.append("file", file);
    const response = await fetcher(`student/${studentId}/cvs`, {
        method: "POST",
        headers: {Accept: "application/json"},
        body: form,
    });
    return handleEmpty(response);
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
// Returns ManagerCvResponseDto[] -> {id, fileName, uploadedAt, status, rejectionComment, student: {id, firstName, lastName, email, studentId, discipline}}
export async function getPublicCvs() {
    const response = await fetcher("manager/cvs", {method: "GET"});
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

// region Internship
export async function getEmployerInternships(employerId) {
    const response = await fetcher(`employer/${employerId}/internships`, {});
    return handleResponse(response);
}

export async function createInternship(internship) {
    const response = await fetcher("employer/internship", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(internship),
    });
    return handleResponse(response);
}

// Edit an existing offer. Returns the updated InternshipResponseDto.
export async function updateInternship(internshipId, internship) {
    const response = await fetcher(`employer/internships/${internshipId}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(internship),
    });
    return handleResponse(response);
}

export async function deleteInternship(internshipId) {
    const response = await fetcher(`employer/internships/${internshipId}`, {method: "DELETE"});
    return handleEmpty(response);
}

export async function markNotificationAsRead(studentId) {
    const response = await fetcher(`student/${studentId}/notifications/internship/read`, {
        method: "PUT"
    });
    return handleEmpty(response);
}

export async function getUnreadNotificationCount(studentId) {
    const response = await fetcher(`student/${studentId}/notifications/internship/unread/count`, { method: "GET" });
    return handleResponse(response);
}

// endregion

// region Manager internships
// Returns InternshipResponseDto[] (status PENDING only)
export async function getPendingInternships() {
    const response = await fetcher("manager/internships/pending", {method: "GET"});
    return handleResponse(response);
}

// Returns InternshipResponseDto[] (ALL statuses: pending, approved, rejected)
export async function getManagerInternships() {
    const response = await fetcher("manager/internships", {method: "GET"});
    return handleResponse(response);
}

// Returns a single InternshipResponseDto
export async function getManagerInternship(internshipId) {
    const response = await fetcher(`manager/internships/${internshipId}`, {method: "GET"});
    return handleResponse(response);
}

// Returns the updated InternshipResponseDto.
export async function approveInternship(internshipId) {
    const response = await fetcher(`manager/internships/${internshipId}/approve`, {method: "PUT"});
    return handleResponse(response);
}

// A non-empty comment is required. Returns the updated InternshipResponseDto.
export async function rejectInternship(internshipId, comment) {
    const response = await fetcher(`manager/internships/${internshipId}/reject`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({comment}),
    });
    return handleResponse(response);
}

// endregion

//region Notifications
export async function getManagerNotifications() {
    const response = await fetcher(`manager/notifications`, {method: "GET"});
    return handleResponse(response);
}

export async function getStudentNotifications(studentId) {
    const response = await fetcher(`student/${studentId}/notifications`, {method: "GET"});
    return handleResponse(response);
}

export async function markStudentCvNotificationAsRead(studentId, notificationId) {
    const response = await fetcher(`student/${studentId}/notifications/${notificationId}/read`, {method: "PUT"});
    return handleEmpty(response);
}
//endregion