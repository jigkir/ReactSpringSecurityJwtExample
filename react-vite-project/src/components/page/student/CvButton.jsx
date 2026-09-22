/**
 * CvButton.jsx — Shared button style helpers used by CvUpload and CvDocuments.
 *
 * Exports:
 *   useButtonClasses(dark)   → { btn, btnTone }
 *   CvButton                 → <CvButton tone="neutral|accent|danger" dark ...nativeProps />
 */

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useButtonClasses(dark) {
    const btn =
        'text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors duration-150 whitespace-nowrap ' +
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ' +
        'disabled:opacity-40 disabled:cursor-not-allowed';

    const btnTone = {
        neutral: dark
            ? 'border-slate-600 text-slate-200 hover:bg-slate-700'
            : 'border-gray-300 text-gray-700 hover:bg-gray-100',
        accent: dark
            ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20'
            : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
        danger: dark
            ? 'border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20'
            : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
    };

    return {btn, btnTone};
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * @param {{ tone?: 'neutral'|'accent'|'danger', dark: boolean }} props
 * All other props (onClick, disabled, aria-label, autoFocus…) are forwarded.
 */
const CvButton = ({tone = 'neutral', dark, className = '', children, ...rest}) => {
    const {btn, btnTone} = useButtonClasses(dark);
    return (
        <button className={`${btn} ${btnTone[tone]} ${className}`} {...rest}>
            {children}
        </button>
    );
};

export default CvButton;