import {useTranslation} from 'react-i18next';
import {getInternshipCardClasses} from '../../../styles/AppStyles.jsx';
import Icon from '../../../styles/Icon.jsx';
import {formatDate} from '../cv/cvUtils.js';

const STATUS_KEY_MAP = {
    PENDING: "internshipCard.status.pendingValidation",
    APPROVED: "internshipCard.status.approved",
    REJECTED: "internshipCard.status.rejected",
};

// Material Symbols name shown inside each status badge
const STATUS_ICON = {
    PENDING: "schedule",
    APPROVED: "check_circle",
    REJECTED: "close",
};

// Split "React, Node.js , Python" into ["React", "Node.js", "Python"]
const parseSkills = (raw) =>
    (raw ?? "")
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

export default function InternshipCard({
                                           internship,
                                           OnDelete,
                                           OnEdit,
                                           footer,
                                           dark,
                                           hideStatus = false,
                                           showEmployer = false
                                       }) {
    const {t} = useTranslation();
    const s = getInternshipCardClasses(dark);

    const statusLabel = STATUS_KEY_MAP[internship.status]
        ? t(STATUS_KEY_MAP[internship.status])
        : internship.status;

    const skills = parseSkills(internship.requiredSkills);
    const isRejected = internship.status === "REJECTED";

    // Unpaid = not negotiable and amount is exactly 0
    const isUnpaid = !internship.compensationNegotiable
        && internship.compensationAmount != null
        && Number(internship.compensationAmount) === 0;

    const compensationText = internship.compensationNegotiable
        ? t("internshipCard.compensationTbd")
        : isUnpaid
            ? t("internshipCard.compensationUnpaid")
            : t("internshipCard.compensationAmount", {amount: internship.compensationAmount});

    const editBtn = `p-1.5 rounded transition-colors ${dark
        ? "text-slate-400 hover:bg-slate-700 hover:text-indigo-300"
        : "text-gray-600 hover:bg-gray-200 hover:text-indigo-600"}`;

    return (
        <div className={s.card}>
            {/* Top row */}
            <div className={s.topRow}>
                <div className="min-w-0 flex-1">
                    <h3 className={s.title}>{internship.title}</h3>
                    {/* pre-wrap keeps the line breaks typed in the description */}
                    <p className={s.description} style={{whiteSpace: "pre-wrap"}}>{internship.description}</p>
                </div>
                {!hideStatus && (
                    <span className={s.statusBadge(internship.status)}>
                        <Icon name={STATUS_ICON[internship.status] ?? "close"} size={16}/>
                        {statusLabel}
                    </span>
                )}
            </div>

            {/* Rejection reason (visible to employer and manager) */}
            {isRejected && internship.rejectionComment && (
                <div
                    className={`rounded-lg border-l-4 px-3 py-2 ${dark ? "border-red-500 bg-red-900/30" : "border-red-500 bg-red-50"}`}
                    role="note">
                    <p className={`text-xs font-bold uppercase tracking-wide ${dark ? "text-red-300" : "text-red-700"}`}>
                        {t("internshipCard.rejectionReason")}
                    </p>
                    <p className={`mt-0.5 text-sm font-semibold break-words ${dark ? "text-red-100" : "text-red-900"}`}
                       style={{whiteSpace: "pre-wrap"}}>
                        {internship.rejectionComment}
                    </p>
                </div>
            )}

            {/* Required skills: one chip per skill */}
            {skills.length > 0 && (
                <div className={`${s.skillsRow} flex flex-wrap items-center gap-1.5`}>
                    <span className="font-semibold mr-1">{t("internshipCard.requiredSkills")}</span>
                    {skills.map((skill) => (
                        <span key={skill} className={s.skillBadge}>{skill}</span>
                    ))}
                </div>
            )}

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
                    {t("internshipCard.durationWeeks", {count: internship.durationInWeeks})}
                </span>

                {/* Compensation: amount / unpaid / to be discussed */}
                <span className={s.detailBadge}>
                    <Icon name="payments" size={20}/>
                    {compensationText}
                </span>

                {/* Start date: "play" icon = the internship begins */}
                <span className={s.detailBadge} title={t("internshipCard.startsTitle")}>
                    <Icon name="play_circle" size={20}/>
                    <span className="font-medium">{t("internshipCard.starts")}</span> {internship.startDate}
                </span>

                {/* Deadline: "hourglass" icon = time left to apply */}
                <span className={s.detailBadge} title={t("internshipCard.applyByTitle")}>
                    <Icon name="hourglass_bottom" size={20}/>
                    <span className="font-medium">{t("internshipCard.applyBy")}</span> {internship.applicationDeadline}
                </span>

                {/* Edit / Delete (employer only) */}
                {(OnEdit || OnDelete) && (
                    <div className="ml-auto flex items-center gap-1">
                        {OnEdit && (
                            <button
                                className={editBtn}
                                aria-label={t("internshipCard.editAria")}
                                onClick={() => OnEdit(internship)}
                            >
                                <Icon name="edit" size={24}/>
                            </button>
                        )}
                        {OnDelete && (
                            <button
                                className={s.deleteBtn}
                                aria-label={t("internshipCard.deleteAria")}
                                onClick={() => OnDelete(internship.id)}
                            >
                                <Icon name="delete" size={24}/>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Footer: manager info on the left, actions on the right */}
            {(footer || showEmployer) && (
                <div
                    className={`flex flex-wrap items-center gap-2 pt-3 border-t ${dark ? "border-slate-700" : "border-gray-100"}`}>
                    {showEmployer && (
                        <div className="mr-auto flex flex-wrap items-center gap-2">
                            <span className={`${s.detailBadge} break-all`}>{internship.employerEmail}</span>
                            <span className={s.detailBadge}>
                                <Icon name="home_work" size={20}/>
                                {t(`disciplines.${(internship.discipline ?? "").toLowerCase()}`, {defaultValue: internship.discipline})}
                            </span>
                            <span className={s.detailBadge}>
                                <Icon name="event" size={20}/>
                                {t("cvDocuments.uploadedOn")} {internship.uploadedAt ? formatDate(internship.uploadedAt) : "—"}
                            </span>
                        </div>
                    )}
                    {footer && <div className="ml-auto flex flex-wrap items-center justify-end gap-2">{footer}</div>}
                </div>
            )}
        </div>
    );
}