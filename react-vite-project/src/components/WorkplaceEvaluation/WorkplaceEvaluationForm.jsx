import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../styles/Button.jsx';
import RadioGroup from '../../styles/RadioGroup.jsx'
import { getInternshipFormClasses } from '../../styles/AppStyles.jsx';
import {
    EVALUATION_CRITERIA,
    EVALUATION_RATINGS,
    INTERN_CAPACITY_OPTIONS,
    PREFERRED_STAGE_OPTIONS,
    buildEvaluationPayload,
    createEmptyShiftRange,
    createInitialEvaluation,
    hasDisagreement,
    validateEvaluation,
} from '../../utils/WorkplaceEvaluation.js';
import AutoResizeTextarea from "../../styles/AutoResizeTextarea.jsx";

function WorkplaceEvaluationForm({ dark, initialData, onSubmit, onCancel }) {
    const { t } = useTranslation();
    const s = getInternshipFormClasses(dark);

    const [formData, setFormData] = useState(() => createInitialEvaluation(initialData));
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const commentRequired = hasDisagreement(formData.criteria);

    // --- State Update Helpers ---

    const updateCriterion = (key, value) => {
        setFormData((prev) => ({
            ...prev,
            criteria: { ...prev.criteria, [key]: value },
        }));
        setErrors((prev) => ({ ...prev, [`criteria.${key}`]: undefined }));
    };

    const updateSupervisionHours = (month, value) => {
        setFormData((prev) => ({
            ...prev,
            criteria: {
                ...prev.criteria,
                supervisionHoursPerWeek: {
                    ...prev.criteria.supervisionHoursPerWeek,
                    [month]: value,
                },
            },
        }));
    };

    const updateObservation = (key, value) => {
        setFormData((prev) => ({
            ...prev,
            generalObservations: { ...prev.generalObservations, [key]: value },
        }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const updateShiftRange = (index, field, value) => {
        setFormData((prev) => {
            const updated = prev.generalObservations.shiftRanges.map((range, i) =>
                i === index ? { ...range, [field]: value } : range
            );
            return {
                ...prev,
                generalObservations: { ...prev.generalObservations, shiftRanges: updated },
            };
        });
        setErrors((prev) => ({ ...prev, shiftRanges: undefined }));
    };

    const addShiftRange = () => {
        setFormData((prev) => ({
            ...prev,
            generalObservations: {
                ...prev.generalObservations,
                shiftRanges: [...prev.generalObservations.shiftRanges, createEmptyShiftRange()],
            },
        }));
    };

    const removeShiftRange = (index) => {
        setFormData((prev) => ({
            ...prev,
            generalObservations: {
                ...prev.generalObservations,
                shiftRanges: prev.generalObservations.shiftRanges.filter((_, i) => i !== index),
            },
        }));
    };

    // --- Submit ---

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;

        const validationErrors = validateEvaluation(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSubmitting(true);
        setSubmitError(null);
        const result = await onSubmit(buildEvaluationPayload(formData));
        setSubmitting(false);

        if (!result?.success) {
            setSubmitError(result?.message ?? "workplaceEvaluation.errors.submitFailed");
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate aria-busy={submitting} className="space-y-6">
            {submitError && (
                <div className={s.errorBanner} role="alert">
                    <span>{t(submitError)}</span>
                </div>
            )}

            {/* SECTION 1: 10 Evaluation Criteria (<select> + conditional extra inputs) */}
            <section className="space-y-4">
                {EVALUATION_CRITERIA.map(({ key, extra }) => (
                    <div key={key} className="space-y-2">
                        <label htmlFor={`criterion-${key}`}>
                            {t(`workplaceEvaluation.criteria.${key}`)}
                        </label>

                        <select
                            id={`criterion-${key}`}
                            value={formData.criteria[key]}
                            onChange={(e) => updateCriterion(key, e.target.value)}
                        >
                            <option value="">{t("workplaceEvaluation.selectPlaceholder")}</option>
                            {EVALUATION_RATINGS.map((rating) => (
                                <option key={rating} value={rating}>
                                    {t(`workplaceEvaluation.ratings.${rating}`)}
                                </option>
                            ))}
                        </select>

                        {errors[`criteria.${key}`] && (
                            <p className="text-sm text-red-500">{t(errors[`criteria.${key}`])}</p>
                        )}

                        {extra === "supervisionHours" && (
                            <div className="mt-3 space-y-2">
                                <p className="text-xs font-medium">
                                    {t("workplaceEvaluation.supervisionHours.title")} *
                                </p>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    {["month1", "month2", "month3"].map((month) => (
                                        <div key={month} className="space-y-1">
                                            <label htmlFor={`hours-${month}`} className="block text-xs">
                                                {t(`workplaceEvaluation.supervisionHours.${month}`)}
                                            </label>
                                            <input
                                                id={`hours-${month}`}
                                                type="number"
                                                min="0"
                                                step="0.5"
                                                required
                                                value={formData.criteria.supervisionHoursPerWeek[month]}
                                                onChange={(e) => {
                                                    updateSupervisionHours(month, e.target.value);
                                                    setErrors((prev) => ({ ...prev, supervisionHoursPerWeek: undefined }));
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                {errors.supervisionHoursPerWeek && (
                                    <p className="text-sm text-red-500" role="alert">
                                        {t(errors.supervisionHoursPerWeek)}
                                    </p>
                                )}
                            </div>
                        )}

                        {extra === "hourlySalary" && (
                            <div className="mt-3 space-y-1">
                                <label htmlFor="hourly-salary" className="block text-xs font-medium">
                                    {t("workplaceEvaluation.hourlySalary.label")} *
                                </label>
                                <input
                                    id="hourly-salary"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    value={formData.criteria.hourlySalary}
                                    onChange={(e) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            criteria: { ...prev.criteria, hourlySalary: e.target.value },
                                        }));
                                        setErrors((prev) => ({ ...prev, hourlySalary: undefined }));
                                    }}
                                />
                                {errors.hourlySalary && (
                                    <p className="text-sm text-red-500" role="alert">
                                        {t(errors.hourlySalary)}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </section>

            {/* SECTION 2: Comments */}
            <section className="space-y-2">
                <label htmlFor="evaluation-comments" className={s.label}>
                    {t("workplaceEvaluation.comments.label")}
                    {commentRequired && <span className="ml-1 text-red-500">*</span>}
                </label>

                {commentRequired && (
                    <p className={s.hint}>
                        {t("workplaceEvaluation.comments.requiredHint")}
                    </p>
                )}

                <AutoResizeTextarea
                    id="evaluation-comments"
                    rows={3}
                    value={formData.comments}
                    required={commentRequired}
                    aria-invalid={Boolean(errors.comments)}
                    placeholder={t("workplaceEvaluation.comments.placeholder")}
                    className={s.input}
                    onChange={(e) => {
                        setFormData((prev) => ({ ...prev, comments: e.target.value }));
                        if (errors.comments) {
                            setErrors((prev) => ({ ...prev, comments: undefined }));
                        }
                    }}
                />

                {errors.comments && (
                    <p className="text-sm text-red-500" role="alert">
                        {t(errors.comments)}
                    </p>
                )}
            </section>

            {/* SECTION 3: General Observations */}
            <section className="space-y-5">
                <RadioGroup
                    dark={dark}
                    clearValue=""
                    name="preferredForStage"
                    label={t("workplaceEvaluation.observations.preferredStage.label")}
                    value={formData.generalObservations.preferredForStage}
                    error={errors.preferredForStage}
                    onChange={(val) => updateObservation("preferredForStage", val)}
                    options={PREFERRED_STAGE_OPTIONS.map((opt) => ({
                        value: opt,
                        label: t(`workplaceEvaluation.observations.preferredStage.${opt}`),
                    }))}
                />

                <RadioGroup
                    dark={dark}
                    clearValue=""
                    name="openToInternCount"
                    label={t("workplaceEvaluation.observations.internCapacity.label")}
                    value={formData.generalObservations.openToInternCount}
                    error={errors.openToInternCount}
                    onChange={(val) => updateObservation("openToInternCount", val)}
                    options={INTERN_CAPACITY_OPTIONS.map((opt) => ({
                        value: opt,
                        label: t(`workplaceEvaluation.observations.internCapacity.${opt}`),
                    }))}
                />

                <RadioGroup
                    dark={dark}
                    name="wouldWelcomeSameInternAgain"
                    label={t("workplaceEvaluation.observations.welcomeAgain.label")}
                    value={formData.generalObservations.wouldWelcomeSameInternAgain}
                    error={errors.wouldWelcomeSameInternAgain}
                    onChange={(val) => updateObservation("wouldWelcomeSameInternAgain", val)}
                    options={[
                        { value: true, label: t("workplaceEvaluation.observations.welcomeAgain.yes") },
                        { value: false, label: t("workplaceEvaluation.observations.welcomeAgain.no") },
                    ]}
                />

                <RadioGroup
                    dark={dark}
                    name="variableShifts"
                    label={t("workplaceEvaluation.observations.variableShifts.label")}
                    value={formData.generalObservations.variableShifts}
                    error={errors.variableShifts}
                    onChange={(val) => {
                        updateObservation("variableShifts", val);
                        if (val !== true) {
                            setErrors((prev) => ({ ...prev, shiftRanges: undefined }));
                        }
                    }}
                    options={[
                        { value: true, label: t("workplaceEvaluation.observations.variableShifts.yes") },
                        { value: false, label: t("workplaceEvaluation.observations.variableShifts.no") },
                    ]}
                />

                {formData.generalObservations.variableShifts === true && (
                    <div className="space-y-3 rounded-lg border border-slate-700/40 p-3">
                        {formData.generalObservations.shiftRanges.map((range, index) => (
                            <div key={index} className="flex flex-wrap items-center gap-2">
                                <span className="text-sm">{t("workplaceEvaluation.observations.variableShifts.from")}</span>
                                <input
                                    type="time"
                                    value={range.from}
                                    onChange={(e) => updateShiftRange(index, "from", e.target.value)}
                                />
                                <span className="text-sm">{t("workplaceEvaluation.observations.variableShifts.to")}</span>
                                <input
                                    type="time"
                                    value={range.to}
                                    onChange={(e) => updateShiftRange(index, "to", e.target.value)}
                                />
                                {formData.generalObservations.shiftRanges.length > 1 && (
                                    <Button
                                        type="button"
                                        tone="neutral"
                                        dark={dark}
                                        onClick={() => removeShiftRange(index)}
                                    >
                                        {t("workplaceEvaluation.observations.variableShifts.removeRange")}
                                    </Button>
                                )}
                            </div>
                        ))}

                        {errors.shiftRanges && (
                            <p className="text-sm text-red-500" role="alert">
                                {t(errors.shiftRanges)}
                            </p>
                        )}

                        <Button
                            type="button"
                            tone="neutral"
                            dark={dark}
                            onClick={addShiftRange}
                        >
                            {t("workplaceEvaluation.observations.variableShifts.addRange")}
                        </Button>
                    </div>
                )}
            </section>

            <div className="flex flex-wrap justify-end gap-2">
                {onCancel && (
                    <Button type="button" tone="neutral" dark={dark} icon="close" disabled={submitting} onClick={onCancel}>
                        {t("workplaceEvaluation.cancel")}
                    </Button>
                )}
                <Button type="submit" tone="success" dark={dark} icon="check" disabled={submitting}>
                    {submitting ? t("workplaceEvaluation.submitting") : t("workplaceEvaluation.submit")}
                </Button>
            </div>
        </form>
    );
}

export default WorkplaceEvaluationForm;