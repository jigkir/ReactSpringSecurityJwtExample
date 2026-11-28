import {
    acceptInterviews,
    denyInterviews,
    getStudentInterviews,
    getEmployerInterviews,
    updateInterview,
    cancelInterview,
} from "../components/api/Api.jsx";

export const INTERVIEW_ROLES = {
    STUDENT: {
        fetchList: () => getStudentInterviews(),
        accept: (id) => acceptInterviews(id),
        reject: (id, reason) => denyInterviews(id, reason),
        update: null,
        cancel: null,
        can: {accept: true, reject: true, edit: false, cancel: false},
    },
    EMPLOYER: {
        fetchList: () => getEmployerInterviews(),
        accept: null,
        reject: null,
        update: (id, payload) => updateInterview(id, payload),
        cancel: (id) => cancelInterview(id),
        can: {accept: false, reject: false, edit: true, cancel: true},
    },
};

export const getInterviewRole = (user) => {
    const role = String(user?.role ?? "").replace("ROLE_", "");
    return INTERVIEW_ROLES[role] ?? INTERVIEW_ROLES.EMPLOYER;
};
