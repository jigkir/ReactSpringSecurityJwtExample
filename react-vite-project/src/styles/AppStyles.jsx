// region Shared tokens
const FOCUS_RING = "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const FOCUS_RING_OFFSET = "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2";
const TRANSITION = "transition-colors duration-200";
const TRANSITION_150 = "transition-colors duration-150";
const ROUNDED = "rounded-lg";
const BORDER = "border";
const FADE_IN_DOWN = "animate-fade-in-down motion-reduce:animate-none";
const BRAND_BTN = "bg-indigo-600 hover:bg-indigo-700 text-white";
const BRAND_FOCUS = "focus:ring-indigo-500";
// endregion

// region Brand surface (hero + footer)
export function getBrandSurface(dark) {
    return dark ? "bg-blue-950" : "bg-violet-200";
}

// endregion

// region Shared link buttons
const LINK_BTN_BASE = `inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold transition-colors ${FOCUS_RING_OFFSET}`;

export const PRIMARY_LINK_BTN = `${LINK_BTN_BASE} ${BRAND_BTN}`;

export function getSecondaryLinkBtn(dark) {
    return `${LINK_BTN_BASE} ${dark ? "border-2 border-slate-500 text-slate-200 hover:bg-slate-700" : "bg-white text-indigo-700 shadow-sm hover:bg-indigo-50"}`;
}

// endregion

// region Auth / shared form classes
const field = {
    dark: "bg-slate-700 border-slate-600 text-white",
    light: "bg-white border-gray-300 text-gray-900",
};
const eye = {
    dark: "border-slate-600 text-slate-300 hover:bg-slate-600",
    light: "border-gray-300 text-gray-500 hover:bg-gray-50",
};
const serverError = {
    dark: "bg-red-900/30 border-red-700 text-red-300",
    light: "bg-red-50 border-red-300 text-red-700",
};
const card = {
    dark: "bg-slate-800 border-slate-700",
    light: "bg-white border-gray-200",
};

export function getAuthClasses(dark) {
    return {
        fieldClass: [
            "w-full px-3 py-2",
            BORDER, ROUNDED, FOCUS_RING, TRANSITION,
            dark ? field.dark : field.light,
        ].join(" "),

        labelClass: [
            "block text-sm font-medium mb-1",
            dark ? "text-slate-300" : "text-gray-700",
        ].join(" "),

        errorClass: [
            "mt-1 text-xs",
            dark ? "text-red-400" : "text-red-600",
        ].join(" "),

        eyeClass: [
            "shrink-0 p-2",
            BORDER, ROUNDED, TRANSITION,
            "focus:outline-none focus:ring-2 focus:ring-indigo-500",
            dark ? eye.dark : eye.light,
        ].join(" "),

        serverErrorClass: [
            "px-4 py-3 text-sm",
            BORDER, ROUNDED,
            dark ? serverError.dark : serverError.light,
        ].join(" "),

        passwordHintClass: [
            "mt-1 text-xs",
            dark ? "text-slate-400" : "text-gray-500",
        ].join(" "),

        submitClass: [
            "w-full mt-2",
            BRAND_BTN,
            "font-semibold py-2.5",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            ROUNDED, TRANSITION,
            FOCUS_RING_OFFSET,
        ].join(" "),

        cardClass: [
            "w-full max-w-md p-8 rounded-2xl shadow-lg",
            BORDER,
            dark ? card.dark : card.light,
        ].join(" "),

        pageClass: "flex-1 flex items-center justify-center p-4",

        titleClass: [
            "text-2xl font-bold text-center mb-6",
            dark ? "text-white" : "text-gray-800",
        ].join(" "),

        subtextClass: [
            "mt-4 text-center text-lg",
            dark ? "text-slate-400" : "text-gray-600",
        ].join(" "),
    };
}

// endregion

