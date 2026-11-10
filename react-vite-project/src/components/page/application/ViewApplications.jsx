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

function ViewApplications({user}) {
    const {t} = useTranslation();
    const [applications, setApplications] = useState([]);
    const [internshipTitle, setInternshipTitle] = useState("");
    const {id} = useParams();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [allowed, setAllowed] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [hiring, setHiring] = useState(false);
    const {dark} = useOutletContext();
    const Nid = parseInt(id, 10);

    const [openPreviewIds, setOpenPreviewIds] = useState([]);
    const {register, isNew, clear: clearNew} = useNewApplications();

    const {refresh} = useNotifications();
    const isLoggedIn = Boolean(user?.isLoggedIn);

    const toggleSelection = (applicationId) => {
        setSelectedIds((prev) =>
            prev.includes(applicationId)
                ? prev.filter((id) => id !== applicationId)
                : [...prev, applicationId]
        );
    };

    const [hireSuccess, setHireSuccess] = useState(false);
    const [hireError, setHireError] = useState(null);

    const handleHire = async () => {
        if (selectedIds.length === 0 || hiring) return;

        setHiring(true);
        setHireSuccess(false);
        setHireError(null);

        try {
            await offerInternshipsToStudents(selectedIds);
            await loadApplications();

            setSelectedIds([]);
            setHireSuccess(true);
        } catch (err) {
            setHireError(err.i18n ?? {key: "error.server"});
        } finally {
            setHiring(false);
        }
    };

    useEffect(() => {
        setSelectedIds([]);
    }, [Nid]);

    useEffect(() => {
        if (!isLoggedIn) return;
        if (!Nid) {
            setAllowed(false);
            return;
        }

        getEmployerInternships()
            .then((internshipsData) => {
                const list = Array.isArray(internshipsData) ? internshipsData : [];
                const matchedInternship = list.find((item) => item.id === Nid);
                if (matchedInternship?.status === "APPROVED") {
                    setInternshipTitle(matchedInternship.title ?? "");
                    setAllowed(true);
                } else {
                    setAllowed(false);
                }
            })
            .catch(() => setError({key: "postInternship.loadError"}));
    }, [isLoggedIn, Nid]);

    const loadApplications = useCallback(async () => {
        try {
            const list = sortApplication(await getApplications(), Nid);
            register(list);
            setApplications(list);
            setError("");
        } catch {
            setError({key: "viewApplication.loadError"});
        } finally {
            setLoading(false);
        }
    }, [Nid, register]);

    useEffect(() => {
        if (isLoggedIn && allowed) void loadApplications();
    }, [isLoggedIn, allowed, loadApplications]);

    usePolling(loadApplications, isLoggedIn && allowed === true);

    const togglePreview = (appId) => {
        setOpenPreviewIds((prev) =>
            prev.includes(appId)
                ? prev.filter((item) => item !== appId)
                : [...prev, appId]
        );
    };

    // Opening the CV marks the application as read on the server (and closes its notification),
    // but the "New" badge stays until the invitation is sent or the page is left.
    const getUrl = useCallback(async (appId) => {
        const cv = await getApplicationCv(appId);
        if (!cv?.content) throw new Error("missing content");

        void refresh();

        return base64ToBlobUrl(cv.content);
    }, [refresh]);

    // Interview invitation sent: the badge goes away right now
    const handleInterviewSent = useCallback((appId) => {
        clearNew(appId);
        void refresh();
    }, [clearNew, refresh]);

    if (allowed === false) return <Navigate to="/internships" replace/>;

    if (error) {
        return (
            <div className="p-6 text-center text-red-500" role="alert">
                {translateWarning(t, error)}
            </div>
        );
    }

    if (loading || allowed === null) {
        return <div className="p-6 text-center" aria-busy="true">{t("viewApplication.loading")}</div>;
    }

    const hasItems = applications.length > 0;

    return (
        <div className="p-6 flex flex-col gap-6">
            {/* Header Section */}
            <div className="flex flex-col gap-2 pb-4 border-b border-gray-200 dark:border-slate-700">
                <Button as={NavLink} to="/internships" tone="primary" dark={dark} icon="arrow_back" className="w-fit">
                    {t("viewApplication.backBtn")}
                </Button>
                <h1 className={`text-4xl font-bold tracking-tight ${dark ? "text-white" : "text-gray-900"}`}>
                    {internshipTitle}
                </h1>
            </div>
            {/*This is the page for each individual thing*/}
            {/* Applications List */}
            <div className="flex flex-col w-full mx-auto max-w-5xl gap-3">
                {hasItems && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className={dark ? "text-slate-300" : "text-gray-700"}>
                        {t("viewApplication.selectedCount", {count: selectedIds.length})}
                    </span>

                        <Button
                            tone="primary"
                            dark={dark}
                            disabled={selectedIds.length === 0 || hiring}
                            onClick={handleHire}
                            className="w-full sm:w-auto"
                        >
                            {t("viewApplication.hire")}
                        </Button>
                    </div>
                )}

                {hireSuccess && (
                    <p role="status" className="text-green-600 dark:text-green-400">
                        {t("viewApplication.hireSuccess")}
                    </p>
                )}

                {hireError && (
                    <p role="alert" className="text-red-500">
                        {translateWarning(t, hireError)}
                    </p>
                )}
                {hasItems ? (
                    applications.map((application) => {
                        const isPreviewOpen = openPreviewIds.includes(application.id);

                        return (
                            <ApplicationCard
                                key={application.id}
                                application={application}
                                isNew={isNew(application)}
                                dark={dark}
                                isPreviewOpen={isPreviewOpen}
                                onTogglePreview={() => togglePreview(application.id)}
                                getUrl={getUrl}
                                onInterviewSent={handleInterviewSent}
                                selected={selectedIds.includes(application.id)}
                                onSelect={toggleSelection}
                                hiring={hiring}
                            />
                        );
                    })
                ) : (
                    <p className={`text-sm py-8 text-center ${dark ? "text-slate-400" : "text-gray-500"}`}>
                        {t("viewApplication.empty")}
                    </p>
                )}
            </div>
        </div>
    );
}

export default ViewApplications;