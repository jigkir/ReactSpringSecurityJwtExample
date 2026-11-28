


export const ALL = "ALL";

export const COLOR = {RED: "RED", YELLOW: "YELLOW", GREEN: "GREEN"};


export const COLOR_VALUES = [ALL, COLOR.RED, COLOR.YELLOW, COLOR.GREEN];


export const STATUS_BY_COLOR = {
    [COLOR.GREEN]: ["APPROVED", "ACCEPTED", "INTERNSHIP_OFFERED"],
    [COLOR.YELLOW]: ["PENDING"],
    [COLOR.RED]: ["REJECTED"],
};

const COLOR_BY_STATUS = Object.fromEntries(
    Object.entries(STATUS_BY_COLOR).flatMap(([color, statuses]) => statuses.map((status) => [status, color])),
);


export const colorOf = (value) => COLOR_BY_STATUS[value] ?? COLOR.YELLOW;


export const matchesColor = (itemColor, selected = ALL) => selected === ALL || itemColor === selected;

export const isColorValue = (value) => COLOR_VALUES.includes(value);




const BORDER_STATUS_BY_COLOR = {
    [COLOR.RED]: "REJECTED",
    [COLOR.YELLOW]: "PENDING",
    [COLOR.GREEN]: "APPROVED",
};



export const borderStatusOf = (selectedColor) => BORDER_STATUS_BY_COLOR[selectedColor] ?? null;



const ALL_STATUSES = "internshipFilters.allStatuses";

const interviewKeys = (group, all) => ({
    [ALL]: all,
    [COLOR.YELLOW]: `${group}.statuses.awaitingResponse`,
    [COLOR.GREEN]: `${group}.statuses.upcoming`,
    [COLOR.RED]: `${group}.statuses.rejected`,
});

const cvKeys = (prefix, all) => ({
    [ALL]: all,
    [COLOR.RED]: `${prefix}Refused`,
    [COLOR.YELLOW]: `${prefix}Pending`,
    [COLOR.GREEN]: `${prefix}Approved`,
});

const managerKeys = (group) => ({
    [ALL]: ALL_STATUSES,
    [COLOR.RED]: `${group}.rejected`,
    [COLOR.YELLOW]: `${group}.pending`,
    [COLOR.GREEN]: `${group}.approved`,
});



export const STATUS_LABEL_KEYS = {
    studentCv: cvKeys("cvDocuments.status", "cvDocuments.allStatuses"),
    studentApplied: {
        [ALL]: "internshipFilters.allApplications",
        [COLOR.GREEN]: "internshipFilters.applied",
        [COLOR.RED]: "internshipFilters.notApplied",
    },
    studentInterviews: interviewKeys("studentInterviews", "studentInterviews.filters.all"),
    studentOffers: {
        [ALL]: ALL_STATUSES,
        [COLOR.YELLOW]: "studentOffers.consent.PENDING",
        [COLOR.GREEN]: "studentOffers.consent.ACCEPTED",
        [COLOR.RED]: "studentOffers.consent.REJECTED",
    },

    contracts: {
        [ALL]: ALL_STATUSES,
        [COLOR.YELLOW]: "managerContracts.status.toSign",
        [COLOR.GREEN]: "managerContracts.status.signed",
    },
    employerInternships: {
        [ALL]: ALL_STATUSES,
        [COLOR.RED]: "internshipCard.status.rejected",
        [COLOR.YELLOW]: "internshipCard.status.pendingValidation",
        [COLOR.GREEN]: "internshipCard.status.approved",
    },
    employerApplications: managerKeys("employerApplicationStatus"),
    employerInterviews: interviewKeys("employerInterviews", ALL_STATUSES),
    managerCv: managerKeys("managerStatus"),
    managerInternships: managerKeys("internshipFilters"),

    managerUsers: {
        [ALL]: ALL_STATUSES,
        [COLOR.RED]: "users.statuses.rejected",
        [COLOR.YELLOW]: "users.filters.pendingDecision",
        [COLOR.GREEN]: "users.statuses.approved",
    },
    managerTracking: {
        [ALL]: ALL_STATUSES,
        [COLOR.YELLOW]: "tracking.filters.pendingAttribution",
        [COLOR.GREEN]: "users.statuses.assigned",
    },
    managerStudentStatuses: {
        [ALL]: ALL_STATUSES,
        [COLOR.RED]: "studentStatuses.progress.RED",
        [COLOR.YELLOW]: "studentStatuses.progress.YELLOW",
        [COLOR.GREEN]: "studentStatuses.progress.GREEN",
    },

    teacherEvaluations: {
        [ALL]: ALL_STATUSES,
        [COLOR.YELLOW]: "workplaceEvaluation.card.notSignedYet",
        [COLOR.GREEN]: "workplaceEvaluation.status.signed",
    },
    managerEvaluations: {
        [ALL]: ALL_STATUSES,
        [COLOR.YELLOW]: "workplaceEvaluation.card.notSignedYet",
        [COLOR.GREEN]: "workplaceEvaluation.status.signed",
    },
};


export const statusLabelKey = (page, color) => STATUS_LABEL_KEYS[page]?.[color];



const STUDENT_PROGRESS_COLORS = {
    NO_CV: COLOR.RED,
    CV_REJECTED: COLOR.RED,
    NO_APPLICATION: COLOR.RED,
    NO_INTERVIEW: COLOR.RED,
    CV_PENDING: COLOR.YELLOW,
    UPCOMING_INTERVIEW: COLOR.YELLOW,
    AWAITING_DECISION: COLOR.YELLOW,
    OFFER_PENDING: COLOR.YELLOW,
    CONTRACT_PENDING: COLOR.YELLOW,
    CONTRACT_SIGNED: COLOR.GREEN,
};


export const studentStatusColor = (student) =>
    student.accountStatus === "APPROVED" ? (STUDENT_PROGRESS_COLORS[student.internshipStatus] ?? null) : null;