// region Navbar
export function getNavbarClasses(dark) {
    return {
        header: dark
            ? "bg-slate-800/95 backdrop-blur border-b border-slate-700 shadow-md shadow-black/20"
            : "bg-indigo-600 border-b border-indigo-700 shadow-md",
        brand: dark
            ? "text-white"
            : "text-white",
        linkActive: dark ? "bg-slate-700 text-white" : "bg-white/15 text-white",
        linkIdle: dark
            ? "text-slate-300 hover:text-white hover:bg-slate-700/60"
            : "text-indigo-100 hover:text-white hover:bg-white/10",
        authBtn: dark
            ? "bg-indigo-500 hover:bg-indigo-400 text-white"
            : "bg-white text-indigo-700 hover:bg-indigo-50",
        greeting: dark ? "text-slate-400" : "text-indigo-100",
        greetingName: dark ? "text-white" : "text-white",
        badge: dark
            ? "bg-slate-700 text-slate-200 ring-1 ring-slate-600"
            : "bg-white/15 text-white ring-1 ring-white/25",
        toggleBtn: dark
            ? "bg-slate-700 hover:bg-slate-600 text-amber-300"
            : "bg-white/15 hover:bg-white/25 text-white",
        signupBtn: dark
            ? "bg-transparent border border-indigo-400 text-indigo-300 hover:bg-indigo-500/20"
            : "bg-transparent border border-white text-white hover:bg-white/15",
        linkBase: `whitespace-nowrap text-sm font-medium px-3 py-1.5 rounded-full ${TRANSITION_150} ${FOCUS_RING_OFFSET}`,
        toggleBase: [
            "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full whitespace-nowrap",
            TRANSITION_150, FOCUS_RING_OFFSET,
        ].join(" "),
    };
}

// endregion

// region Notifications
export function getNotificationMenuClasses(dark) {
    return {
        panel: `fixed left-4 right-4 top-14 md:absolute md:left-0 md:right-auto md:top-auto md:w-71 mt-2 z-50 rounded-xl border shadow-lg overflow-hidden ${dark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`,
        list: `divide-y ${dark ? "divide-slate-700" : "divide-gray-100"}`,
        item: `flex items-center gap-3 px-4 py-3 text-sm ${TRANSITION_150} ${dark ? "text-slate-200 hover:bg-slate-700/60" : "text-gray-700 hover:bg-gray-50"}`,
        empty: `px-4 py-6 text-center text-sm ${dark ? "text-slate-400" : "text-gray-500"}`,
        redDot: `absolute -top-2 -right-2 h-4 w-4 rounded-full bg-red-500 text-xs text-white`,
        error: `px-4 py-3 text-sm ${dark ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-600"}`,
    };
}

// endregion

// region Home
export function getHomeClasses(dark) {
    return {
        page: `flex-1 p-6 ${dark ? "text-white" : "text-gray-900"}`,
        heading: "text-2xl font-bold mb-4",
        subhead: "text-xl font-semibold mb-2"
    };
}

// endregion

// region Footer
export function getFooterClasses(dark) {
    return {
        footer: `mt-auto w-full py-3 text-center ${getBrandSurface(dark)}`,
        copyright: `text-sm font-bold ${dark ? "text-slate-200" : "text-gray-700"}`,
    };
}

// endregion

// region About
export function getAboutClasses(dark) {
    return {
        page: `flex flex-1 items-center justify-center px-4 py-12 ${dark ? "text-white" : "text-black"}`,
        card: "w-full max-w-4xl p-6 md:p-10 flex flex-col gap-6",
        title: "text-3xl md:text-4xl font-bold tracking-tight text-center",
        description: "text-base md:text-lg font-semibold leading-relaxed text-center",
        rolesTitle: "text-xl font-bold text-center",
        rolesGrid: "grid grid-cols-1 md:grid-cols-2 auto-rows-fr gap-10",
        roleCell: `flex flex-col justify-center items-center text-center gap-3 p-6 md:p-8 rounded-none ${dark ? "bg-blue-950 shadow-[10px_10px_25px_rgba(0,0,0,0.6)]" : "bg-violet-300 shadow-[5px_10px_25px_rgba(167,139,255,0.6)]"}`,
        roleIcon: `flex items-center justify-center ${dark ? "text-indigo-300" : "text-indigo-800"}`,
        roleTitle: "text-lg md:text-xl font-bold",
        roleSummary: "text-sm md:text-base font-semibold leading-relaxed",
        footer: "flex flex-col sm:flex-row items-center sm:justify-between gap-4 pt-4",
        version: `text-xs font-medium px-3 py-1 rounded-full ${dark ? "bg-slate-700 text-white" : "bg-gray-100 text-black"}`,
        backBtn: `${LINK_BTN_BASE} border-2 ${dark ? "bg-blue-900 border-blue-900 text-white hover:bg-blue-800" : "bg-indigo-900 border-indigo-900 text-white hover:bg-indigo-800"}`,
    };
}

