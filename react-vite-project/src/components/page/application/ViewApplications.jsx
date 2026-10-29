import {useCallback, useEffect, useState} from "react";
import {getApplicationCv, getApplications, getEmployerInternships} from "../../api/Api.jsx";
import {Navigate, NavLink, useOutletContext, useParams} from "react-router-dom";
import ApplicationCard from "./ApplicationCard.jsx";
import Button from "../../../styles/Button.jsx";
import {base64ToBlobUrl} from "../cv/cvUtils.js";
import {sortApplication} from "../../../utils/Sort.jsx";
import {useNotifications} from "../../notification/NotificationsProvider.jsx";
import {usePolling} from "../../../utils/usePolling.js";

function ViewApplications({user}) {
    const [applications, setApplications] = useState([]);
    const [internshipTitle, setInternshipTitle] = useState("");
    const {id} = useParams();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [allowed, setAllowed] = useState(null);
    const {dark} = useOutletContext();
    const Nid = parseInt(id, 10);

    const [openPreviewIds, setOpenPreviewIds] = useState([]);

    const {refresh} = useNotifications();
    const isLoggedIn = Boolean(user?.isLoggedIn);

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
            setApplications(sortApplication(await getApplications(), Nid));
            setError("");
        } catch {
            setError({key: "viewApplication.loadError"});
        } finally {
            setLoading(false);
        }
    }, [Nid]);

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

    const getUrl = useCallback(async (appId) => {
        const cv = await getApplicationCv(appId);
        if (!cv?.content) throw new Error("missing content");

        // Optimistically update local state so the "New" sticker disappears instantly when viewed
        setApplications((prevApps) =>
            prevApps.map((app) =>
                app.id === appId && app.internshipApplicationStatus === "UNREAD"
                    ? {...app, internshipApplicationStatus: "READ"}
                    : app
            )
        );

        void refresh();

        return base64ToBlobUrl(cv.content);
    }, [refresh]);

    if (allowed === false) return <Navigate to="/internships" replace/>;
    if (loading || allowed === null) return <div className="p-6 text-center">Loading...</div>;
    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

    const hasItems = applications.length > 0;

    return (
        <div className="p-6 flex flex-col gap-6">
            {/* Header Section */}
            <div className="flex flex-col gap-2 pb-4 border-b border-gray-200 dark:border-slate-700">
                <Button as={NavLink} to="/internships" tone="primary" dark={dark} icon="arrow_back" className="w-fit">
                    Back to Internships
                </Button>
                <h1 className={`text-4xl font-bold tracking-tight ${dark ? "text-white" : "text-gray-900"}`}>
                    {internshipTitle}
                </h1>
            </div>

            {/* Applications List */}
            <div className="flex flex-col w-full mx-auto max-w-5xl gap-3">
                {hasItems ? (
                    applications.map((application) => {
                        const isNew = application.internshipApplicationStatus === "UNREAD";
                        const isPreviewOpen = openPreviewIds.includes(application.id);

                        return (
                            <ApplicationCard
                                key={application.id}
                                application={application}
                                isNew={isNew}
                                dark={dark}
                                isPreviewOpen={isPreviewOpen}
                                onTogglePreview={() => togglePreview(application.id)}
                                getUrl={getUrl}
                            />
                        );
                    })
                ) : (
                    <p className={`text-sm py-8 text-center ${dark ? "text-slate-400" : "text-gray-500"}`}>
                        No applications found for this internship.
                    </p>
                )}
            </div>
        </div>
    );
}

export default ViewApplications;