/**
 * previewLoaders.js — Data for the Home page card previews.
 * Location: src/components/home/previewLoaders.js
 *
 * Each loader calls an existing Api.jsx function, then shapes the result with the
 * helpers in utils/Sort.jsx. All of them return:
 *   { stats: {KEY: number, ...}, items: [{id, text, sub?}] }
 *
 * Loaders are module-level (stable references) so CardPreview does not refetch
 * on re-render.
 */

import {countByStatus, sortCvsNewest, sortInternships} from '../../utils/Sort.jsx';
import {
    getApplications,
    getEmployerInternships,
    getManagerInternships,
    getPublicCvs,
    getStudentCvs,
    getStudentInternships,
} from '../api/Api.jsx';

// region Shared helpers
export const MAX_PREVIEW_ITEMS = 3;

const fullName = (student) => `${student?.firstName ?? ""} ${student?.lastName ?? ""}`.trim();

// endregion

// region Student
// Own visible CVs, newest first
export const loadStudentCvs = async () => {
    const docs = (await getStudentCvs()).filter((d) => d.visibility === "VISIBLE");
    return {
        stats: countByStatus(docs),
        items: sortCvsNewest(docs).slice(0, MAX_PREVIEW_ITEMS).map((d) => ({
            id: d.id,
            text: d.fileName,
        })),
    };
};

// Available (approved) internship offers, newest first
export const loadStudentInternships = async () => {
    const list = await getStudentInternships();
    return {
        stats: {PENDING: 0, APPROVED: list.length, REJECTED: 0},
        items: sortInternships(list, "NEWEST").slice(0, MAX_PREVIEW_ITEMS).map((i) => ({
            id: i.id,
            text: i.title,
            sub: i.location,
        })),
    };
};

// endregion

// region Employer
// Own offers, newest first
export const loadEmployerInternships = async () => {
    const list = await getEmployerInternships();
    return {
        stats: countByStatus(list),
        items: sortInternships(list, "NEWEST").slice(0, MAX_PREVIEW_ITEMS).map((i) => ({
            id: i.id,
            text: i.title,
            sub: i.location,
        })),
    };
};

// Applications received on the employer's offers: unread ones first (newest ids first)
export const loadEmployerApplications = async () => {
    const list = await getApplications();
    const isUnread = (a) => a.internshipApplicationStatus === "UNREAD";
    const unread = list.filter(isUnread);
    const ordered = [...unread, ...list.filter((a) => !isUnread(a))];
    return {
        stats: {UNREAD: unread.length, READ: list.length - unread.length},
        items: ordered.slice(0, MAX_PREVIEW_ITEMS).map((a) => ({
            id: a.id,
            text: fullName(a.student) || a.student?.email || "",
            sub: a.internshipTitle,
        })),
    };
};

// endregion

// region Manager
// Counts over all CVs, list = newest CVs still waiting for review
export const loadManagerCvs = async () => {
    const docs = await getPublicCvs();
    const pending = docs.filter((d) => (d.status ?? "PENDING") === "PENDING");
    return {
        stats: countByStatus(docs),
        items: sortCvsNewest(pending).slice(0, MAX_PREVIEW_ITEMS).map((d) => ({
            id: d.id,
            text: fullName(d.student) || d.fileName,
            sub: d.fileName,
        })),
    };
};

// Counts over all offers, list = newest offers still waiting for review
export const loadManagerInternships = async () => {
    const list = await getManagerInternships();
    const pending = list.filter((i) => i.status === "PENDING");
    return {
        stats: countByStatus(list),
        items: sortInternships(pending, "NEWEST").slice(0, MAX_PREVIEW_ITEMS).map((i) => ({
            id: i.id,
            text: i.title,
            sub: i.employerEmail,
        })),
    };
};

// endregion