// endregion

// region MainContainer
export function getMainContainerClasses(dark) {
    return {
        page: `flex flex-1 flex-col items-center text-center ${dark ? "text-white" : "text-gray-900"}`,
        hero: `w-full flex flex-col items-center gap-6 px-4 py-20 md:py-28 ${getBrandSurface(dark)}`,
        title: `${FADE_IN_DOWN} text-4xl md:text-6xl font-bold tracking-tight`,
        subtitle: `${FADE_IN_DOWN} [animation-delay:150ms] max-w-2xl font-semibold text-lg md:text-2xl leading-relaxed ${dark ? "text-slate-300" : "text-gray-600"}`,
        authActions: `${FADE_IN_DOWN} [animation-delay:300ms] flex flex-wrap justify-center gap-4 pt-4`,
        learnMore: `${FADE_IN_DOWN} [animation-delay:450ms] flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16`,
        question: `text-2xl md:text-4xl font-bold ${dark ? "text-slate-100" : "text-gray-800"}`,
        primaryBtn: PRIMARY_LINK_BTN,
        secondaryBtn: getSecondaryLinkBtn(dark),
    };
}

// endregion

// region PostInternship
export function getPostInternshipClasses(dark) {
    return {
        page: `min-h-screen p-4 md:p-10 flex flex-col`,
        headerSection: `max-w-5xl w-full mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b pb-6 shrink-0 ${dark ? "border-slate-700" : "border-gray-200"}`,
        title: `text-3xl font-bold ${dark ? "text-white" : "text-gray-900"}`,
        subtitle: `mt-1 ${dark ? "text-slate-400" : "text-gray-600"}`,
        addBtn: `px-5 py-2.5 font-semibold rounded-lg shadow-md transition duration-200 focus:outline-none focus:ring-2 ${BRAND_FOCUS} focus:ring-offset-2 shrink-0 ${BRAND_BTN}`,
        listSection: "max-w-5xl w-full mx-auto flex-1 flex flex-col",
        listHeading: `text-xl font-semibold mb-4 shrink-0 ${dark ? "text-white" : "text-gray-800"}`,
        scrollArea: "flex-1 space-y-4",
        emptyText: `text-center py-8 ${dark ? "text-slate-400" : "text-gray-500"}`,
        errorText: `p-4 rounded-lg text-center ${dark ? "bg-red-900/20 text-red-400" : "bg-red-50 text-red-500"}`,
        loadingText: `text-center py-8 ${dark ? "text-slate-400" : "text-gray-500"}`,
    };
}

// endregion

// region InternshipCard
export function getInternshipCardClasses(dark) {
    return {
        card: `rounded-xl shadow-sm border p-6 text-left space-y-3 overflow-hidden min-w-0 ${dark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`,
        topRow: "flex justify-between items-start gap-4 min-w-0",
        title: `text-xl font-bold break-words min-w-0 w-full ${dark ? "text-white" : "text-gray-900"}`,
        description: `text-base mt-1 break-words whitespace-normal min-w-0 ${dark ? "text-slate-400" : "text-gray-600"}`,
        skillsRow: `text-base ${dark ? "text-slate-300" : "text-gray-700"}`,
        skillBadge: `px-2 py-0.5 rounded font-medium ${dark ? "bg-blue-900/40 text-blue-300" : "bg-blue-50 text-blue-700"}`,
        detailsRow: `flex flex-wrap gap-2 text-base pt-1 border-t ${dark ? "text-slate-400 border-slate-700" : "text-gray-500 border-gray-100"}`,
        detailBadge: `px-2.5 py-1 rounded flex items-center gap-1.5 ${dark ? "bg-slate-700 text-slate-300" : "bg-gray-100 text-gray-500"}`,
        deleteBtn: `p-1.5 rounded ml-auto transition-colors ${dark ? "text-slate-400 hover:bg-slate-700 hover:text-red-400" : "text-gray-600 hover:bg-gray-200 hover:text-red-600"}`,
        statusBadge: (status) => {
            const base = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-base font-medium shrink-0";
            if (status === "PENDING") return dark
                ? `${base} bg-yellow-900/30 text-yellow-300 border border-yellow-700`
                : `${base} bg-yellow-50 text-yellow-700 border border-yellow-200`;
            if (status === "APPROVED") return dark
                ? `${base} bg-green-900/30 text-green-300 border border-green-700`
                : `${base} bg-green-50 text-green-700 border border-green-200`;
            return dark
                ? `${base} bg-red-900/30 text-red-300 border border-red-700`
                : `${base} bg-red-50 text-red-700 border border-red-200`;
        },
    };
}

