import {useCallback, useEffect, useState} from "react";
import {useLocation, useOutletContext} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {getInternshipCardClasses, getPostInternshipClasses} from "../../../styles/AppStyles.jsx";
import Icon from "../../../styles/Icon.jsx";
import {acceptOffer, denyOffer, getStudentOffers} from "../../api/Api.jsx";
import {usePolling} from "../../../utils/usePolling.js";
import {translateWarning} from "../../../utils/CommonFields.jsx";
import Button from "../../../styles/Button.jsx";
import {useNotifications} from "../../notification/NotificationsProvider.jsx";

const CONSENT_ICON = {PENDING: "hourglass_bottom", ACCEPTED: "check_circle", REJECTED: "close"};

const CONSENT_CLASSES = {
    PENDING: {
        dark: "border-amber-500/30 bg-amber-500/10 text-amber-200",
        light: "border-amber-200 bg-amber-50 text-amber-700",
    },
    ACCEPTED: {
        dark: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
        light: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    REJECTED: {
        dark: "border-red-500/30 bg-red-500/10 text-red-200",
        light: "border-red-200 bg-red-50 text-red-700",
    },
};

// Newest offer (highest application id) first
const sortOffers = (list) => [...list].sort((a, b) => b.id - a.id);

function Offers() {
    const {dark} = useOutletContext();
    const {t} = useTranslation();
    const {refresh: refreshNotifications} = useNotifications();
    const {hash} = useLocation();
    const s = getPostInternshipClasses(dark);
    const cardS = getInternshipCardClasses(dark);

    const [offers, setOffers] = useState(null); // null = loading
    const [loadFailed, setLoadFailed] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [actionError, setActionError] = useState(null); // {key, options?}, translated at render

    const load = useCallback(async () => {
        try {
            const data = await getStudentOffers();
            if (!Array.isArray(data)) throw new Error("Invalid offers response");
            setOffers(data);
            setLoadFailed(false);
        } catch {
            setLoadFailed(true);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    usePolling(load);

    // Coming from a notification: scroll to the offer
    useEffect(() => {
        if (!offers || !hash) return;
        document.getElementById(hash.slice(1))?.scrollIntoView?.({behavior: "smooth", block: "center"});
    }, [hash, offers]);

    // Accepting creates the contract. A 409 (contract already exists, offer rejected, no offer,
    // student already employed) means the state changed, so the list is always reloaded.
    const answer = async (offerId, request, fallbackKey) => {
        if (busyId !== null) return;
        setBusyId(offerId);
        setActionError(null);
        try {
            await request(offerId);
        } catch (err) {
            setActionError(err.i18n ?? {key: fallbackKey});
        } finally {
            await load();
            void refreshNotifications();
            setBusyId(null);
        }
    };

    const handleAccept = (offerId) => answer(offerId, acceptOffer, "studentOffers.acceptFailed");
    const handleDeny = (offerId) => answer(offerId, denyOffer, "studentOffers.denyFailed");

    const renderCard = (offer) => {
        const consent = CONSENT_ICON[offer.studentInternshipConsent] ? offer.studentInternshipConsent : "PENDING";
        const highlighted = hash === `#offer-${offer.id}`;
        const busy = busyId === offer.id;

        return (
            <article
                key={offer.id}
                id={`offer-${offer.id}`}
                aria-busy={busy}
                className={`${cardS.card} scroll-mt-20 border-l-4 border-l-emerald-500 ${highlighted ? "ring-2 ring-indigo-500" : ""}`}
            >
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h2 className={`${cardS.title} wrap-break-word`}>{offer.internshipTitle}</h2>
                        {offer.companyName && (
                            <p className={`mt-1 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>
                                {offer.companyName}
                            </p>
                        )}
                    </div>
                    <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${
                            dark ? CONSENT_CLASSES[consent].dark : CONSENT_CLASSES[consent].light}`}>
                        <Icon name={CONSENT_ICON[consent]} size={18}/>
                        {t(`studentOffers.consent.${consent}`)}
                    </span>
                </div>

                <div className={`${cardS.detailsRow} mt-4 justify-between`}>
                    <span className={cardS.detailBadge}>
                        <Icon name="event" size={20}/>
                        <span
                            className="font-medium">{t("studentOffers.applicationDate")}</span> {offer.applicationDate}
                    </span>
                    {consent === "PENDING" && (
                        <div className="flex gap-2">
                            <Button icon="check" dark={dark} disabled={busyId !== null}
                                    onClick={() => handleAccept(offer.id)}>
                                {t("studentInterviews.accept")}
                            </Button>
                            <Button icon="close" dark={dark} disabled={busyId !== null}
                                    onClick={() => handleDeny(offer.id)}>
                                {t("studentInterviews.reject")}
                            </Button>
                        </div>
                    )}
                </div>
            </article>
        );
    };

    let body;
    if (loadFailed && offers === null) {
        body = <p className={s.errorText} role="alert">{t("studentOffers.loadError")}</p>;
    } else if (offers === null) {
        body = <p className={s.loadingText} aria-busy="true">{t("studentOffers.loading")}</p>;
    } else if (offers.length === 0) {
        body = <p className={s.emptyText}>{t("studentOffers.empty")}</p>;
    } else {
        body = sortOffers(offers).map(renderCard);
    }

    return (
        <div className={s.page}>
            <div className={s.headerSection}>
                <div>
                    <h1 className={s.title}>{t("studentOffers.title")}</h1>
                    <p className={s.subtitle}>{t("studentOffers.subtitle")}</p>
                </div>
            </div>
            <div className={s.listSection}>
                {actionError && (
                    <p className={`${s.errorText} mb-4`} role="alert">{translateWarning(t, actionError)}</p>
                )}
                <div className={s.scrollArea}>{body}</div>
            </div>
        </div>
    );
}

export default Offers;