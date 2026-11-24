import {Navigate, useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getHomeClasses} from '../styles/AppStyles.jsx';
import HomeSection from './home/HomeSection.jsx';
import {SECTIONS_BY_ROLE} from './home/HomeSections.js';
import {ACCOUNT_STATUS} from "../utils/AccountStatus.js";
import Landing from "./home/Landing.jsx";

const GRID_COLUMNS = 6; // a card is 2 columns wide (3 per row); wider cards fill the last row
const CARDS_PER_ROW = 3;
const CARD_SPAN = GRID_COLUMNS / CARDS_PER_ROW;

/**
 * Width (in columns of the 6-column grid) of the card at `index`, so the last row is always full:
 *   5 cards → 2 2 2 / 4 2   (the layout of the mockup)
 *   4 cards → 2 2 2 / 6
 *   1 card  → 6
 */
export const spanOf = (index, total) => {
    const lastRowCount = total % CARDS_PER_ROW;
    const lastRowStart = total - lastRowCount;
    if (lastRowCount === 0 || index < lastRowStart) return CARD_SPAN;
    if (lastRowCount === 1) return GRID_COLUMNS;
    return index === lastRowStart ? GRID_COLUMNS - CARD_SPAN : CARD_SPAN;
};

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

    // region Logged in: one card per page, with color tiles and live counts
    const role = (user?.role ?? "").toString().replace("ROLE_", "");
    const sections = SECTIONS_BY_ROLE[role] ?? [];

    return (
        <div className={classes.page}>
            <div className={classes.container}>
                <header className={classes.header}>
                    <h1 className={classes.heading}>
                        {t("home.welcome")} {user?.firstName || ""}
                    </h1>
                    <p className={classes.subtitle}>{t("home.subtitle")}</p>
                </header>

                {sections.length === 0 ? (
                    <p className={`w-full text-center py-8 ${dark ? "text-slate-400" : "text-gray-500"}`}>
                        {t("home.noPreviews")}
                    </p>
                ) : (
                    <div className={classes.grid}>
                        {sections.map((section, index) => (
                            <HomeSection
                                key={section.to}
                                section={section}
                                user={user}
                                dark={dark}
                                span={spanOf(index, sections.length)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
    // endregion
};

export default Home;