// endregion

// region InternshipModal
export function getInternshipModalClasses(dark) {
    return {
        overlay: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto",
        panel: `rounded-2xl shadow-2xl w-full max-w-2xl p-6 md:p-8 my-8 max-h-[90vh] overflow-y-auto ${dark ? "bg-slate-800" : "bg-white"}`,
        header: `flex justify-between items-center border-b pb-4 mb-6 ${dark ? "border-slate-700" : "border-gray-200"}`,
        title: `text-2xl font-bold ${dark ? "text-white" : "text-gray-800"}`,
        closeBtn: `font-bold text-2xl transition-colors ${dark ? "text-slate-400 hover:text-slate-200" : "text-gray-400 hover:text-gray-600"}`,
        errorBanner: `p-3 border rounded-lg flex items-center space-x-2 text-sm font-medium ${dark ? "bg-red-900/30 border-red-700 text-red-300" : "bg-red-50 border-red-200 text-red-600"}`,
        label: `block text-sm font-semibold mb-1 ${dark ? "text-slate-300" : "text-gray-700"}`,
        input: `w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${dark ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400" : "border-gray-300 text-gray-900"}`,
        textarea: `w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${dark ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400" : "border-gray-300 text-gray-900"}`,
        hint: `text-xs mt-1 ${dark ? "text-slate-400" : "text-gray-500"}`,
        grid2: "grid grid-cols-1 md:grid-cols-2 gap-4",
        footer: `flex items-center justify-end space-x-3 pt-6 border-t mt-6 ${dark ? "border-slate-700" : "border-gray-200"}`,
        cancelBtn: `px-5 py-2.5 rounded-lg font-medium transition-colors ${dark ? "text-slate-200 bg-slate-700 hover:bg-slate-600" : "text-gray-700 bg-gray-100 hover:bg-gray-200"}`,
        submitBtn: `px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors ${BRAND_BTN}`,
    };
}

// endregion

// region Button
export const CV_BUTTON_BASE =
    "inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors duration-150 whitespace-nowrap " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 " +
    "disabled:opacity-40 disabled:cursor-not-allowed";

export const CV_BUTTON_TONES = {
    dark: {
        neutral: "border-slate-600 text-slate-200 hover:bg-slate-700",
        accent: "border-indigo-500/40 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20",
        danger: "border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20",
        success: "border-green-500/40 bg-green-500/10 text-green-300 hover:bg-green-500/20",
    },
    light: {
        neutral: "border-gray-300 text-gray-700 hover:bg-gray-100",
        accent: "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
        danger: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
        success: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
    },
};
// endregion

