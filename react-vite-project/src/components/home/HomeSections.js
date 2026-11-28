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
    colorOf,
    studentStatusColor
} from "../../utils/StatusColor.js";
import {
    getInterviewColor
} from "../../utils/interviewStatus.js";
import {canSign, getContractRole} from "../../utils/ContractRole.js";
import {PATHS, ROUTES} from "../../routes/AppRoutes.jsx";
import {MOCK_STUDENTS} from "../student-statuses/StudentStatusMock.js";
import {
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
import {EVALUATION_ROLES, evaluationColor} from "../../utils/EvaluationRole.js";

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

// Employer applications: the ones the employer refused need no follow-up
const WITHOUT_REFUSED = [COLOR.YELLOW, COLOR.GREEN];

const asList = (data) => (Array.isArray(data) ? data : []);
const loadEvaluations = (role) => async ({sessionId}) =>
    asList(await role.fetchList(sessionId)).map(evaluationColor);

const isVisible = (doc) => (doc.visibility ?? "VISIBLE") === "VISIBLE";

const statusColors = (list) => asList(list).map((item) => colorOf(item.status));

// Signed (GREEN), to sign now (YELLOW), or no color while the manager waits for the student and the employer
const contractColor = (contract, contractRole) => {
    if (contract[contractRole.signedAtField]) return COLOR.GREEN;
    return canSign(contract, contractRole) ? COLOR.YELLOW : null;
};

const loadContracts = async ({sessionId, user}) => {
    const contractRole = getContractRole(user);
    return asList(await getContracts(sessionId)).map((contract) => contractColor(contract, contractRole));
};

const loadInterviews = (getter) => async () => asList(await getter()).map(getInterviewColor);

// region Card config of each page, keyed by the path of its route in AppRoutes.jsx
const buildHomeCards = () => ({
    // ───────── Student ─────────
    [PATHS.STUDENT_PORTFOLIO]: {
        icon: "upload_file",
        page: "studentCv",
        titleKey: "home.studentCvLink",
        param: "status",
        colors: STATUS_COLORS,
        load: async () => statusColors((await getDocuments("CV")).filter(isVisible)),
    },
    [PATHS.STUDENT_INTERVIEWS]: {
        icon: "event",
        page: "studentInterviews",
        titleKey: "home.studentInterviewsLink",
        param: "status",
        colors: STATUS_COLORS,
        load: loadInterviews(getStudentInterviews),
    },
    [PATHS.STUDENT_OFFERS]: {
        icon: "star",
        page: "studentOffers",
        titleKey: "home.studentOffersLink",
        param: "status",
        colors: STATUS_COLORS,
        load: async () => asList(await getStudentOffers()).map((offer) => colorOf(offer.studentInternshipConsent)),
    },
    [PATHS.STUDENT_INTERNSHIPS]: {
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
    [PATHS.STUDENT_CONTRACTS]: {
        icon: "edit",
        page: "contracts",
        titleKey: "home.studentContractsLink",
        param: "status",
        scoped: true,
        colors: CONTRACT_COLORS,
        load: loadContracts,
    },

    // ───────── Employer ─────────
    [PATHS.EMPLOYER_INTERNSHIPS]: {
        icon: "business_center",
        page: "employerInternships",
        titleKey: "home.employerInternshipsLink",
        param: "status",
        scoped: true,
        colors: STATUS_COLORS,
        load: async ({sessionId}) => statusColors(await getEmployerInternships(sessionId)),
    },
    [PATHS.EMPLOYER_APPLICATIONS]: {
        icon: "person",
        page: "employerApplications",
        titleKey: "home.employerApplicationsLink",
        param: "status",
        scoped: true,
        colors: WITHOUT_REFUSED,
        load: async ({sessionId}) =>
            asList(await getApplications(sessionId)).map((application) => colorOf(application.employerDecision)),
    },
    [PATHS.EMPLOYER_INTERVIEWS]: {
        icon: "event",
        page: "employerInterviews",
        titleKey: "home.employerInterviewsLink",
        param: "status",
        colors: STATUS_COLORS,
        load: loadInterviews(getEmployerInterviews),
    },
    [PATHS.EMPLOYER_CONTRACTS]: {
        icon: "edit",
        page: "contracts",
        titleKey: "home.employerContractsLink",
        param: "status",
        scoped: true,
        colors: CONTRACT_COLORS,
        load: loadContracts,
    },

    // ───────── Manager ─────────
    [PATHS.MANAGER_CVS]: {
        icon: "picture_as_pdf",
        page: "managerCv",
        titleKey: "home.managerCvLink",
        param: "status",
        scoped: true,
        colors: PENDING_ONLY,
        load: async ({sessionId}) => statusColors(await getPublicCvs(sessionId)),
    },
    [PATHS.MANAGER_INTERNSHIPS]: {
        icon: "business_center",
        page: "managerInternships",
        titleKey: "home.managerInternshipsLink",
        param: "status",
        scoped: true,
        colors: PENDING_ONLY,
        load: async ({sessionId}) => statusColors(await getManagerInternships(sessionId)),
    },
    [PATHS.MANAGER_CONTRACTS]: {
        icon: "edit",
        page: "contracts",
        titleKey: "home.managerContractsLink",
        param: "status",
        scoped: true,
        colors: PENDING_ONLY,
        load: loadContracts,
    },
    // Accounts: APPROVED / PENDING / REJECTED (the backend may send any case)
    [PATHS.MANAGER_USERS]: {
        icon: "admin_panel_settings",
        page: "managerUsers",
        titleKey: "home.managerUsersLink",
        param: "status",
        colors: PENDING_ONLY,
        load: async () => asList(await getUsers()).map((u) => colorOf(String(u.status ?? "").toUpperCase())),
    },
    // Internship tracking: still to assign (YELLOW), then teacher assigned (GREEN)
    [PATHS.MANAGER_TRACKING]: {
        icon: "co_present",
        page: "managerTracking",
        titleKey: "home.managerTrackingLink",
        param: "status",
        colors: PENDING_ONLY,
        load: async () => asList(await getInternshipTrackings())
            .map((tracking) => (tracking.teacher ? COLOR.GREEN : COLOR.YELLOW)),
    },
    [PATHS.MANAGER_EVALUATIONS]: {
        icon: "share_reviews",
        page: "managerEvaluations",
        titleKey: "home.managerEvaluationsLink",
        param: "status",
        scoped: true,
        colors: PENDING_ONLY,
        load: loadEvaluations(EVALUATION_ROLES.MANAGER),
    },
    // Student statuses: needs follow-up (RED), in progress (YELLOW). Mock data until the backend exists
    [PATHS.MANAGER_STUDENT_STATUSES]: {
        icon: "person",
        page: "managerStudentStatuses",
        titleKey: "home.managerStudentStatusesLink",
        param: "status",
        colors: [COLOR.RED, COLOR.YELLOW],
        load: async () => MOCK_STUDENTS.map(studentStatusColor),
    },

    // ───────── Teacher ─────────
    // Workplace evaluations: still to complete / sign (YELLOW), then signed (GREEN)
    [PATHS.TEACHER_EVALUATIONS]: {
        icon: "share_reviews",
        page: "teacherEvaluations",
        titleKey: "home.teacherEvaluationsLink",
        param: "status",
        scoped: true,
        colors: CONTRACT_COLORS,
        load: loadEvaluations(EVALUATION_ROLES.TEACHER),
    },
});
// endregion

// region Sections of a role, built from ROUTES
// One array per role, built once: Home uses it as a hook dependency, so its identity must be stable
const sectionsByRole = new Map();

const getHomeOrderByRole = () => ({
    STUDENT: [
        PATHS.STUDENT_INTERNSHIPS,
        PATHS.STUDENT_INTERVIEWS,
        PATHS.STUDENT_OFFERS,
        PATHS.STUDENT_PORTFOLIO,
        PATHS.STUDENT_CONTRACTS,
    ],
});

// Built on first use: PATHS does not exist yet while the modules load (circular import)
let homeCards = null;
const getHomeCards = () => (homeCards ??= buildHomeCards());

/** [{to, ...card}] of the role: the routes with `home: [role]`, in display order. */
export const getHomeSections = (role) => {
    if (!sectionsByRole.has(role)) {
        const sections = ROUTES
            .filter((route) => route.home?.includes(role) && getHomeCards()[route.path])
            .map((route) => ({to: route.path, ...getHomeCards()[route.path]}));
        const order = getHomeOrderByRole()[role];
        if (order) {
            sections.sort((a, b) => order.indexOf(a.to) - order.indexOf(b.to));
        }
        sectionsByRole.set(role, sections);
    }
    return sectionsByRole.get(role);
};

// Spotlight: the cards that need attention first (none while the colors load or after a failure)
const hasColor = (colorsByPage, page, color) =>
    Array.isArray(colorsByPage[page]) && colorsByPage[page].includes(color);

const isLoaded = (colorsByPage, pages) => pages.every((page) => Array.isArray(colorsByPage[page]));

/** Pages of the [page, color] pairs whose card has an item of that color. */
const pagesWithToDo = (colorsByPage, toDos) => toDos
    .filter(([page, color]) => hasColor(colorsByPage, page, color))
    .map(([page]) => page);

// Student: the next step of the internship search, one at a time
//   contract to sign > hired (nothing) > offer to answer > no usable CV > internships to apply to and interviews to answer
const studentSpotlight = (colorsByPage) => {
    if (!isLoaded(colorsByPage, [PATHS.STUDENT_PORTFOLIO, PATHS.STUDENT_OFFERS, PATHS.STUDENT_CONTRACTS])) return [];
    if (hasColor(colorsByPage, PATHS.STUDENT_CONTRACTS, COLOR.YELLOW)) return [PATHS.STUDENT_CONTRACTS];
    if (hasColor(colorsByPage, PATHS.STUDENT_OFFERS, COLOR.GREEN)) return [];
    if (hasColor(colorsByPage, PATHS.STUDENT_OFFERS, COLOR.YELLOW)) return [PATHS.STUDENT_OFFERS];
    if (!hasColor(colorsByPage, PATHS.STUDENT_PORTFOLIO, COLOR.GREEN)
        && !hasColor(colorsByPage, PATHS.STUDENT_PORTFOLIO, COLOR.YELLOW)) {
        return [PATHS.STUDENT_PORTFOLIO];
    }

    return pagesWithToDo(colorsByPage, [[PATHS.STUDENT_INTERNSHIPS, COLOR.RED], [PATHS.STUDENT_INTERVIEWS, COLOR.YELLOW]]);
};

// Employer: contract to sign > no internship this session (publish one)
//   > internships refused by the manager (to correct) and applications to review
const employerSpotlight = (colorsByPage) => {
    if (!isLoaded(colorsByPage, [PATHS.EMPLOYER_INTERNSHIPS, PATHS.EMPLOYER_CONTRACTS])) return [];
    if (hasColor(colorsByPage, PATHS.EMPLOYER_CONTRACTS, COLOR.YELLOW)) return [PATHS.EMPLOYER_CONTRACTS];
    if (colorsByPage[PATHS.EMPLOYER_INTERNSHIPS].length === 0) return [PATHS.EMPLOYER_INTERNSHIPS];

    return pagesWithToDo(colorsByPage, [[PATHS.EMPLOYER_INTERNSHIPS, COLOR.RED], [PATHS.EMPLOYER_APPLICATIONS, COLOR.YELLOW]]);
};

// Manager: what blocks the others (accounts, CVs, internships, contracts ready to sign) > internships to assign to a teacher
const managerSpotlight = (colorsByPage) => {
    const tasks = [PATHS.MANAGER_USERS, PATHS.MANAGER_CVS, PATHS.MANAGER_INTERNSHIPS, PATHS.MANAGER_CONTRACTS];
    if (!isLoaded(colorsByPage, tasks)) return [];

    const toDo = pagesWithToDo(colorsByPage, tasks.map((page) => [page, COLOR.YELLOW]));
    return toDo.length > 0 ? toDo : pagesWithToDo(colorsByPage, [[PATHS.MANAGER_TRACKING, COLOR.YELLOW]]);
};

// Teacher: workplace evaluations to complete and sign
const teacherSpotlight = (colorsByPage) => pagesWithToDo(colorsByPage, [[PATHS.TEACHER_EVALUATIONS, COLOR.YELLOW]]);

const SPOTLIGHT_BY_ROLE = {
    STUDENT: studentSpotlight,
    EMPLOYER: employerSpotlight,
    MANAGER: managerSpotlight,
    TEACHER: teacherSpotlight,
};

/** Pages whose card stands out for the role: none while the colors load or after a failure. */
export const getSpotlightPages = (role, colorsByPage) => SPOTLIGHT_BY_ROLE[role]?.(colorsByPage) ?? [];
// endregion