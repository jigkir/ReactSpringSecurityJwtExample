import Icon from "../../../styles/ui/Icon.jsx";
import {getCvDocumentsClasses} from "../../../styles/theme/AppStyles.jsx";
import {INTERVIEW_STATUS} from "../../../utils/status/interviewStatus.js";

const PILL = {
    [INTERVIEW_STATUS.AWAITING_RESPONSE]: {icon: "schedule", reviewStatus: "PENDING"},
    [INTERVIEW_STATUS.UPCOMING]: {icon: "event_available", reviewStatus: "APPROVED"},
    [INTERVIEW_STATUS.REJECTED]: {icon: "close", reviewStatus: "REJECTED"},
    [INTERVIEW_STATUS.PAST]: {icon: "check_circle", reviewStatus: null},
    [INTERVIEW_STATUS.CANCELLED]: {icon: "block", reviewStatus: "REJECTED"},
};

function InterviewStatusPill({dark, status, label}) {
    const th = getCvDocumentsClasses(dark);
    const {icon, reviewStatus} = PILL[status];
    const colour = reviewStatus ? th.statusPill(reviewStatus) : th.pillPrivate;

    return (
        <span className={`${th.pillBase} ${colour} shrink-0 gap-1`}>
            <Icon name={icon} size={14}/>
            {label}
        </span>
    );
}

export default InterviewStatusPill;
