import {acceptOffer, denyOffer, getStudentOffers} from "../components/shared/core/api/Api.jsx";

export const OFFER_ROLES = {
    STUDENT: {
        fetchList: (...args) => getStudentOffers(...args),
        accept: (...args) => acceptOffer(...args),
        deny: (...args) => denyOffer(...args),
    },
};

export const getOfferRole = (user) => OFFER_ROLES.STUDENT;
