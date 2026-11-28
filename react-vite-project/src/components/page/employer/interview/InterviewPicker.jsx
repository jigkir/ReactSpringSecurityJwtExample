import {getInternshipFormClasses} from "../../../../styles/AppStyles.jsx";
import Button from "../../../../styles/Button.jsx";
import {useTranslation} from "react-i18next";
import {Field, PhoneNumberField, translateWarning} from "../../../../utils/CommonFields.jsx";
import {useState} from "react";
import AutoResizeTextarea from "../../../../styles/AutoResizeTextarea.jsx";
import Icon from "../../../../styles/Icon.jsx";

const INITIAL_FORM = {
    interviewDate: "",
    message: "",
    phoneNumber: "",
    meetingType: "",
    meetingDetails: "",
};

const toForm = (i) => i ? {
    interviewDate: i.interviewDate ?? "",
    message: i.message ?? "",
    phoneNumber: i.phoneNumber ?? "",
    meetingType: i.meetingType ?? "",
    meetingDetails: i.meetingDetails ?? "",
} : INITIAL_FORM;

const MEETINGTYPE = ["ONLINE", "PHONE", "IN_PERSON"];

const MESSAGE_MIN = 2;
const MESSAGE_MAX = 500;
const DETAILS_MAX = 255;

const pad = (n) => String(n).padStart(2, "0");

// Local time in the format <input type="datetime-local"> expects: YYYY-MM-DDTHH:mm
const getNow = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function buildPayload(formData, interview) {
    const now = getNow();
    const isPastDate = (value, original) => value < now && value !== original;

    const message = formData.message.trim();
    const meetingDetails = formData.meetingDetails.trim();

    if (isPastDate(formData.interviewDate, interview?.interviewDate)) {
        return {error: {key: "interview.errorDate"}};
    }

    if (!MEETINGTYPE.includes(formData.meetingType)) {
        return {error: {key: "interview.errorMeetingType"}};
    }

    const isPhone = formData.meetingType === "PHONE";
    if (isPhone && !/^[1-9]\d{9}$/.test(formData.phoneNumber)) {
        return {error: {key: "interview.errorPhoneNumber"}};   // add this key to fr/en
    }

    if (message.length < MESSAGE_MIN || meetingDetails.length < 1) {
        return {error: {key: "interview.errorTooShort"}};
    }

    if (message.length > MESSAGE_MAX || meetingDetails.length > DETAILS_MAX) {
        return {error: {key: "interview.errorTooLong"}};
    }



    return {
        payload: {
            message,
            interviewDate: formData.interviewDate,
            meetingType: formData.meetingType,
            meetingDetails,
            ...(isPhone && {interviewPhoneNumber: formData.phoneNumber}),
        },
    };
}


function InterviewPicker({dark, onClose, onSendOffer, interview}) {
    const s = getInternshipFormClasses(dark);
    const {t} = useTranslation();
    const [error, setError] = useState(null);
    const minDate = getNow();
    const [formData, setFormData] = useState(() => toForm(interview));
    const isEdit = Boolean(interview);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const {error: validationError, payload} = buildPayload(formData, interview);
        if (validationError) return setError(validationError);

        const result = await onSendOffer(payload);

        // Failure: keep everything the user typed so nothing is lost
        if (!result?.success) return setError(result?.message || {key: "postInternship.createGenericError"});

        // Success: close (the parent unmounts the form, which resets it)
        onClose();
    };

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
    };

    const handlePhoneChange = (e) => {
        const digits = e.target.value
            .replace(/\D/g, "")
            .replace(/^0+/, "")
            .slice(0, 10);
        setFormData((prev) => ({...prev, phoneNumber: digits}));
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
                {formData.meetingType === "PHONE" && (
                    <PhoneNumberField
                        value={formData.phoneNumber}
                        onChange={handlePhoneChange}
                        warning={translateWarning(t, error)}
                        labelClass={s.label}
                        fieldClass={s.input}
                        errorClass="mt-1 text-xs text-red-500"
                    />
                )}
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
                    <Button type="button" icon="close" tone="neutral" size="lg" dark={dark} onClick={onClose}
                            className="w-full sm:w-auto">
                        {t("interview.cancelBtn")}
                    </Button>
                    <Button type="submit" icon="send" tone="primary" size="lg" dark={dark} className="w-full sm:w-auto">
                        {isEdit ? t("interview.saveChanges") : t("interview.submitBtn")}
                    </Button>
                </div>
            </form>
        </section>
    );
}

export default InterviewPicker;