import {useTranslation} from 'react-i18next';
import {getInternshipCardClasses} from '../../../styles/appStyles.jsx';
import Icon from '../../../styles/Icon.jsx';

const STATUS_KEY_MAP = {
    PENDING: "internshipCard.status.pendingValidation",
    APPROVED: "internshipCard.status.approved",
    REJECTED: "internshipCard.status.rejected",
};

export default function InternshipCard({internship, OnDelete, dark}) {
    const {t} = useTranslation();
    const s = getInternshipCardClasses(dark);

    const statusLabel = STATUS_KEY_MAP[internship.status]
        ? t(STATUS_KEY_MAP[internship.status])
        : internship.status;

    return (
        <div className={s.card}>
            {/* Top row */}
            <div className={s.topRow}>
                <div className="min-w-0 flex-1">
                    <h3 className={s.title}>{internship.title}</h3>
                    <p className={s.description}>{internship.description}</p>
                </div>
                <span className={s.statusBadge(internship.status)}>
                    <Icon
                        name={internship.status === "PENDING" ? "schedule" : internship.status === "APPROVED" ? "check" : "close"}
                        size={16}
                    />
                    {statusLabel}
                </span>
            </div>

            {/* Required Skills */}
            <div className={s.skillsRow}>
                <span className="font-semibold">{t("internshipCard.requiredSkills")} </span>
                <span className={s.skillBadge}>{internship.requiredSkills}</span>
            </div>

            {/* Detail badges */}
            <div className={s.detailsRow}>
                {/* Location */}
                <span className={s.detailBadge}>
                    <Icon name="location_on" size={20}/>
                    {internship.location}
                </span>

                {/* Duration */}
                <span className={s.detailBadge}>
                    <Icon name="timer" size={20}/>
                    {t("internshipCard.duration", {count: internship.durationInWeeks})}
                </span>

                {/* Compensation */}
                <span className={s.detailBadge}>
                    <Icon name="payments" size={20}/>
                    {internship.compensationNegotiable ? t("internshipCard.negotiable") : t("internshipCard.compensation", {amount: internship.compensationAmount})}
                </span>

                {/* Start date */}
                <span className={s.detailBadge}>
                    <Icon name="calendar_month" size={20}/>
                    {internship.startDate}
                </span>

                {/* Deadline */}
                <span className={s.detailBadge}>
                    <Icon name="event" size={20}/>
                    {internship.applicationDeadline}
                </span>

                {/* Delete */}
                <button
                    className={s.deleteBtn}
                    aria-label={t("internshipCard.deleteAria")}
                    onClick={() => OnDelete(internship.id)}
                >
                    <Icon name="delete" size={24}/>
                </button>
            </div>
        </div>
    );
}