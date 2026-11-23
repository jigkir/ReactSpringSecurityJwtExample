/**
 * HomeSections.js — The sections the Home page shows for each role.
 * Location: src/components/home/HomeSections.js
 *
 * One section per page. Each section is a blue bar (whole page) over status tiles
 * (RED / YELLOW / GREEN) that show a live count and open the page with that filter selected.
 *
 * Tile order is always the same on every page: RED → YELLOW → GREEN
 * (rejected / waiting / approved, or the closest equivalent when a color does not exist).
 *
 * to          page the section links to
 * titleKey    translation key of the section title
 * page        wording of the status tiles: STATUS_LABEL_KEYS[page] (utils/StatusColor.js),
 *             the same words as the filter select of that page
 * param       query param read by the page as the initial filter ("status", or "applied" for student internships)
 * scoped      true when the page lists the session chosen in the navbar (the load waits for it)
 * colors      colors of the tiles in display order, ALL (blue) is always the top bar
 * load        ({sessionId, user}) => Promise<(color|null)[]>, one color per item of the page
 *             (null = item without color: counted by the blue bar only)
 *
 * Pure data + loaders: no React, no i18n. Colors, never translation keys, drive the counts.
 */

import {
    COLOR,
    colorOf
} from "../../utils/StatusColor.js";
import {
    getInterviewColor
} from "../../utils/interviewStatus.js";
import {getContractRole} from "../../utils/ContractRole.js";
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

export const SECTIONS_BY_ROLE = {
    STUDENT: [
        {
            to: "/portfolio", page: "studentCv", titleKey: "home.studentCvLink", param: "status", colors: STATUS_COLORS,
            load: async () => statusColors((await getDocuments("CV")).filter(isVisible)),
        },
        {
            to: "/internship",
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
        {
            to: "/interviews",
            page: "studentInterviews",
            titleKey: "home.studentInterviewsLink",
            param: "status",
            colors: STATUS_COLORS,
            load: loadInterviews(getStudentInterviews),
        },
        {
            to: "/offers", page: "studentOffers", titleKey: "navbar.offers", param: "status", colors: STATUS_COLORS,
            load: async () => asList(await getStudentOffers()).map((offer) => colorOf(offer.studentInternshipConsent)),
        },
        {
            to: "/student/contracts",
            page: "contracts",
            titleKey: "home.studentContractsLink",
            param: "status",
            scoped: true,
            colors: CONTRACT_COLORS,
            load: loadContracts,
        },
    ],
    EMPLOYER: [
        {
            to: "/internships",
            page: "employerInternships",
            titleKey: "home.employerInternshipsLink",
            param: "status",
            scoped: true,
            colors: STATUS_COLORS,
            load: async ({sessionId}) => statusColors(await getEmployerInternships(sessionId)),
        },
        {
            to: "/applications",
            page: "employerApplications",
            titleKey: "home.employerApplicationsLink",
            param: "status",
            scoped: true,
            colors: STATUS_COLORS,
            load: async ({sessionId}) =>
                asList(await getApplications(sessionId)).map((application) => colorOf(application.employerDecision)),
        },
        {
            to: "/employer/interviews",
            page: "employerInterviews",
            titleKey: "navbar.interviews",
            param: "status",
            colors: STATUS_COLORS,
            load: loadInterviews(getEmployerInterviews),
        },
        {
            to: "/employer/contracts",
            page: "contracts",
            titleKey: "home.employerContractsLink",
            param: "status",
            scoped: true,
            colors: CONTRACT_COLORS,
            load: loadContracts,
        },
    ],
    MANAGER: [
        {
            to: "/manager/cvs", page: "managerCv", titleKey: "home.managerCvLink", param: "status", scoped: true,
            colors: PENDING_ONLY,
            load: async ({sessionId}) => statusColors(await getPublicCvs(sessionId)),
        },
        {
            to: "/manager/internships",
            page: "managerInternships",
            titleKey: "home.managerInternshipsLink",
            param: "status",
            scoped: true,
            colors: PENDING_ONLY,
            load: async ({sessionId}) => statusColors(await getManagerInternships(sessionId)),
        },
        {
            to: "/manager/contracts",
            page: "contracts",
            titleKey: "home.managerContractsLink",
            param: "status",
            scoped: true,
            colors: PENDING_ONLY,
            load: loadContracts,
        },
        {
            // Accounts: APPROVED / PENDING / REJECTED (the backend may send any case)
            to: "/users",
            page: "managerUsers",
            titleKey: "navbar.users",
            param: "status",
            colors: PENDING_ONLY,
            load: async () => asList(await getUsers()).map((u) => colorOf(String(u.status ?? "").toUpperCase())),
        },
        {
            // Internship tracking: still to assign (YELLOW), then teacher assigned (GREEN)
            to: "/tracking",
            page: "managerTracking",
            titleKey: "navbar.tracking",
            param: "status",
            colors: PENDING_ONLY,
            load: async () => asList(await getInternshipTrackings())
                .map((tracking) => (tracking.teacher ? COLOR.GREEN : COLOR.YELLOW)),
        },
    ],
    TEACHER: [
        {
            // Workplace evaluations: still to complete / sign (YELLOW), then signed (GREEN)
            to: "/evaluations",
            page: "teacherEvaluations",
            titleKey: "workplaceEvaluation.title",
            param: "status",
            scoped: true,
            colors: CONTRACT_COLORS,
            load: async ({sessionId}) => asList(await fetchWorkplaceEvaluations(sessionId))
                .map((evaluation) => (evaluation.signedAt ? COLOR.GREEN : COLOR.YELLOW)),
        },
    ],
};