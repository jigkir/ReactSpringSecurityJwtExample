/**
 * homeCards.js — Which cards the Home page shows for each role.
 * Location: src/components/home/homeCards.js
 *
 * titleKey / descKey / itemsKey are translation keys (translated at render time).
 * `load` is optional: a card without it is a plain link with no preview.
 * `statOrder` is optional: custom [key, translationKey, icon] pills (defaults to
 * pending / approved / rejected).
 */

import {
    loadEmployerApplications,
    loadEmployerInternships,
    loadManagerCvs,
    loadManagerInternships,
    loadStudentCvs,
    loadStudentInternships,
} from './previewLoaders.js';

// region Card definitions
const CV_CARD = {
    to: "/cv", icon: "picture_as_pdf",
    titleKey: "home.cvTitle", descKey: "home.cvDesc",
    load: loadStudentCvs,
};

const MANAGER_CV_CARD = {
    ...CV_CARD,
    to: "/manager/cvs", descKey: "home.cvManagerDesc",
    load: loadManagerCvs, itemsKey: "home.preview.toReview",
};

const STUDENT_INTERNSHIPS_CARD = {
    to: "/internship", icon: "business_center",
    titleKey: "home.internshipsTitle", descKey: "home.internshipsStudentDesc",
    load: loadStudentInternships,
    statOrder: [["APPROVED", "home.preview.available", "check_circle"]],
};

const EMPLOYER_INTERNSHIPS_CARD = {
    to: "/internships", icon: "business_center",
    titleKey: "home.internshipsTitle", descKey: "home.internshipsEmployerDesc",
    load: loadEmployerInternships,
};

const EMPLOYER_APPLICATIONS_CARD = {
    to: "/applications", icon: "send",
    titleKey: "home.applicationsTitle", descKey: "home.applicationsDesc",
    load: loadEmployerApplications, itemsKey: "home.preview.latestApplications",
    statOrder: [
        ["UNREAD", "home.preview.newApplications", "notifications"],
        ["READ", "home.preview.viewedApplications", "visibility"],
    ],
};

const MANAGER_INTERNSHIPS_CARD = {
    to: "/manager/internships", icon: "business_center",
    titleKey: "home.internshipsTitle", descKey: "home.internshipsManagerDesc",
    load: loadManagerInternships, itemsKey: "home.preview.toReview",
};

// endregion

// region Cards by role
export const CARDS_BY_ROLE = {
    STUDENT: [CV_CARD, STUDENT_INTERNSHIPS_CARD],
    EMPLOYER: [EMPLOYER_INTERNSHIPS_CARD, EMPLOYER_APPLICATIONS_CARD],
    MANAGER: [MANAGER_CV_CARD, MANAGER_INTERNSHIPS_CARD],
    TEACHER: [],
};