// ─── Shared tokens ────────────────────────────────────────────────────────────

const FOCUS_RING        = 'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
const FOCUS_RING_OFFSET = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2';
const TRANSITION        = 'transition-colors duration-200';
const TRANSITION_150    = 'transition-colors duration-150';
const ROUNDED           = 'rounded-lg';
const BORDER            = 'border';

// ─── Auth / shared form classes ───────────────────────────────────────────────

const field = {
    dark:  'bg-slate-700 border-slate-600 text-white',
    light: 'bg-white border-gray-300 text-gray-900',
};
const eye = {
    dark:  'border-slate-600 text-slate-300 hover:bg-slate-600',
    light: 'border-gray-300 text-gray-500 hover:bg-gray-50',
};
const serverError = {
    dark:  'bg-red-900/30 border-red-700 text-red-300',
    light: 'bg-red-50 border-red-300 text-red-700',
};
const card = {
    dark:  'bg-slate-800 border-slate-700',
    light: 'bg-white border-gray-200',
};

export function getAuthClasses(dark) {
    return {
        fieldClass: [
            'w-full px-3 py-2',
            BORDER, ROUNDED, FOCUS_RING, TRANSITION,
            dark ? field.dark : field.light,
        ].join(' '),

        labelClass: [
            'block text-sm font-medium mb-1',
            dark ? 'text-slate-300' : 'text-gray-700',
        ].join(' '),

        errorClass: [
            'mt-1 text-xs',
            dark ? 'text-red-400' : 'text-red-600',
        ].join(' '),

        eyeClass: [
            'shrink-0 p-2',
            BORDER, ROUNDED, TRANSITION,
            'focus:outline-none focus:ring-2 focus:ring-indigo-500',
            dark ? eye.dark : eye.light,
        ].join(' '),

        serverErrorClass: [
            'px-4 py-3 text-sm',
            BORDER, ROUNDED,
            dark ? serverError.dark : serverError.light,
        ].join(' '),

        passwordHintClass: [
            'mt-1 text-xs',
            dark ? 'text-slate-400' : 'text-gray-500',
        ].join(' '),

        submitClass: [
            'w-full mt-2',
            'bg-indigo-600 hover:bg-indigo-700',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'text-white font-semibold py-2.5',
            ROUNDED, TRANSITION,
            FOCUS_RING_OFFSET,
        ].join(' '),

        cardClass: [
            'w-full max-w-md p-8 rounded-2xl shadow-lg',
            BORDER,
            dark ? card.dark : card.light,
        ].join(' '),

        pageClass: [
            'flex-1 flex items-center justify-center p-4',
            dark ? 'bg-gray-900' : 'bg-gray-100',
        ].join(' '),

        titleClass: [
            'text-2xl font-bold text-center mb-6',
            dark ? 'text-white' : 'text-gray-800',
        ].join(' '),

        subtextClass: [
            'mt-4 text-center text-sm',
            dark ? 'text-slate-400' : 'text-gray-600',
        ].join(' '),
    };
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export function getNavbarClasses(dark) {
    return {
        header: dark
            ? 'bg-slate-800/95 backdrop-blur border-b border-slate-700 shadow-md shadow-black/20'
            : 'bg-indigo-600 border-b border-indigo-700 shadow-md',
        brand: dark
            ? 'text-white hover:text-indigo-300'
            : 'text-white hover:text-indigo-100',
        linkActive: dark ? 'bg-slate-700 text-white'     : 'bg-white/15 text-white',
        linkIdle:   dark
            ? 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            : 'text-indigo-100 hover:text-white hover:bg-white/10',
        authBtn: dark
            ? 'bg-indigo-500 hover:bg-indigo-400 text-white'
            : 'bg-white text-indigo-700 hover:bg-indigo-50',
        greeting:     dark ? 'text-slate-400' : 'text-indigo-100',
        greetingName: dark ? 'text-white'     : 'text-white',
        badge: dark
            ? 'bg-slate-700 text-slate-200 ring-1 ring-slate-600'
            : 'bg-white/15 text-white ring-1 ring-white/25',
        toggleBtn: dark
            ? 'bg-slate-700 hover:bg-slate-600 text-amber-300'
            : 'bg-white/15 hover:bg-white/25 text-white',
        signupBtn: dark
            ? 'bg-transparent border border-indigo-400 text-indigo-300 hover:bg-indigo-500/20'
            : 'bg-transparent border border-white text-white hover:bg-white/15',
        linkBase: `text-sm font-medium px-3 py-1.5 rounded-full ${TRANSITION_150} ${FOCUS_RING_OFFSET}`,
        toggleBase: [
            'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full',
            TRANSITION_150, FOCUS_RING_OFFSET,
        ].join(' '),
    };
}

// ─── Home ─────────────────────────────────────────────────────────────────────

export function getHomeClasses(dark) {
    return {
        page:     `flex-1 p-6 ${dark ? 'text-white' : 'text-gray-900'}`,
        heading:  'text-2xl font-bold mb-4',
        subhead:  'text-xl font-semibold mb-2',
        bodyText: 'text-base',
    };
}

// ─── Footer ───────────────────────────────────────────────────────────────────

export function getFooterClasses() {
    return {
        footer: 'text-center flex flex-col mt-auto',
    };
}

// ─── About ────────────────────────────────────────────────────────────────────

export function getAboutClasses(dark) {
    return {
        page: dark ? 'text-white' : 'text-gray-900',
    };
}

// ─── MainContainer ────────────────────────────────────────────────────────────

export function getMainContainerClasses(dark) {
    return {
        page: `maincontainer ${dark ? 'text-white' : 'text-gray-900'}`,
    };
}

// ─── EmprunteurHome / PreposeHome / GestionnaireHome ─────────────────────────

export function getSimplePageClasses(dark) {
    return {
        page: dark ? 'text-white' : 'text-gray-900',
    };
}

// ─── ErrorPage ────────────────────────────────────────────────────────────────

export function getErrorPageClasses() {
    return {
        message: 'text-base text-red-600',
    };
}

// ─── PostInternship ───────────────────────────────────────────────────────────

export function getPostInternshipClasses() {
    return {
        page:          'h-screen bg-gray-50 p-6 md:p-10 flex flex-col overflow-hidden',
        headerSection: 'max-w-5xl w-full mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-200 pb-6 shrink-0',
        title:         'text-3xl font-bold text-gray-900',
        subtitle:      'text-gray-600 mt-1',
        addBtn:        'px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shrink-0',
        listSection:   'max-w-5xl w-full mx-auto flex-1 flex flex-col min-h-0',
        listHeading:   'text-xl font-semibold text-gray-800 mb-4 shrink-0',
        scrollArea:    'flex-1 overflow-y-auto pr-2 space-y-4 min-h-0',
    };
}

// ─── InternshipCard ───────────────────────────────────────────────────────────

export function getInternshipCardClasses() {
    return {
        card:        'bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left space-y-3',
        topRow:      'flex justify-between items-start gap-4',
        title:       'text-xl font-bold text-gray-900',
        description: 'text-gray-600 text-md mt-1',
        skillsRow:   'text-md text-gray-700',
        skillBadge:  'bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium',
        detailsRow:  'flex flex-wrap gap-2 text-md text-gray-500 pt-1 border-t border-gray-100',
        detailBadge: 'bg-gray-100 px-2.5 py-1 rounded flex items-center gap-1.5',
        deleteBtn:   'p-1.5 rounded hover:bg-gray-200 ml-auto text-gray-600 hover:text-red-600 transition-colors',
        statusBadge: (status) => {
            const base = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-md font-medium shrink-0';
            if (status === 'Pending Validation') return `${base} bg-yellow-50 text-yellow-700 border border-yellow-200`;
            if (status === 'Approved')           return `${base} bg-green-50 text-green-700 border border-green-200`;
            return                                      `${base} bg-red-50 text-red-700 border border-red-200`;
        },
    };
}

// ─── InternshipModal ──────────────────────────────────────────────────────────

export function getInternshipModalClasses() {
    return {
        overlay:     'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto',
        panel:       'bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 md:p-8 my-8 max-h-[90vh] overflow-y-auto',
        header:      'flex justify-between items-center border-b pb-4 mb-6',
        title:       'text-2xl font-bold text-gray-800',
        closeBtn:    'text-gray-400 hover:text-gray-600 font-bold text-2xl transition-colors',
        errorBanner: 'p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-600 text-sm font-medium animate-fadeIn',
        label:       'block text-sm font-semibold text-gray-700 mb-1',
        input:       'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
        textarea:    'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
        hint:        'text-xs text-gray-500 mt-1',
        grid2:       'grid grid-cols-1 md:grid-cols-2 gap-4',
        footer:      'flex items-center justify-end space-x-3 pt-6 border-t mt-6',
        cancelBtn:   'px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors',
        submitBtn:   'px-5 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-sm transition-colors',
    };
}

// ─── CvButton ─────────────────────────────────────────────────────────────────

export const CV_BUTTON_BASE =
    'text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors duration-150 whitespace-nowrap ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ' +
    'disabled:opacity-40 disabled:cursor-not-allowed';

export const CV_BUTTON_TONES = {
    dark: {
        neutral: 'border-slate-600 text-slate-200 hover:bg-slate-700',
        accent:  'border-indigo-500/40 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20',
        danger:  'border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20',
    },
    light: {
        neutral: 'border-gray-300 text-gray-700 hover:bg-gray-100',
        accent:  'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
        danger:  'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
    },
};

// ─── CvDocuments ─────────────────────────────────────────────────────────────

export function getCvDocumentsClasses(dark) {
    return {
        card:   `w-full rounded-xl border shadow-sm ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`,
        header: `flex items-center justify-between gap-4 px-6 py-4 border-b ${dark ? 'border-slate-700' : 'border-gray-200'}`,
        title:  `text-base font-semibold ${dark ? 'text-white' : 'text-gray-900'}`,
        addBtn: 'text-sm font-semibold px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2',
        list:   `divide-y ${dark ? 'divide-slate-700' : 'divide-gray-200'}`,
        row:    `flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center transition-colors duration-150 ${dark ? 'hover:bg-slate-700/40' : 'hover:bg-gray-50'}`,
        name:   `max-w-full truncate text-left text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`,
        meta:   `mt-1 text-sm ${dark ? 'text-slate-400' : 'text-gray-600'}`,
        muted:  `px-6 py-8 text-center text-sm ${dark ? 'text-slate-400' : 'text-gray-500'}`,
        skel:   dark ? 'bg-slate-700' : 'bg-gray-200',
        error:  `px-4 py-3 rounded-lg text-sm border ${dark ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-300 text-red-700'}`,
        pillBase: 'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap',
        pillPublic:  dark ? 'bg-amber-500/20 text-amber-200' : 'bg-amber-100 text-amber-800',
        pillPrivate: dark ? 'bg-slate-700 text-slate-200'    : 'bg-gray-100 text-gray-700',
        confirmText: `text-sm ${dark ? 'text-slate-300' : 'text-gray-700'}`,
    };
}

// ─── CvPreview ────────────────────────────────────────────────────────────────

export function getCvPreviewClasses(dark) {
    return {
        overlay:  'fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4',
        dialog:   `flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border shadow-xl ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`,
        header:   `flex items-center justify-between gap-4 px-6 py-3 border-b ${dark ? 'border-slate-700' : 'border-gray-200'}`,
        title:    `min-w-0 truncate text-base font-semibold ${dark ? 'text-white' : 'text-gray-900'}`,
        body:     `min-h-0 flex-1 ${dark ? 'bg-slate-900' : 'bg-gray-100'}`,
        muted:    `px-6 py-8 text-center text-sm ${dark ? 'text-slate-400' : 'text-gray-500'}`,
    };
}

// ─── CvUpload ─────────────────────────────────────────────────────────────────

export function getCvUploadClasses(dark, isDragging) {
    return {
        iconColor: dark ? 'text-indigo-400' : 'text-indigo-600',
        ghostBtn: [
            'text-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
            dark ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
        ].join(' '),
        dangerBtn: [
            'text-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500',
            dark ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
                : 'text-red-600 hover:text-red-700 hover:bg-red-50',
        ].join(' '),
        fileCard: [
            'mt-4 flex items-start gap-4 p-4 rounded-xl border',
            dark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200',
        ].join(' '),
        dropzone: [
            'relative mt-4 flex flex-col items-center justify-center gap-3 rounded-xl',
            'border-2 border-dashed px-6 py-10 text-center transition-colors duration-150 cursor-pointer',
            'focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500',
            isDragging
                ? dark ? 'border-indigo-400 bg-indigo-900/20' : 'border-indigo-500 bg-indigo-50'
                : dark  ? 'border-slate-600 hover:border-indigo-500 hover:bg-slate-700/30'
                    : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50',
        ].join(' '),
        hint:      `text-sm mt-1 ${dark ? 'text-slate-400' : 'text-gray-500'}`,
        fileName:  `text-sm font-medium truncate break-all ${dark ? 'text-white' : 'text-gray-800'}`,
        fileMeta:  `text-xs mt-0.5 ${dark ? 'text-slate-400' : 'text-gray-500'}`,
        subtitle:  `text-center text-sm mb-6 ${dark ? 'text-slate-300' : 'text-gray-600'}`,
        dragHintText: `text-sm font-medium ${dark ? 'text-slate-200' : 'text-gray-700'}`,
        successText: dark ? 'text-green-400' : 'text-green-600',
    };
}

// ─── Cv (parent) ──────────────────────────────────────────────────────────────

export function getCvPageClasses(dark) {
    return {
        dashboardBtn: [
            'self-center text-sm font-medium px-3 py-1.5 rounded-lg transition-colors',
            dark ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
        ].join(' '),
        skelBlock: dark ? 'bg-slate-700' : 'bg-gray-200',
    };
}