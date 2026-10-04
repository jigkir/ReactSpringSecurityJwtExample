import {Link, useOutletContext} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getAboutClasses} from '../styles/AppStyles.jsx';
import Icon from '../styles/Icon.jsx';

const ROLES = [
    {icon: "admin_panel_settings", titleKey: "about.managerTitle", summaryKey: "about.managerSummary"},
    {icon: "business_center", titleKey: "about.employerTitle", summaryKey: "about.employerSummary"},
    {icon: "school", titleKey: "about.studentTitle", summaryKey: "about.studentSummary"},
    {icon: "co_present", titleKey: "about.teacherTitle", summaryKey: "about.teacherSummary"},
];

function About() {
    const {t} = useTranslation();
    const {dark, user} = useOutletContext();
    const homePath = user?.isLoggedIn ? "/home" : "/";
    const classes = getAboutClasses(dark);

    return (
        <main className={classes.page}>
            <section className={classes.card}>
                <h1 className={classes.title}>{t("about.title")}</h1>
                <p className={classes.description}>{t("about.description")}</p>

                <h2 className={classes.rolesTitle}>{t("about.rolesTitle")}</h2>
                <ul className={classes.rolesGrid}>
                    {ROLES.map(({icon, titleKey, summaryKey}) => (
                        <li key={titleKey} className={classes.roleCell}>
                            <span className={classes.roleIcon}>
                                <Icon name={icon} size={32} filled/>
                            </span>
                            <h3 className={classes.roleTitle}>{t(titleKey)}</h3>
                            <p className={classes.roleSummary}>{t(summaryKey)}</p>
                        </li>
                    ))}
                </ul>

                <div className={classes.footer}>
                    <span className={classes.version}>{t("about.version")}</span>
                    <Link to={homePath} className={classes.backBtn}>
                        <Icon name="arrow_back" size={18}/>
                        {t("about.backLabel")}
                    </Link>
                </div>
            </section>
        </main>
    );
}

export default About;