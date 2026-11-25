/**
 * HomeSections.js — The sections the Home page shows for each role.
 * Location: src/components/home/HomeSections.js
 *
 * One section per page. Each section is a card with the total of the page and one row per status
 * (RED / YELLOW / GREEN) that shows a live count and opens the page with that filter selected.
 *
 * Row order is always the same on every page: RED → YELLOW → GREEN
 * (rejected / waiting / approved, or the closest equivalent when a color does not exist).
 *
 * to          page the section links to
 * icon        Material Symbols name of the page (must be in the icon_names list of index.html)
 * titleKey    translation key of the section title
 * page        wording of the status rows: STATUS_LABEL_KEYS[page] (utils/StatusColor.js),
 *             the same words as the filter select of that page
 * param       query param read by the page as the initial filter ("status", or "applied" for student internships)
 * scoped      true when the page lists the session chosen in the navbar (the load waits for it)
 * colors      colors of the status rows in display order
 * load        ({sessionId, user}) => Promise<(color|null)[]>, one color per item of the page
 *             (null = item without color: counted in the total only)
 *
 * Pure data + loaders: no React, no i18n. Colors, never translation keys, drive the counts.
 */

import {
    ALL,
    COLOR,
    colorOf
} from "../../utils/StatusColor.js";
import {
    getInterviewColor
} from "../../utils/interviewStatus.js";
import {getContractRole} from "../../utils/ContractRole.js";
import {ROUTES} from "../../routes/AppRoutes.jsx";
import {
    fetchWorkplaceEvaluations,
    getApplications,
    getContracts,
    getDocuments,
    getEmployerInternships,
    getEmployerInterviews,
    getInternshipTrackings,
    getManagerInternships,
    getPublicCvs,
    getStudentAppliedInternships,
    getStudentInternships,
    getStudentInterviews,
    getStudentOffers,
    getUsers,
} from "../api/Api.jsx";

// The status that waits for an action
export const ACTION_COLOR = COLOR.YELLOW;

// Colors of a page whose load failed
export const LOAD_FAILED = "LOAD_FAILED";

/**
 * {ALL: n, RED: n, ...} of a page's colors, or null while they load or after a failure.
 * ALL is the total of the card: it only counts the colors the card shows (`shown`),
 * and never GREEN. Manager cards show YELLOW only, so their total is the pending items.
 */
export const countColors = (colors, shown = [COLOR.RED, COLOR.YELLOW]) => {
    if (!Array.isArray(colors)) return null;

    const counted = shown.filter((color) => color !== COLOR.GREEN);
    const counts = {[ALL]: colors.filter((color) => counted.includes(color)).length};
    colors.filter(Boolean).forEach((color) => {
        counts[color] = (counts[color] ?? 0) + 1;
    });
    return counts;
};

export const countOf = (counts, color) => (counts ? (counts[color] ?? 0) : null);

/** Count to show: the number, "…" while loading, "–" after a failure. */
export const countText = (counts, failed, color) => {
    const count = countOf(counts, color);
    if (count !== null) return String(count);
    return failed ? "–" : "…";
};

/** The page of a section with one status color selected as its filter. */
export const filteredPage = (section, color) => `${section.to}?${section.param}=${color}`;

const STATUS_COLORS = [COLOR.RED, COLOR.YELLOW, COLOR.GREEN];

// Student internships: RED = not applied, GREEN = applied
const APPLIED_COLORS = [COLOR.RED, COLOR.GREEN];

// Contracts have no red: not signed yet by the connected user (YELLOW), then signed (GREEN)
const CONTRACT_COLORS = [COLOR.YELLOW, COLOR.GREEN];

const PENDING_ONLY = [COLOR.YELLOW];

const asList = (data) => (Array.isArray(data) ? data : []);

const isVisible = (doc) => (doc.visibility ?? "VISIBLE") === "VISIBLE";

const statusColors = (list) => asList(list).map((item) => colorOf(item.status));

const loadContracts = async ({sessionId, user}) => {
    const {signedAtField} = getContractRole(user);
    return asList(await getContracts(sessionId))
        .map((contract) => (contract[signedAtField] ? COLOR.GREEN : COLOR.YELLOW));
};

const loadInterviews = (getter) => async () => asList(await getter()).map(getInterviewColor);

