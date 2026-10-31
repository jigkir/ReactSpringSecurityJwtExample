import {getInternshipFormClasses} from "../../../../styles/AppStyles.jsx";
import Button from "../../../../styles/Button.jsx";
import {useTranslation} from "react-i18next";
import {Field, translateWarning} from "../../../../utils/CommonFields.jsx";
import {useState} from "react";
import AutoResizeTextarea from "../../../../styles/AutoResizeTextarea.jsx";

const INITIAL_FORM = {
    interviewDate: "",
    message: "",
    meetingType: "",
    meetingDetails: "",
};

const toForm = (i) => i ? {
    interviewDate: i.interviewDate ?? "",
    message: i.message ?? "",
    meetingType: i.meetingType ?? "",
    meetingDetails: i.meetingDetails ?? "",
} : INITIAL_FORM;

const MEETINGTYPE = ["ONLINE", "PHONE", "IN_PERSON"];

const MESSAGE_MIN = 2;
const MESSAGE_MAX = 500;
const DETAILS_MAX = 255;


function buildPayload(formData, internship) {
    const tomorrow = getTomorrow();
    const isPastDate = (value, original) => value < tomorrow && value !== original;

    const message = formData.message.trim();
    const meetingDetails = formData.meetingDetails.trim();

    if (isPastDate(formData.interviewDate, internship?.interviewDate)) {
        return {error: {key: "internshipModal.errorDate"}};
    }

    if (isPastDate(MEETINGTYPE.includes(formData.meetingType))) {
        return {error: {key: "internshipModal.errorMeetingType"}};
    }

    if (message.length < MESSAGE_MIN || meetingDetails.length < 1) {
        return {error: {key: "internshipModal.errorTooShort"}};
    }

    if (message.length > MESSAGE_MAX || meetingDetails.length > DETAILS_MAX) {
        return {error: {key: "internshipModal.errorTooLong"}};
    }
/*
@NotBlank
@Size(min = 2, max = 500)
    String message,

    @NotNull
    @FutureOrPresent
    LocalDateTime interviewDate,

    @NotNull
    MeetingType meetingType,

    @NotNull
    @Size(max = 255)
    String meetingDetails
*/
    return {
        payload: {
            message: message,
            interviewDate: formData.interviewDate,
            meetingType: formData.meetingType,
            meetingDetails: meetingDetails,
        },
    };
}

const getTomorrow = () => new Date(Date.now() + 86400000).toLocaleDateString("en-CA");


function InterviewPicker({application = null, dark, onClose, onSendOffer, interview}) {
    const s = getInternshipFormClasses(dark);
    const {t} = useTranslation();
    const [error, setError] = useState(null);
    const tomorrow = getTomorrow();
    const [formData, setFormData] = useState(toForm(interview));
    const minDate = tomorrow;
    const [isEdit, setIsEdit] = useState(interview !== undefined && interview != null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const {error: validationError, payload} = buildPayload(formData, application);
        if (validationError) return setError(validationError);

        const result = await onSendOffer(payload);

        // Failure: keep everything the user typed so nothing is lost
        if (!result?.success) return setError(result?.message || {key: "postInternship.createError"});

        // Success: close (the parent unmounts the form, which resets it)
        onClose();
    };

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
    };

    return (
        <section className={s.wrapper}>
            <div className={s.header}>
                <h2 className={s.title}>{isEdit ? t("interview.editTitle") : t("interview.title")}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className={s.errorBanner} role="alert">
                        <span>{translateWarning(t, error)}</span>
                    </div>
                )}

                {/* Message: grows with its content */}
                <Field id="message" label={t("interview.messageLabel")} labelClass={s.label}>
                    <AutoResizeTextarea
                        id="message" name="message" rows={3} value={formData.message}
                        onChange={handleChange}
                        className={s.textarea} required
                    />
                </Field>

                {/* Date TODO: Add in time selectruion*/}
                <div className={s.grid2}>
                    <Field id="interviewDate" label={t("interview.meetingTimeLabel")} labelClass={s.label}>
                        <input
                            id="interviewDate" type="datetime-local" name="interviewDate" value={formData.interviewDate}
                            min={minDate} onChange={handleChange}
                            className={s.input} required
                        />

                    </Field>
                </div>

                {/* Meeting Type */}
                <Field id="meetingType" label={t("interview.meetingTypeLabel")} labelClass={s.label}>
                    <select
                        id="meetingType" name="meetingType" value={formData.meetingType}
                        onChange={handleChange} className={s.input} required
                    >
                        <option value="" disabled>{t("interview.selectPlaceholder")}</option>
                        {MEETINGTYPE.map((value) => (
                            <option key={value} value={value}>{t(`interview.meetingTypes.${value}`)}</option>
                        ))}
                    </select>
                </Field>

                {/* Meeting Details: grows with its content */}
                <Field id="meetingDetails" label={t("interview.meetingDetailsLabel")} labelClass={s.label}>
                    <AutoResizeTextarea
                        id="meetingDetails" name="meetingDetails" rows={3} value={formData.meetingDetails}
                        onChange={handleChange}
                        className={s.textarea} required
                    />
                </Field>

                {/* Footer */}
                <div className={s.footer}>
                    <Button type="button" tone="neutral" size="lg" dark={dark} onClick={onClose}>
                        {t("interview.cancelBtn")}
                    </Button>
                    <Button type="submit" tone="primary" size="lg" dark={dark}>
                        {isEdit ? t("interview.saveChanges") : t("interview.submitBtn")}
                    </Button>
                </div>
            </form>
        </section>
    )
}

export default InterviewPicker;