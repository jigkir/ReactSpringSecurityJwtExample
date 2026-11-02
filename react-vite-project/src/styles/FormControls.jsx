import Icon from './Icon.jsx';

/**
 * Class of a <select> / text input / textarea.
 * `border` (optional) is a status border colour class: the control then gets a 2px coloured border.
 */
export function getSelectClass(dark, border) {
    const base = "rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
    const colors = dark ? "bg-slate-700 text-white placeholder-slate-400" : "bg-white text-gray-900";
    const outline = border ? `border-2 ${border}` : `border ${dark ? "border-slate-600" : "border-gray-300"}`;
    return `${base} ${colors} ${outline}`;
}

// Search box: native (blue) clear button hidden, replaced by a red "close" icon
export function SearchInput({value, onChange, placeholder, ariaLabel, clearAriaLabel, dark}) {
    return (
        <div className="relative w-full md:w-64">
            <input
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-label={ariaLabel}
                className={`${getSelectClass(dark)} w-full pr-8 [&::-webkit-search-cancel-button]:appearance-none`}
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    aria-label={clearAriaLabel}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex text-red-500 hover:text-red-600"
                >
                    <Icon name="close" size={18}/>
                </button>
            )}
        </div>
    );
}
