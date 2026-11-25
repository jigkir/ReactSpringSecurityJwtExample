/**
 * StatusColor.js — The color vocabulary shared by every filter and by the Home buttons.
 * Location: src/utils/StatusColor.js
 *
 * No React, no i18n here: status state and filtering compare COLORS. The only translation
 * related data is STATUS_LABEL_KEYS, keys of texts that already exist in translation.json.
 *
 *   ALL    blue    whole page, no filter
 *   GREEN          approved / accepted / offered / signed / applied
 *   YELLOW         pending (also the default for a missing or unknown status)
 *   RED            refused / rejected / cancelled / not applied
 */

export const ALL = "ALL";

export const COLOR = {RED: "RED", YELLOW: "YELLOW", GREEN: "GREEN"};

// Order of the options in every select
export const COLOR_VALUES = [ALL, COLOR.RED, COLOR.YELLOW, COLOR.GREEN];

// Raw backend statuses behind each color
export const STATUS_BY_COLOR = {
    [COLOR.GREEN]: ["APPROVED", "ACCEPTED", "INTERNSHIP_OFFERED"],
    [COLOR.YELLOW]: ["PENDING"],
    [COLOR.RED]: ["REJECTED"],
};

const COLOR_BY_STATUS = Object.fromEntries(
    Object.entries(STATUS_BY_COLOR).flatMap(([color, statuses]) => statuses.map((status) => [status, color])),
);

/** Color of a backend status. A missing or unknown status counts as YELLOW (pending). */
export const colorOf = (value) => COLOR_BY_STATUS[value] ?? COLOR.YELLOW;

/** True when `selected` is ALL or equals the item's color (an item without color only matches ALL). */
export const matchesColor = (itemColor, selected = ALL) => selected === ALL || itemColor === selected;

export const isColorValue = (value) => COLOR_VALUES.includes(value);

// ─── Card border from the filter color ────────────────────────────────────────

// Status understood by getInternshipCardClasses / getStatusBorder for each filter color
const BORDER_STATUS_BY_COLOR = {
    [COLOR.RED]: "REJECTED",
    [COLOR.YELLOW]: "PENDING",
    [COLOR.GREEN]: "APPROVED",
};

/**
 * Status to pass to getInternshipCardClasses(dark, status) / getStatusBorder so a card gets the
 * border of the selected filter color. ALL (or anything else) returns null: no colored border.
 */
export const borderStatusOf = (selectedColor) => BORDER_STATUS_BY_COLOR[selectedColor] ?? null;

// ─── Wording of the colors, per page ──────────────────────────────────────────

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

/**
 * Text of each color on each page: the SAME translation keys the cards and pills already use,
 * so the filter, the Home buttons and the cards always say the same thing (fr + en for free).
 * A page / color without an entry shows the color name.
 */
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
    // Same for the three roles: signed by the connected user or not (no red)
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
    employerApplications: managerKeys("managerStatus"),
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
    // Teacher evaluations: signed or not yet (no red)
    teacherEvaluations: {
        [ALL]: ALL_STATUSES,
        [COLOR.YELLOW]: "workplaceEvaluation.card.notSignedYet",
        [COLOR.GREEN]: "workplaceEvaluation.status.signed",
    },
};

/** Translation key of a color on a page, or undefined (the color name is shown instead). */
export const statusLabelKey = (page, color) => STATUS_LABEL_KEYS[page]?.[color];