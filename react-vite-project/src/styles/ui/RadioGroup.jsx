import {useTranslation} from "react-i18next";

function RadioGroup({
                        label,
                        name,
                        options,
                        value,
                        error,
                        onChange,
                        clearValue = null,
                        dark,
                    }) {
    const { t } = useTranslation();
    const textClass = dark ? "text-slate-200" : "text-gray-800";
    const hasSelection = value !== null && value !== undefined && value !== "";

    return (
        <fieldset className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <legend className={`text-sm font-medium ${textClass}`}>{label}</legend>
                {hasSelection && (
                    <button
                        type="button"
                        onClick={() => onChange(clearValue)}
                        className="text-xs underline opacity-75 hover:opacity-100"
                    >
                        {t("workplaceEvaluation.clearSelection")}
                    </button>
                )}
            </div>
            <div className="flex flex-wrap gap-4">
                {options.map((opt) => (
                    <label
                        key={String(opt.value)}
                        className={`flex cursor-pointer items-center gap-2 text-sm ${textClass}`}
                    >
                        <input
                            type="radio"
                            name={name}
                            value={String(opt.value)}
                            checked={value === opt.value}
                            onChange={() => onChange(opt.value)}
                            className="h-4 w-4 accent-indigo-500"
                        />
                        <span>{opt.label}</span>
                    </label>
                ))}
            </div>
            {error && (
                <p className="text-sm text-red-500" role="alert">
                    {t(error)}
                </p>
            )}
        </fieldset>
    );
}

export default RadioGroup;
