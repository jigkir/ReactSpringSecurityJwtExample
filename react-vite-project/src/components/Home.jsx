import {useCallback, useEffect, useRef, useState} from 'react';
import {Link, Navigate, useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getHomeClasses} from '../styles/AppStyles.jsx';
import Icon from '../styles/Icon.jsx';
import HomeSection from './home/HomeSection.jsx';
import {ACTION_COLOR, countColors, countOf, filteredPage, LOAD_FAILED, SECTIONS_BY_ROLE} from './home/HomeSections.js';
import {ACCOUNT_STATUS} from "../utils/AccountStatus.js";
import {statusLabelKey} from "../utils/StatusColor.js";
import {usePolling} from "../utils/usePolling.js";
import {useSession} from "../utils/useSession.js";
import Landing from "./home/Landing.jsx";

const NO_SECTIONS = [];

// region Colors of every page of the role, refreshed by the polling
const loadColors = async (section, sessionId, user) => {
    try {
        const colors = await section.load({sessionId, user});
        return Array.isArray(colors) ? colors : [];
    } catch {
        return LOAD_FAILED;
    }
};

// {[section.to]: colors[] | LOAD_FAILED}; a page is missing while it loads
function useSectionColors(sections, user) {
    const {selectedSession} = useSession();
    const sessionId = selectedSession?.id;
    const [colorsByPage, setColorsByPage] = useState({});
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

        if (mounted.current) setColorsByPage(Object.fromEntries(entries));
    }, [sections, sessionId, user]);

    useEffect(() => {
        setColorsByPage({});
        void refresh();
    }, [refresh]);

    usePolling(refresh);

    return colorsByPage;
}

// endregion

// region "To do" panel: every page that has items waiting for an action
function ToDoPanel({sections, colorsByPage, classes}) {
    const {t} = useTranslation();

    const todos = sections
        .filter((section) => section.colors.includes(ACTION_COLOR))
        .map((section) => ({section, count: countOf(countColors(colorsByPage[section.to]), ACTION_COLOR) ?? 0}))
        .filter(({count}) => count > 0);
    const loading = sections.some((section) => !(section.to in colorsByPage));
    const total = todos.reduce((sum, {count}) => sum + count, 0);

    const renderBody = () => {
        if (todos.length > 0) {
            return (
                <div className={classes.todoList}>
                    {todos.map(({section, count}) => (
                        <Link key={section.to} to={filteredPage(section, ACTION_COLOR)} className={classes.todoLink}>
                            <span className={classes.todoIcon}>
                                <Icon name={section.icon} size={20}/>
                            </span>
                            <span className={classes.todoText}>
                                <span className={classes.todoTitle}>{t(section.titleKey)}</span>
                                <span className={classes.todoStatus}>
                                    {t(statusLabelKey(section.page, ACTION_COLOR) ?? ACTION_COLOR)}
                                </span>
                            </span>
                            <span className={classes.todoCount}>{count}</span>
                            <Icon name="arrow_forward" size={20} className={classes.arrow}/>
                        </Link>
                    ))}
                </div>
            );
        }

        if (loading) return <div className={classes.skeleton} aria-busy="true"/>;

        return (
            <p className={classes.caughtUp}>
                <Icon name="check_circle" size={20}/>
                {t("home.allCaughtUp")}
            </p>
        );
    };

    return (
        <aside aria-label={t("home.toDo")} className={classes.panel}>
            <header className={classes.panelHeader}>
                <Icon name="hourglass_bottom" size={24} className={classes.panelIcon}/>
                <h2 className={classes.panelTitle}>{t("home.toDo")}</h2>
                {total > 0 && <span className={classes.panelTotal}>{total}</span>}
            </header>
            {renderBody()}
        </aside>
    );
}

// endregion

// region Logged in: welcome banner, "To do" panel and one card per page
function Dashboard({dark, user}) {
    const {t} = useTranslation();
    const classes = getHomeClasses(dark);
    const role = (user?.role ?? "").toString().replace("ROLE_", "");
    const sections = SECTIONS_BY_ROLE[role] ?? NO_SECTIONS;
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
                    <div className={classes.layout}>
                        <ToDoPanel sections={sections} colorsByPage={colorsByPage} classes={classes}/>
                        <div className={classes.cards}>
                            {sections.map((section) => (
                                <HomeSection key={section.to} section={section}
                                             colors={colorsByPage[section.to]} dark={dark}/>
                            ))}
                        </div>
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