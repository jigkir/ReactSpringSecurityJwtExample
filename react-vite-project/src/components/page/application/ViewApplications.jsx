import {useCallback, useEffect, useState} from "react";
import {getApplicationCv, getApplications, getEmployerInternships} from "../../api/Api.jsx";
import {NavLink, useLocation, useOutletContext, useParams} from "react-router-dom";
import ApplicationCard from "./ApplicationCard.jsx";
import {base64ToBlobUrl} from "../cv/cvUtils.js";
import Icon from "../../../styles/Icon.jsx";
import {sortApplication} from "../../../utils/Sort.jsx";
import {useNotifications} from "../../notification/NotificationsProvider.jsx";
import {usePolling} from "../../../utils/usePolling.js";

function ViewApplications({user}) {
    const location = useLocation();
    const [applications, setApplications] = useState([]);
    const [internshipTitle, setInternshipTitle] = useState("");
    const {id} = useParams();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const {dark} = useOutletContext();
    const passedInternship = location.state?.internshipData;
    const Nid = parseInt(id, 10);

    const [openPreviewIds, setOpenPreviewIds] = useState([]);

    const {refresh} = useNotifications();
    const isLoggedIn = Boolean(user?.isLoggedIn);

    useEffect(() => {
        if (!user?.isLoggedIn || !Nid) return;

        getEmployerInternships()
            .then((internshipsData) => {
                const list = Array.isArray(internshipsData) ? internshipsData : [];
                const matchedInternship = list.find((item) => item.id === Nid);
                if (matchedInternship?.title) {
                    setInternshipTitle(matchedInternship.title);
                }
            })
            .catch(() => setError({key: "postInternship.loadError"}));
    }, [user?.isLoggedIn, Nid]);

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
        if (isLoggedIn) void loadApplications();
    }, [isLoggedIn, loadApplications]);

    usePolling(loadApplications, isLoggedIn);

    // const title = applications.length > 0 ? applications[0].internshipTitle : "No Applications Found";

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

    if (loading) return <div className="p-6 text-center">Loading...</div>;
    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

    const hasItems = applications.length > 0;

    return (
        <div className="p-6 flex flex-col gap-6">
            {/* Header Section */}
            <div className="flex flex-col gap-2 pb-4 border-b border-gray-200 dark:border-slate-700">
                <NavLink
                    to="/internships"
                    className="px-3 py-1.5 text-sm rounded-lg font-medium flex items-center gap-1 w-fit transition-colors bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                    <Icon name="arrow_back" size={16}/>
                    Back to Internships
                </NavLink>
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