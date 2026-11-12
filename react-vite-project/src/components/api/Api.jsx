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
export async function handleResponse(response) {
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

// Without a session, the backend returns the lists of the target session
const withSession = (path, sessionId) => sessionId ? `${path}?sessionId=${sessionId}` : path;

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

// Public: the winter session a new student signs up for, the one their access is for
export async function getRegistrationSession() {
    return handleResponse(await fetcher("sessions/registration", {method: "GET"}));
}

// endregion

// region Student CVs
export async function getCvCount() {
    const response = await fetcher(`student/cvs/count`, {});
    return handleResponse(response);
}

// Returns the max CV size in bytes (public endpoint)
export async function getMaxCvSize() {
    const response = await fetcher("max-cv-size", {method: "GET"});
    return handleResponse(response);
}

export async function getStudentCvs() {
    const response = await fetcher(`student/cvs`, {method: "GET"});
    return handleResponse(response);
}

//endregion

// region Manager CVs
// VISIBLE CVs of the students of a session (visible as soon as a student uploads). Returns ManagerCvResponseDto[] -> {id, fileName, uploadedAt, status, rejectionComment, student: {id, firstName, lastName, email, studentId, discipline}}
export async function getPublicCvs(sessionId) {
    const response = await fetcher(withSession("manager/cvs", sessionId), {method: "GET"});
    return handleResponse(response);
}

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

// region Internship

export async function getEmployerInternships(sessionId) {
    const response = await fetcher(withSession("employer/internships", sessionId), {});
    return handleResponse(response);
}

export async function getPendingInternships() {
    const response = await fetcher("manager/internships/pending", {method: "GET"});
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

// endregion

// region Student internships
// Optional documents sent with an application: ?coverLetterId=&transcriptId=
const withDocs = (path, coverLetterId, transcriptId) => {
    const params = new URLSearchParams();
    if (coverLetterId) params.set("coverLetterId", coverLetterId);
    if (transcriptId) params.set("transcriptId", transcriptId);
    const query = params.toString();
    return query ? `${path}?${query}` : path;
};

export async function applyForInternship(internshipId, cvId, coverLetterId, transcriptId) {
    const response = await fetcher(
        withDocs(`student/internship/${internshipId}/apply/${cvId}`, coverLetterId, transcriptId),
        {method: "POST"});
    return handleEmpty(response);
}

export async function getStudentInternships(sessionId) {
    const response = await fetcher(withSession("student/internship", sessionId), {method: "GET"});
    return handleResponse(response);
}

export async function markInternshipsAsViewed(internshipIds) {
    const response = await fetcher("student/internship/viewed", {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({internshipIds}),
    });
    return handleEmpty(response);
}

export async function getStudentAppliedInternships(sessionId) {
    const response = await fetcher(withSession("student/applications", sessionId), {method: "GET"});
    return handleResponse(response);
}

export async function updateApplicationCV(applicationId, cvId, coverLetterId, transcriptId) {
    const response = await fetcher(
        withDocs(`student/applications/${applicationId}/${cvId}`, coverLetterId, transcriptId),
        {method: "PUT"});
    return handleEmpty(response);
}


// endregion

// region Manager internships
// Returns InternshipResponseDto[] (ALL statuses: pending, approved, rejected)
export async function getManagerInternships(sessionId) {
    const response = await fetcher(withSession("manager/internships", sessionId), {method: "GET"});
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

// The manager corrects an offer (same payload as the employer edit). Returns the updated InternshipResponseDto.
export async function updateManagerInternship(internshipId, internship) {
    const response = await fetcher(`manager/internships/${internshipId}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(internship),
    });
    return handleResponse(response);
}

// endregion

//region Manager EmployerInterviews

export async function updateInterview(interviewId, interviewRequest) {
    const response = await fetcher(`employer/interviews/${interviewId}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(interviewRequest),
    });
    return handleResponse(response);
}


export async function createInterview(applicationId, interviewRequest) {
    console.log("interviewRequest");
    const response = await fetcher(`employer/applications/${applicationId}/interview`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(interviewRequest),
    });
    return handleEmpty(response);
}

export async function getEmployerInterviewsByApplicationId(applicationId) {
    const response = await fetcher(`employer/${applicationId}/interviews`, {method: "GET"});
    return handleResponse(response);
}

//endregion

//region Notifications
export async function getNotifications() {
    const response = await fetcher("notifications", {method: "GET"});
    return handleResponse(response);
}

// The backend only closes the user's own notifications
export async function markNotificationsAsRead(notificationIds) {
    const response = await fetcher("notifications/read", {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({notificationIds}),
    });
    return handleEmpty(response);
}

//endregion

//region Application
export async function getApplications(sessionId) {
    const response = await fetcher(withSession("employer/applications", sessionId), {method: "GET"});
    return handleResponse(response);
}

export async function offerInternshipsToStudents(applicationIds) {
    const response = await fetcher("employer/applications/offer", {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(applicationIds),
    });
    return handleEmpty(response);
}

export async function getApplicationCv(id) {
    const response = await fetcher(`employer/applications/${id}/cv`, {method: "GET"});
    return handleResponse(response);
}

export async function getApplicationCount() {
    const response = await fetcher("employer/applications/count", {method: "GET"});
    return handleResponse(response);
}

//endregion

//region Student EmployerInterviews

export async function getStudentInterviews() {
    const response = await fetcher("student/interviews", {method: "GET"});
    return handleResponse(response);
}

export async function acceptInterviews(interviewId) {
    const response = await fetcher(`student/interviews/${interviewId}/accept`, {method: "PUT"});
    return handleEmpty(response);
}

export async function denyInterviews(interviewId, comment) {
    const response = await fetcher(`student/interviews/${interviewId}/refuse`,
        {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({comment})
        }
        );
    return handleEmpty(response);
}

export async function rescheduleInterviews(interviewId, comment, interviewDate){
    const response = await fetcher(`student/interviews/${interviewId}/reschedule`,
        {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({comment,interviewDate})
        } );
    return handleEmpty(response);
}

//endregion

//region Employer EmployerInterviews
export async function getEmployerInterviews() {
    return handleResponse(await fetcher("employer/interviews", {method: "GET"}));
}

//endregion

// region Student documents (generic: CV, cover letters, transcripts)
const DOC_PATH = {
    CV: "cvs",
    COVER_LETTER: "cover-letters",
    TRANSCRIPT: "academic-transcripts",
};

export async function uploadDocument(type, file) {
    const form = new FormData();
    form.append("file", file);
    const response = await fetcher(`student/${DOC_PATH[type]}`, {
        method: "POST",
        headers: {Accept: "application/json"},
        body: form,
    });
    return handleEmpty(response);
}

// CV -> StudentCvResponseDto[], others -> DocumentResponseDto[] {id, fileName, sizeBytes, uploadedAt}
export async function getDocuments(type) {
    return handleResponse(await fetcher(`student/${DOC_PATH[type]}`, {method: "GET"}));
}

// Returns {id, fileName, content (Base64)}
export async function getDocumentFile(type, id) {
    return handleResponse(await fetcher(`student/${DOC_PATH[type]}/${id}`, {method: "GET"}));
}

export async function hideDocument(type, id) {
    return handleEmpty(await fetcher(`student/${DOC_PATH[type]}/${id}/hide`, {method: "PUT"}));
}

// Employer side: the cover letter / transcript sent with an application. Returns {id, fileName, content (Base64)}
export async function getApplicationCoverLetter(applicationId) {
    return handleResponse(await fetcher(`employer/applications/${applicationId}/cover-letter`, {method: "GET"}));
}

export async function getApplicationTranscript(applicationId) {
    return handleResponse(await fetcher(`employer/applications/${applicationId}/transcript`, {method: "GET"}));
}

// endregion

//region Expired Session
export async function getSessions() {
    const sessions = await handleResponse(await fetcher("sessions", {method: "GET"}));
    return {sessions};
}

export async function checkUserStatus() {
    return handleResponse(await fetcher("users/status", {method: "GET"}));
}

export async function getUsers() {
    return handleResponse(await fetcher("manager/students", {method: "GET"}));
}

export async function reactivateUser(studentId) {
    return handleResponse(await fetcher(`manager/students/${studentId}/reactivate`, {method: "PUT"}));
}

export async function denyUser(studentId) {
    return handleResponse(await fetcher(`manager/students/${studentId}/deny`, {method: "PUT"}));
}

//endregion