// region CvDocuments
export function getCvDocumentsClasses(dark) {
    return {
        card: `w-full rounded-xl border shadow-sm ${dark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`,
        header: `flex items-center justify-between gap-4 px-6 py-4 border-b ${dark ? "border-slate-700" : "border-gray-200"}`,
        title: `text-base font-semibold ${dark ? "text-white" : "text-gray-900"}`,
        addBtn: `text-sm font-semibold px-3.5 py-1.5 rounded-lg ${BRAND_BTN} transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2`,
        list: `divide-y ${dark ? "divide-slate-700" : "divide-gray-200"}`,
        row: `flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center transition-colors duration-150 ${dark ? "hover:bg-slate-700/40" : "hover:bg-gray-50"}`,
        name: `max-w-full truncate text-left text-sm font-semibold ${dark ? "text-white" : "text-gray-900"}`,
        meta: `mt-1 text-sm ${dark ? "text-slate-400" : "text-gray-600"}`,
        muted: `px-6 py-8 text-center text-sm ${dark ? "text-slate-400" : "text-gray-500"}`,
        skel: dark ? "bg-slate-700" : "bg-gray-200",
        rejectionBox: `mt-2 rounded-lg border-l-4 px-3 py-2 ${dark ? "border-red-500 bg-red-900/30" : "border-red-500 bg-red-50"}`,
        rejectionLabel: `text-xs font-bold uppercase tracking-wide ${dark ? "text-red-300" : "text-red-700"}`,
        rejectionText: `mt-0.5 text-sm font-semibold break-words ${dark ? "text-red-100" : "text-red-900"}`,

        error: `px-4 py-3 rounded-lg text-sm border ${dark ? "bg-red-900/30 border-red-700 text-red-300" : "bg-red-50 border-red-300 text-red-700"}`,
        pillBase: "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap",
        pillPublic: dark ? "bg-amber-500/20 text-amber-200" : "bg-amber-100 text-amber-800",
        pillPrivate: dark ? "bg-slate-700 text-slate-200" : "bg-gray-100 text-gray-700",
        confirmText: `text-sm ${dark ? "text-slate-300" : "text-gray-700"}`,
        statusPill: (status) => {
            if (status === "APPROVED") return dark ? "bg-green-500/20 text-green-300" : "bg-green-100 text-green-800";
            if (status === "REFUSED" || status === "REJECTED") return dark ? "bg-red-500/20 text-red-300" : "bg-red-100 text-red-800";
            return dark ? "bg-yellow-500/20 text-yellow-200" : "bg-yellow-100 text-yellow-800";
        },
    };
}

// endregion

// region CvPreview
export function getCvPreviewClasses(dark) {
    return {
        overlay: "fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4",
        dialog: `flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border shadow-xl ${dark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`,
        header: `flex items-center justify-between gap-4 px-6 py-3 border-b ${dark ? "border-slate-700" : "border-gray-200"}`,
        title: `min-w-0 truncate text-base font-semibold ${dark ? "text-white" : "text-gray-900"}`,
        body: `min-h-0 flex-1 ${dark ? "bg-slate-900" : "bg-gray-100"}`,
        muted: `px-6 py-8 text-center text-sm ${dark ? "text-slate-400" : "text-gray-500"}`,
    };
}

// endregion

// region CvUpload
export function getCvUploadClasses(dark, isDragging) {
    return {
        iconColor: dark ? "text-indigo-400" : "text-indigo-600",
        ghostBtn: [
            "text-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-150",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
            dark ? "text-slate-300 hover:text-white hover:bg-slate-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
        ].join(" "),
        dangerBtn: [
            "text-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-150",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
            dark ? "text-red-400 hover:text-red-300 hover:bg-red-900/20"
                : "text-red-600 hover:text-red-700 hover:bg-red-50",
        ].join(" "),
        fileCard: [
            "mt-4 flex items-start gap-4 p-4 rounded-xl border",
            dark ? "bg-slate-700/50 border-slate-600" : "bg-gray-50 border-gray-200",
        ].join(" "),
        dropzone: [
            "relative mt-4 flex flex-col items-center justify-center gap-3 rounded-xl",
            "border-2 border-dashed px-6 py-10 text-center transition-colors duration-150 cursor-pointer",
            "focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500",
            isDragging
                ? dark ? "border-indigo-400 bg-indigo-900/20" : "border-indigo-500 bg-indigo-50"
                : dark ? "border-slate-600 hover:border-indigo-500 hover:bg-slate-700/30"
                    : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50",
        ].join(" "),
        hint: `text-sm mt-1 ${dark ? "text-slate-400" : "text-gray-500"}`,
        fileName: `text-sm font-medium truncate break-all ${dark ? "text-white" : "text-gray-800"}`,
        fileMeta: `text-xs mt-0.5 ${dark ? "text-slate-400" : "text-gray-500"}`,
        subtitle: `text-center text-sm mb-6 ${dark ? "text-slate-300" : "text-gray-600"}`,
        dragHintText: `text-sm font-medium ${dark ? "text-slate-200" : "text-gray-700"}`,
        successText: dark ? "text-green-400" : "text-green-600",
    };
}

// endregion