// region Card config of each page, keyed by the path of its route in AppRoutes.jsx
const HOME_CARDS = {
    // ───────── Student ─────────
    "/portfolio": {
        icon: "upload_file",
        page: "studentCv",
        titleKey: "home.studentCvLink",
        param: "status",
        colors: STATUS_COLORS,
        load: async () => statusColors((await getDocuments("CV")).filter(isVisible)),
    },
    "/interviews": {
        icon: "event",
        page: "studentInterviews",
        titleKey: "home.studentInterviewsLink",
        param: "status",
        colors: STATUS_COLORS,
        load: loadInterviews(getStudentInterviews),
    },
    "/offers": {
        icon: "star",
        page: "studentOffers",
        titleKey: "navbar.offers",
        param: "status",
        colors: STATUS_COLORS,
        load: async () => asList(await getStudentOffers()).map((offer) => colorOf(offer.studentInternshipConsent)),
    },
    "/internship": {
        icon: "work",
        page: "studentApplied",
        titleKey: "home.studentInternshipsLink",
        param: "applied",
        scoped: true,
        colors: APPLIED_COLORS,
        load: async ({sessionId}) => {
            const [internships, applications] = await Promise.all([
                getStudentInternships(sessionId), getStudentAppliedInternships(sessionId)]);
            const appliedIds = new Set(asList(applications).map((application) => application.internshipId));
            return asList(internships).map((i) => (appliedIds.has(i.id) ? COLOR.GREEN : COLOR.RED));
        },
    },
    "/student/contracts": {
        icon: "edit",
        page: "contracts",
        titleKey: "home.studentContractsLink",
        param: "status",
        scoped: true,
        colors: CONTRACT_COLORS,
        load: loadContracts,
    },

    // ───────── Employer ─────────
    "/internships": {
        icon: "business_center",
        page: "employerInternships",
        titleKey: "home.employerInternshipsLink",
        param: "status",
        scoped: true,
        colors: STATUS_COLORS,
        load: async ({sessionId}) => statusColors(await getEmployerInternships(sessionId)),
    },
    "/applications": {
        icon: "person",
        page: "employerApplications",
        titleKey: "home.employerApplicationsLink",
        param: "status",
        scoped: true,
        colors: STATUS_COLORS,
        load: async ({sessionId}) =>
            asList(await getApplications(sessionId)).map((application) => colorOf(application.employerDecision)),
    },
    "/employer/interviews": {
        icon: "event",
        page: "employerInterviews",
        titleKey: "navbar.interviews",
        param: "status",
        colors: STATUS_COLORS,
        load: loadInterviews(getEmployerInterviews),
    },
    "/employer/contracts": {
        icon: "edit",
        page: "contracts",
        titleKey: "home.employerContractsLink",
        param: "status",
        scoped: true,
        colors: CONTRACT_COLORS,
        load: loadContracts,
    },

    // ───────── Manager ─────────
    "/manager/cvs": {
        icon: "picture_as_pdf",
        page: "managerCv",
        titleKey: "home.managerCvLink",
        param: "status",
        scoped: true,
        colors: PENDING_ONLY,
        load: async ({sessionId}) => statusColors(await getPublicCvs(sessionId)),
    },
    "/manager/internships": {
        icon: "business_center",
        page: "managerInternships",
        titleKey: "home.managerInternshipsLink",
        param: "status",
        scoped: true,
        colors: PENDING_ONLY,
        load: async ({sessionId}) => statusColors(await getManagerInternships(sessionId)),
    },
    "/manager/contracts": {
        icon: "edit",
        page: "contracts",
        titleKey: "home.managerContractsLink",
        param: "status",
        scoped: true,
        colors: PENDING_ONLY,
        load: loadContracts,
    },
    // Accounts: APPROVED / PENDING / REJECTED (the backend may send any case)
    "/users": {
        icon: "admin_panel_settings",
        page: "managerUsers",
        titleKey: "navbar.users",
        param: "status",
        colors: PENDING_ONLY,
        load: async () => asList(await getUsers()).map((u) => colorOf(String(u.status ?? "").toUpperCase())),
    },
    // Internship tracking: still to assign (YELLOW), then teacher assigned (GREEN)
    "/tracking": {
        icon: "co_present",
        page: "managerTracking",
        titleKey: "navbar.tracking",
        param: "status",
        colors: PENDING_ONLY,
        load: async () => asList(await getInternshipTrackings())
            .map((tracking) => (tracking.teacher ? COLOR.GREEN : COLOR.YELLOW)),
    },

    // ───────── Teacher ─────────
    // Workplace evaluations: still to complete / sign (YELLOW), then signed (GREEN)
    "/evaluations": {
        icon: "share_reviews",
        page: "teacherEvaluations",
        titleKey: "workplaceEvaluation.title",
        param: "status",
        scoped: true,
        colors: CONTRACT_COLORS,
        load: async ({sessionId}) => asList(await fetchWorkplaceEvaluations(sessionId))
            .map((evaluation) => (evaluation.signedAt ? COLOR.GREEN : COLOR.YELLOW)),
    },
};
// endregion

// region Sections of a role, built from ROUTES
// One array per role, built once: Home uses it as a hook dependency, so its identity must be stable
const sectionsByRole = new Map();

/** [{to, ...card}] of the role: the routes with `home: [role]`, in the order of ROUTES. */
export const getHomeSections = (role) => {
    if (!sectionsByRole.has(role)) {
        sectionsByRole.set(role, ROUTES
            .filter((route) => route.home?.includes(role) && HOME_CARDS[route.path])
            .map((route) => ({to: route.path, ...HOME_CARDS[route.path]})));
    }
    return sectionsByRole.get(role);
};
// endregion