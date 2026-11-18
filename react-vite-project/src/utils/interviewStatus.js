export const INTERVIEW_STATUS = {
    AWAITING_RESPONSE: "awaitingResponse",
    UPCOMING: "upcoming",
    REJECTED: "rejected",
    PAST: "past",
    CANCELLED: "cancelled",
};

const STUDENT_DECISION = {ACCEPTED: "ACCEPTED", REJECTED: "REJECTED"};
const CANCELLED = "CANCELLED";

export const INTERVIEW_STATUS_ACCENT = {
    [INTERVIEW_STATUS.AWAITING_RESPONSE]: "border-l-yellow-500",
    [INTERVIEW_STATUS.UPCOMING]: "border-l-green-500",
    [INTERVIEW_STATUS.REJECTED]: "border-l-red-500",
    [INTERVIEW_STATUS.PAST]: "border-l-slate-400",
    [INTERVIEW_STATUS.CANCELLED]: "border-l-red-500",
};

export const getInterviewTime = (interview) => {
    const time = new Date(interview.interviewDate).getTime();
    return Number.isNaN(time) ? null : time;
};

export const isCancelled = (interview) => interview.interviewStatus === CANCELLED;

export const getInterviewStatus = (interview) => {
    if (isCancelled(interview)) return INTERVIEW_STATUS.CANCELLED;

    const time = getInterviewTime(interview);
    if (time !== null && time < Date.now()) return INTERVIEW_STATUS.PAST;

    if (interview.studentDecision === STUDENT_DECISION.REJECTED) return INTERVIEW_STATUS.REJECTED;
    if (interview.studentDecision === STUDENT_DECISION.ACCEPTED) return INTERVIEW_STATUS.UPCOMING;

    return INTERVIEW_STATUS.AWAITING_RESPONSE;
};