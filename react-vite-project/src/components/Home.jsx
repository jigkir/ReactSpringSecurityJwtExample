import {useCallback, useEffect, useRef, useState} from "react";
import {Navigate, useOutletContext} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {getHomeClasses} from "../styles/AppStyles.jsx";
import Icon from "../styles/Icon.jsx";
import HomeSection from "./home/HomeSection.jsx";
import {getHomeSections, getSpotlightPages, LOAD_FAILED} from "./home/HomeSections.js";
import {ACCOUNT_STATUS} from "../utils/AccountStatus.js";
import {usePolling} from "../utils/usePolling.js";
import {useSession} from "../utils/useSession.js";
import Landing from "./home/Landing.jsx";
import {PATHS} from "../routes/AppRoutes.jsx";

// region Colors of every page of the role, refreshed by the polling
const loadColors = async (section, sessionId, user) => {
    try {
        const colors = await section.load({sessionId, user});
        return Array.isArray(colors) ? colors : [];
    } catch {
        return LOAD_FAILED;
    }
};

// Last colors loaded for each user and session, kept in the tab's sessionStorage: a reload, a page
// change or a new login in the same tab shows the last counts right away instead of "…"
const LAST_COLORS_PREFIX = "homeColors:";

const lastColorsKey = (user, sessionId) => `${LAST_COLORS_PREFIX}${user?.id}:${sessionId}`;

const readLastColors = (key) => {
    try {
        return JSON.parse(sessionStorage.getItem(key)) ?? {};
    } catch {
        return {};
    }
};

const saveLastColors = (key, colors) => {
    try {
        sessionStorage.setItem(key, JSON.stringify(colors));
    } catch {
        // Storage blocked or full: the counts simply load again next time
    }
};

// {[section.to]: colors[] | LOAD_FAILED}; a page is missing while it loads for the first time
function useSectionColors(sections, user) {
    const {selectedSession} = useSession();
    const sessionId = selectedSession?.id;
    const key = lastColorsKey(user, sessionId);
    const [colorsByPage, setColorsByPage] = useState(() => readLastColors(key));
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

        saveLastColors(lastColorsKey(user, sessionId), loaded);
        if (mounted.current) setColorsByPage(loaded);
    }, [sections, sessionId, user]);

    useEffect(() => {
        setColorsByPage(readLastColors(key));
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
    const loaded = sections.every((section) => section.to in colorsByPage);
    const spotlightPages = getSpotlightPages(role, colorsByPage);

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
                    <div className={loaded ? classes.cards : `${classes.cards} ${classes.cardsLoading}`}
                         aria-busy={!loaded}>
                        {sections.map((section) => (
                            <HomeSection key={section.to} section={section}
                                         colors={colorsByPage[section.to]}
                                         spotlight={spotlightPages.includes(section.to)} dark={dark}/>
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
    if (accountStatus !== ACCOUNT_STATUS.APPROVED) return <Navigate to={PATHS.EXPIRED} replace/>;
    // endregion

    return <Dashboard dark={dark} user={user}/>;
};

export default Home;