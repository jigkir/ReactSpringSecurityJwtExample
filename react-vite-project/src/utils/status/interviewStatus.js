import {COLOR} from "./StatusColor.js";

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


const INTERVIEW_COLOR = {
    [INTERVIEW_STATUS.AWAITING_RESPONSE]: COLOR.YELLOW,
    [INTERVIEW_STATUS.UPCOMING]: COLOR.GREEN,
    [INTERVIEW_STATUS.REJECTED]: COLOR.RED,
    [INTERVIEW_STATUS.CANCELLED]: COLOR.RED,
    [INTERVIEW_STATUS.PAST]: null,
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


export const getInterviewColor = (interview) => INTERVIEW_COLOR[getInterviewStatus(interview)] ?? null;

export const sortInterviews = (list) => {
    const now = Date.now();
    const group = (item) => isCancelled(item) ? 2 : (getInterviewTime(item) ?? 0) >= now ? 0 : 1;
    return [...(list ?? [])].sort((a, b) => {
        const ga = group(a);
        const gb = group(b);
        if (ga !== gb) return ga - gb;
        const ta = getInterviewTime(a) ?? 0;
        const tb = getInterviewTime(b) ?? 0;
        return ga === 0 ? ta - tb : tb - ta;
    });
};
