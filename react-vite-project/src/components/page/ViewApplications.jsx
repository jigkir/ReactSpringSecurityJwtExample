import { useEffect, useState } from "react";
import {getApplicationCv, getApplications} from "../api/Api.jsx";
import {NavLink, useOutletContext, useParams} from "react-router-dom";
import {sortApplication} from "../../utils/Sort.jsx";
import InternshipCard from "./internship/InternshipCard.jsx";
import ApplicationCard from "./ApplicationCard.jsx";

const mockApplications = [
    {
        id: 101,
        internshipId: 2,
        internshipTitle: "Backend Java Developer Intern",
        student: {
            id: 501,
            firstName: "Alex",
            lastName: "Tremblay",
            email: "alex.tremblay@example.com"
        },
        cvId: 201,
        cvFileName: "Alex_Tremblay_CV_2026.pdf",
        applicationDate: "2026-09-15",
        internshipApplicationStatus: "UNREAD"
    },
    {
        id: 102,
        internshipId: 2,
        internshipTitle: "Backend Java Developer Intern",
        student: {
            id: 502,
            firstName: "Sarah",
            lastName: "Lin",
            email: "sarah.lin@example.com"
        },
        cvId: 202,
        cvFileName: "Sarah_Lin_Resume.pdf",
        applicationDate: "2026-09-18",
        internshipApplicationStatus: "UNREAD"
    },
    {
        id: 103,
        internshipId: 1,
        internshipTitle: "Full-Stack Software Developer Intern",
        student: {
            id: 503,
            firstName: "David",
            lastName: "Rousseau",
            email: "david.rousseau@example.com"
        },
        cvId: 203,
        cvFileName: "David_Rousseau_CV.pdf",
        applicationDate: "2026-09-20",
        internshipApplicationStatus: "UNREAD"
    }
];

function ViewApplications({ user }) {
    const [applications, setApplications] = useState([]);
    const { id } = useParams();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const {dark} = useOutletContext();
    const Nid = parseInt(id, 10);

    useEffect(() => {
        if (!user?.isLoggedIn) return;

        // getApplications()
        //     .then((data) => setApplications(data))
        //     .catch(() => setError("Failed to load applications"))
        //     .finally(() => setLoading(false));
        setApplications(sortApplication(mockApplications,Nid));
        setLoading(false);
    }, [user?.isLoggedIn]);

    const title = applications.length > 0 ? applications[0].internshipTitle : "No Applications Found";

    const handleViewApplication = async (application) => {
        try {
            // 1. Call your API to fetch the CV file (this also marks it as READ on the backend)
            const cvBlob = await getApplicationCv(application.id);

            // 2. Create a temporary object URL and open it in a new tab
            const fileURL = URL.createObjectURL(cvBlob);
            window.open(fileURL, "_blank");

            // 3. Optimistically update local state so the "New" sticker disappears instantly
            setApplications((prevApps) =>
                prevApps.map((app) =>
                    app.id === application.id
                        ? { ...app, internshipApplicationStatus: "READ" }
                        : app
                )
            );
        } catch (err) {
            console.error("Failed to view CV:", err);
            setError("Could not load the CV file.");
        }
    };

    const hasItems = !loading && !error && applications.length > 0;

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div>
            <NavLink to="/internships" >
                Back
            </NavLink>
            <h2>
                {title}
            </h2>
            {hasItems && applications.map((application) => {
                const isNew = application.internshipApplicationStatus === "UNREAD";

                return (
                    <ApplicationCard
                        key={application.id}
                        student={application.student}
                        cvFileName={application.cvFileName}
                        isNew={isNew}
                        dark={dark}
                        onView={() => handleViewApplication(application.id)}
                    />
                );
            })}
        </div>
    );
}

export default ViewApplications;