import { useEffect, useState } from "react";
import { getApplications } from "../api/Api.jsx";
import { NavLink } from "react-router-dom";

function Applications({ user }) {
    const [applications, setApplications] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.isLoggedIn) return;

        getApplications()
            .then((data) => setApplications(data))
            .catch(() => setError("Failed to load applications"))
            .finally(() => setLoading(false));
    }, [user?.isLoggedIn]);

    console.log("Applications count: " + applications.length);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div>
            <NavLink to="/" >
                Back
            </NavLink>
        </div>
    );
}

export default Applications;