import {useCallback, useEffect, useRef, useState} from 'react';
import {Navigate, useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getHomeClasses} from '../styles/AppStyles.jsx';
import Icon from '../styles/Icon.jsx';
import HomeSection from './home/HomeSection.jsx';
import {getHomeSections, LOAD_FAILED} from './home/HomeSections.js';
import {ACCOUNT_STATUS} from "../utils/AccountStatus.js";
import {usePolling} from "../utils/usePolling.js";
import {useSession} from "../utils/useSession.js";
import Landing from "./home/Landing.jsx";

// region Colors of every page of the role, refreshed by the polling
const loadColors = async (section, sessionId, user) => {
    try {
        const colors = await section.load({sessionId, user});
        return Array.isArray(colors) ? colors : [];
    } catch {
        return LOAD_FAILED;
    }
};

// Last colors loaded for each user and session. App reloads the user (a new object) on every
// page change: without them, coming back to the Home shows "…" for a moment before the counts
const lastColors = new Map();

const lastColorsKey = (user, sessionId) => `${user?.id}:${sessionId}`;

// {[section.to]: colors[] | LOAD_FAILED}; a page is missing while it loads for the first time
function useSectionColors(sections, user) {
    const {selectedSession} = useSession();
    const sessionId = selectedSession?.id;
    const key = lastColorsKey(user, sessionId);
    const [colorsByPage, setColorsByPage] = useState(() => lastColors.get(key) ?? {});
    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const refresh = useCallback(async () => {
        // A page that lists the navbar session waits for that session
        const loadable = sections.filter((section) => !section.scoped || sessionId);
        const entries = await Promise.all(
            loadable.map(async (section) => [section.to, await loadColors(section, sessionId, user)]));

        const loaded = Object.fromEntries(entries);

        lastColors.set(lastColorsKey(user, sessionId), loaded);
        if (mounted.current) setColorsByPage(loaded);
    }, [sections, sessionId, user]);

    useEffect(() => {
        setColorsByPage(lastColors.get(key) ?? {});
        void refresh();
    }, [refresh, key]);

    usePolling(refresh);

    return colorsByPage;
}

// endregion

// region Logged in: welcome banner and one card per page
function Dashboard({dark, user}) {
    const {t} = useTranslation();
    const classes = getHomeClasses(dark);
    const role = (user?.role ?? "").toString().replace("ROLE_", "");
    const sections = getHomeSections(role);
    const colorsByPage = useSectionColors(sections, user);

    return (
        <div className={classes.page}>
            <div className={classes.container}>
                <header className={classes.banner}>
                    <span className={classes.bannerIcon}>
                        <Icon name="waving_hand" size={30}/>
                    </span>
                    <div>
                        <h1 className={classes.heading}>{t("home.welcome")} {user?.firstName || ""}</h1>
                        <p className={classes.subtitle}>{t("home.subtitle")}</p>
                    </div>
                </header>

                {sections.length === 0 ? (
                    <p className={classes.empty}>{t("home.noPreviews")}</p>
                ) : (
                    <div className={classes.cards}>
                        {sections.map((section) => (
                            <HomeSection key={section.to} section={section}
                                         colors={colorsByPage[section.to]} dark={dark}/>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// endregion

const Home = () => {
    const {dark, user, accountStatus} = useOutletContext();

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

    return <Dashboard dark={dark} user={user}/>;
};

export default Home;