


import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import Icon from "../../../styles/ui/Icon.jsx";
import Button from "../../../styles/ui/Button.jsx";
import {getHomeSectionClasses} from "../../../styles/theme/AppStyles.jsx";
import {ALL, COLOR, statusLabelKey} from "../../../utils/status/StatusColor.js";
import {countColors, countOf, countText, filteredPage, LOAD_FAILED} from "./HomeSections.js";

function HomeSection({section, colors, spotlight = false, dark}) {
    const {t} = useTranslation();
    const s = getHomeSectionClasses(dark);
    const counts = countColors(colors, section.colors);
    const failed = colors === LOAD_FAILED;
    const title = t(section.titleKey);

    const renderStatus = (color) => {
        const empty = countOf(counts, color) === 0;
        const content = (
            <>
                <span className={s.statusLabel}>{t(statusLabelKey(section.page, color) ?? color)}</span>
                <span className={s.statusCount(color, empty)}>{countText(counts, failed, color)}</span>
            </>
        );

        if (empty) {
            return <div key={color} aria-disabled="true" className={s.status(color, empty)}>{content}</div>;
        }

        return (
            <Link key={color} to={filteredPage(section, color)} className={s.status(color, empty)}>
                {content}
            </Link>
        );
    };

    return (
        <section aria-label={title} className={spotlight ? s.spotlightCard : s.card}>
            {spotlight && (
                <span className={s.spotlightTag}>
                    <span className={s.spotlightDot}>
                        <span className={s.spotlightPing}/>
                    </span>
                    {t("home.spotlight")}
                </span>
            )}
            <header className={s.header}>
                <span className={s.icon}>
                    <Icon name={section.icon} size={24}/>
                </span>
                <h2 className={s.title}>{title}</h2>
                <span className={s.total} aria-live="polite">{countText(counts, failed, ALL)}</span>
            </header>

            <div className={s.statuses}>
                {section.colors.filter((color) => color !== COLOR.GREEN).map(renderStatus)}
            </div>

            <div className={s.footer}>
                <Button
                    as={Link}
                    to={section.to}
                    tone="accent"
                    lockTone
                    dark={dark}
                    className={s.seeAll}
                >
                    {t("home.seeAll")}
                    <Icon name="arrow_forward" size={18}
                          className="shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"/>
                </Button>
            </div>
        </section>
    );
}

export default HomeSection;
