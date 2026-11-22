import {Navigate, useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getHomeClasses} from '../styles/AppStyles.jsx';
import HomeSection from './home/HomeSection.jsx';
import {SECTIONS_BY_ROLE} from './home/HomeSections.js';
import {ACCOUNT_STATUS} from "../utils/AccountStatus.js";
import Landing from "./home/Landing.jsx";

const Home = () => {
    const {dark, user, accountStatus} = useOutletContext();
    const {t} = useTranslation();
    const classes = getHomeClasses(dark);

    // Token present but user still loading: avoid flashing the landing page
    if (user?.isLoggedIn === undefined && localStorage.getItem("token")) {
        return <div aria-busy="true"/>;
    }

    // region Not logged in: landing page
    if (!user?.isLoggedIn) return <Landing dark={dark}/>;

    // endregion

    // region Logged in: wait for the account status, then send an inactive account to /expired
    if (accountStatus === null) return <div aria-busy="true"/>;
    if (accountStatus !== ACCOUNT_STATUS.APPROVED) return <Navigate to="/expired" replace/>;
    // endregion

    // region Logged in: one section per page, color buttons with live counts
    const role = (user?.role ?? "").toString().replace("ROLE_", "");
    const sections = SECTIONS_BY_ROLE[role] ?? [];

    return (
        <div className={`${classes.page} flex flex-col gap-10`}>
            {/* Welcome sits outside the centered column, so it hugs the left side of the page */}
            <h1 className={`${classes.heading} mb-0! text-left`}>
                {t("home.welcome")} {user?.firstName || ""}
            </h1>

            {sections.length === 0 ? (
                <p className={`w-full text-center py-8 ${dark ? "text-slate-400" : "text-gray-500"}`}>
                    {t("home.noPreviews")}
                </p>
            ) : (
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
                    {sections.map((section) => (
                        <HomeSection key={section.to} section={section} user={user}/>
                    ))}
                </div>
            )}
        </div>
    );
    // endregion
};

export default Home;