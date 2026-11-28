export const APPLICATION_ROLES = {
    EMPLOYER: {canHire: true, canInterview: true, canPreview: true},
};
export const getApplicationRole = () => APPLICATION_ROLES.EMPLOYER;
