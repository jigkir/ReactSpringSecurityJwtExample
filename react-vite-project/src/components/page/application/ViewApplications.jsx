import {useCallback, useEffect, useState} from "react";
import {Navigate, NavLink, useOutletContext, useParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {getApplicationCv, getApplications, getEmployerInternships, offerInternshipsToStudents} from "../../api/Api.jsx";
import ApplicationCard from "./ApplicationCard.jsx";
import Button from "../../../styles/Button.jsx";
import {base64ToBlobUrl} from "../../../utils/documents.js";
import {sortApplication} from "../../../utils/Sort.jsx";
import {translateWarning} from "../../../utils/CommonFields.jsx";
import {useNotifications} from "../../notification/NotificationsProvider.jsx";
import {usePolling} from "../../../utils/usePolling.js";
import {useNewApplications} from "../../../utils/useNewApplications.js";

const canHireApplication = (application) => application.employerDecision !== "INTERNSHIP_OFFERED" && application.employerDecision !== "REJECTED";

function ViewApplications({user}) {
    const {t} = useTranslation();
    const {dark} = useOutletContext();
    const {id} = useParams();
    const Nid = parseInt(id, 10);

    const [applications, setApplications] = useState([]);
    const [internshipTitle, setInternshipTitle] = useState("");
    const [error, setError] = useState("");
    const [listError, setListError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [allowed, setAllowed] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectionMode, setSelectionMode] = useState(false);
    const [hiring, setHiring] = useState(false);
    const [hireSuccessCount, setHireSuccessCount] = useState(0);
    const [hireError, setHireError] = useState(null);

    const [openPreviewIds, setOpenPreviewIds] = useState([]);
    const {register, isNew, clear: clearNew} = useNewApplications();

    const {refresh} = useNotifications();
    const isLoggedIn = Boolean(user?.isLoggedIn);

    // Reset selection when navigating to another internship
    useEffect(() => {
        setSelectedIds([]);
        setSelectionMode(false);
        setHireSuccessCount(0);
        setHireError(null);
    }, [Nid]);

    useEffect(() => {
        if (!isLoggedIn) return;
        if (!Nid) {
            setAllowed(false);
            return;
        }

        let active = true;
        setAllowed(null);
        setError("");

        getEmployerInternships()
            .then((internshipsData) => {
                if (!active) return;

                const list = Array.isArray(internshipsData) ? internshipsData : [];

                const matchedInternship = list.find((item) => item.id === Nid);

                if (matchedInternship?.status === "APPROVED") {
                    setInternshipTitle(matchedInternship.title ?? "");
                    setAllowed(true);
                } else {
                    setAllowed(false);
                }
            })
            .catch(() => {
                if (active) {
                    setError({key: "postInternship.loadError"});
                }
            });

        return () => {
            active = false;
        };
    }, [isLoggedIn, Nid]);

    // Fetch and update the applications list
    const fetchApplications = useCallback(async () => {
        const list = sortApplication(await getApplications(), Nid);

        register(list);
        setApplications(list);

        // Remove selections that are no longer eligible
        setSelectedIds((prev) => prev.filter((applicationId) => list.some((application) => application.id === applicationId && canHireApplication(application))));

        return list;
    }, [Nid, register]);

    const loadApplications = useCallback(async () => {
        try {
            await fetchApplications();
            setListError(null);
        } catch {
            setListError({key: "viewApplication.loadError"});
        } finally {
            setLoading(false);
        }
    }, [fetchApplications]);

    useEffect(() => {
        if (isLoggedIn && allowed) void loadApplications();
    }, [isLoggedIn, allowed, loadApplications]);

    // Pause polling while hiring
    usePolling(loadApplications, isLoggedIn && allowed === true && !hiring);

    // Eligible applications for hiring
    const eligibleApplications = applications.filter(canHireApplication);
    const eligibleIds = eligibleApplications.map((application) => application.id);

    const allSelected = eligibleIds.length > 0 && eligibleIds.every((applicationId) => selectedIds.includes(applicationId));

    const toggleSelection = (applicationId) => {
        if (!selectionMode || hiring || !eligibleIds.includes(applicationId)) return;

        setSelectedIds((prev) => prev.includes(applicationId) ? prev.filter((id) => id !== applicationId) : [...prev, applicationId]);
        setHireSuccessCount(0);
        setHireError(null);
    };

    const toggleSelectAll = () => {
        if (!selectionMode || hiring) return;

        setSelectedIds(allSelected ? [] : eligibleIds);
        setHireSuccessCount(0);
        setHireError(null);
    };

    const startHiring = () => {
        if (hiring || eligibleIds.length === 0) return;

        setSelectionMode(true);
        setSelectedIds([]);
        setHireSuccessCount(0);
        setHireError(null);
    };

    const cancelHiring = () => {
        if (hiring) return;

        setSelectionMode(false);
        setSelectedIds([]);
        setHireError(null);
    };

    const handleHire = async () => {
        if (!selectionMode || hiring) return;

        const ids = selectedIds.filter((applicationId) => eligibleIds.includes(applicationId));

        if (ids.length === 0) return;

        setHiring(true);
        setHireSuccessCount(0);
        setHireError(null);

        try {
            await offerInternshipsToStudents(ids);

            // Update the displayed status immediately after success
            setApplications((prev) => prev.map((application) => ids.includes(application.id) ? {
                ...application, employerDecision: "INTERNSHIP_OFFERED"
            } : application));

            setSelectedIds([]);
            setSelectionMode(false);
            setHireSuccessCount(ids.length);

            // Synchronize with the backend
            try {
                await fetchApplications();
                setListError(null);
            } catch {
                // Hiring succeeded, but refreshing failed
                setListError({key: "viewApplication.refreshError"});
            }
        } catch (err) {
            setHireError(err.i18n ?? {key: "error.server"});
        } finally {
            setHiring(false);
        }
    };

    const togglePreview = (appId) => {
        setOpenPreviewIds((prev) => prev.includes(appId) ? prev.filter((item) => item !== appId) : [...prev, appId]);
    };

    // Opening the CV marks the application as read on the server (and closes its notification),
    // but the "New" badge stays until the invitation is sent or the page is left.
    const getUrl = useCallback(async (appId) => {
        const cv = await getApplicationCv(appId);
        if (!cv?.content) throw new Error("missing content");

        void refresh();

        return base64ToBlobUrl(cv.content);
    }, [refresh]);

    // Interview invitation sent: remove the New badge
    const handleInterviewSent = useCallback((appId) => {
        clearNew(appId);
        void refresh();
    }, [clearNew, refresh]);

    if (allowed === false) {
        return <Navigate to="/internships" replace/>;
    }

    if (error) {
        return (<div className="p-6 text-center text-red-500" role="alert">
                {translateWarning(t, error)}
            </div>);
    }

    if (loading || allowed === null) {
        return (<div className="p-6 text-center" aria-busy="true">
                {t("viewApplication.loading")}
            </div>);
    }

    const hasItems = applications.length > 0;

    return (<div className="p-4 sm:p-6 flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-2 pb-4 border-b border-gray-200 dark:border-slate-700">
                <Button
                    as={NavLink}
                    to="/internships"
                    tone="primary"
                    dark={dark}
                    icon="arrow_back"
                    className="w-fit"
                >
                    {t("viewApplication.backBtn")}
                </Button>

                <h1 className={`text-2xl sm:text-4xl font-bold tracking-tight ${dark ? "text-white" : "text-gray-900"}`}>
                    {internshipTitle}
                </h1>
            </div>

            {/* Applications */}
            <div className="flex flex-col w-full mx-auto max-w-5xl gap-3">

                {hasItems && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        {selectionMode ? (
                            <>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <label className={`flex items-center gap-2 cursor-pointer ${
                                        dark ? "text-slate-300" : "text-gray-700"
                                    }`}>
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={toggleSelectAll}
                                            disabled={hiring || eligibleIds.length === 0}
                                            className="h-5 w-5 accent-blue-600 disabled:cursor-not-allowed"
                                        />
                                        {t("viewApplication.selectAll")}
                                    </label>

                                    <span className={`text-sm ${
                                        dark ? "text-slate-400" : "text-gray-500"
                                    }`}>
                        {t("viewApplication.selectedCount", {
                            count: selectedIds.length
                        })}
                    </span>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                    <Button
                                        tone="danger"
                                        dark={dark}
                                        disabled={hiring}
                                        onClick={cancelHiring}
                                        className="w-full sm:w-auto"
                                    >
                                        {t("viewApplication.cancelHire")}
                                    </Button>

                                    <Button
                                        tone="primary"
                                        dark={dark}
                                        disabled={selectedIds.length === 0 || hiring}
                                        onClick={handleHire}
                                        className="w-full sm:w-auto"
                                    >
                                        {hiring
                                            ? t("viewApplication.hiring")
                                            : t("viewApplication.confirmHire")}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="flex w-full justify-end">
                                <Button
                                    tone="primary"
                                    dark={dark}
                                    disabled={eligibleIds.length === 0}
                                    onClick={startHiring}
                                    className="w-full sm:w-auto"
                                >
                                    {t("viewApplication.hire")}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Confirmation */}
                {hireSuccessCount > 0 && (<p
                        role="status"
                        className="text-green-600 dark:text-green-400"
                    >
                        {t("viewApplication.hireSuccess", {
                            count: hireSuccessCount
                        })}
                    </p>)}

                {hireError && (<p role="alert" className="text-red-500">
                        {translateWarning(t, hireError)}
                    </p>)}

                {/* Loading/refresh error */}
                {listError && (<p role="alert" className="text-red-500">
                        {translateWarning(t, listError)}
                    </p>)}

                {/* Application cards */}
                {hasItems ? (applications.map((application) => {
                        const isPreviewOpen = openPreviewIds.includes(application.id);

                        return (<ApplicationCard
                                key={application.id}
                                application={application}
                                isNew={isNew(application)}
                                dark={dark}
                                isPreviewOpen={isPreviewOpen}
                                onTogglePreview={() => togglePreview(application.id)}
                                getUrl={getUrl}
                                onInterviewSent={handleInterviewSent}
                                selectionMode={selectionMode}
                                selected={selectedIds.includes(application.id)}
                                onSelect={selectionMode ? toggleSelection : undefined}
                                hiring={hiring}
                            />);
                    })) : !listError ? (
                    <p className={`text-sm py-8 text-center ${dark ? "text-slate-400" : "text-gray-500"}`}>
                        {t("viewApplication.empty")}
                    </p>) : null}
            </div>
        </div>);
}

export default ViewApplications;