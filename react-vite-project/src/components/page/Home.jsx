import {useCallback, useEffect, useRef, useState} from "react";
import {Navigate, useOutletContext} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {getHomeClasses} from "../../styles/theme/AppStyles.jsx";
import Icon from "../../styles/ui/Icon.jsx";
import HomeSection from "../features/home/HomeSection.jsx";
import {getHomeSections, getSpotlightPages, LOAD_FAILED} from "../features/home/HomeSections.js";
import {ACCOUNT_STATUS} from "../../utils/status/AccountStatus.js";
import {usePolling} from "../../utils/hooks/usePolling.js";
import {useSession} from "../../utils/session/useSession.js";
import Landing from "../features/home/Landing.jsx";
import {PATHS} from "../../routes/AppRoutes.jsx";


const loadColors = async (section, sessionId, user) => {
    try {
        const colors = await section.load({sessionId, user});
        return Array.isArray(colors) ? colors : [];
    } catch {
        return LOAD_FAILED;
    }
};



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

    }
};


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



const Home = () => {
    const {dark, user, accountStatus} = useOutletContext();


    if (user?.isLoggedIn === undefined && localStorage.getItem("token")) {
        return <div aria-busy="true"/>;
    }


    if (!user?.isLoggedIn) return <Landing dark={dark}/>;




    if (accountStatus === null) return <div aria-busy="true"/>;
    if (accountStatus !== ACCOUNT_STATUS.APPROVED) return <Navigate to={PATHS.EXPIRED} replace/>;


    return <Dashboard dark={dark} user={user}/>;
};

export default Home;
