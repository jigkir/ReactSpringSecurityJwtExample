import {Link, useOutletContext} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {getAboutClasses, REVEAL_FROM} from "../styles/AppStyles.jsx";
import Icon from "../styles/Icon.jsx";
import Reveal from "../styles/Reveal.jsx";
import {PATHS} from "../routes/AppRoutes.jsx";

const ROLES = [
    {icon: "admin_panel_settings", titleKey: "about.managerTitle", summaryKey: "about.managerSummary"},
    {icon: "business_center", titleKey: "about.employerTitle", summaryKey: "about.employerSummary"},
    {icon: "school", titleKey: "about.studentTitle", summaryKey: "about.studentSummary"},
    {icon: "co_present", titleKey: "about.teacherTitle", summaryKey: "about.teacherSummary"},
];

const STEP_DIGITS = 2;

function TimelineItem({role: {icon, titleKey, summaryKey}, index, classes}) {
    const {t} = useTranslation();
    const onLeft = index % 2 === 0;

    return (
        <li className={classes.item}>
            <Reveal from={REVEAL_FROM.POP} className={classes.node}>
                <Icon name={icon} size={24} filled/>
            </Reveal>
            <Reveal from={onLeft ? REVEAL_FROM.LEFT : REVEAL_FROM.RIGHT}
                    className={onLeft ? classes.left : classes.right}>
                <article className={classes.card}>
                    <span className={classes.number}>{String(index + 1).padStart(STEP_DIGITS, "0")}</span>
                    <h3 className={classes.roleTitle}>{t(titleKey)}</h3>
                    <p className={classes.roleSummary}>{t(summaryKey)}</p>
                </article>
            </Reveal>
        </li>
    );
}

function About() {
    const {t} = useTranslation();
    const {dark, user} = useOutletContext();
    const homePath = user?.isLoggedIn ? PATHS.HOME : PATHS.ROOT;
    const classes = getAboutClasses(dark);

    return (
        <main className={classes.page}>
            <section className={classes.container}>
                <div className={classes.hero}>
                    <Reveal from={REVEAL_FROM.UP}>
                        <h1 className={classes.title}>{t("about.title")}</h1>
                    </Reveal>
                    <Reveal from={REVEAL_FROM.UP} className={classes.descriptionReveal}>
                        <p className={classes.description}>{t("about.description")}</p>
                    </Reveal>
                </div>

                <Reveal from={REVEAL_FROM.UP} className={classes.questionReveal}>
                    <h2 className={classes.question}>{t("about.rolesTitle")}</h2>
                </Reveal>

                <div className={classes.timeline}>
                    <span aria-hidden="true" className={classes.line}/>
                    <ol className={classes.list}>
                        {ROLES.map((role, index) => (
                            <TimelineItem key={role.titleKey} role={role} index={index} classes={classes}/>
                        ))}
                    </ol>
                </div>

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