import {getUsers, reactivateUser, denyUser} from "../components/core/api/Api.jsx";

export const USER_ROLES = {
    MANAGER: {
        fetchList: (...args) => getUsers(...args),
        reactivate: (...args) => reactivateUser(...args),
        deny: (...args) => denyUser(...args),
    },
};

export const getUserRole = (user) => USER_ROLES.MANAGER;
