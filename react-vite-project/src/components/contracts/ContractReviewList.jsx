/**
 * ContractReviewList.jsx — Manager view of the internship contracts (list, sign, PDF).
 *
 * Used by Contracts.jsx.
 * <ContractReviewList />          full page (route /manager/contracts): the contracts of the session chosen
 *                        in the navbar, unsigned first, then newest first.
 * <ContractReviewList preview />  Home page block: the contracts the manager has not signed yet,
 *                        every session, no header. A contract leaves this list as soon as it is signed.
 *
 * Signing
 *   normal mode  PUT contracts/{id}/signature {termsAccepted, password}
 *   Dev mode     PUT dev/contracts/{id}/signature?email=  (no password)
 * The backend returns the updated contract: it is patched into the list, so the card shows
 * "Signed on … by …" without a reload. Failures never mark the contract as signed.
 *
 * Notifications: the full page closes the CONTRACT_TO_SIGN notifications of the contracts it shows
 * (session-scoped, see NotificationsProvider). The Home preview does not.
 *
 * Props: dark, user (needs user.email for Dev signing), preview
 */

import {useCallback, useMemo} from 'react';
import {useTranslation} from 'react-i18next';
import Button from '../../styles/Button.jsx';
import {getPostInternshipClasses} from '../../styles/AppStyles.jsx';
import {getContracts, getPendingContracts, signContract} from '../api/Api.jsx';
import {devSignContract} from '../api/DevApi.jsx';
import {useDevMode} from '../dev/DevMode.jsx';
import PreviewState from '../home/PreviewState.jsx';
import {TARGET_TYPE, useCloseShownNotifications, useNotifications} from '../notification/NotificationsProvider.jsx';
import {useLoadedList} from '../../utils/useLoadedList.js';
import {useSession} from '../../utils/useSession.js';
import ContractCard from './ContractCard.jsx';

const HTTP = {BAD_REQUEST: 400, NOT_FOUND: 404, CONFLICT: 409};

const isUnsigned = (contract) => !contract.managerSignedAt;

const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);

// Unsigned first, then newest first
const sortContracts = (list) =>
    [...list].sort((a, b) => Number(isUnsigned(b)) - Number(isUnsigned(a)) || byNewest(a, b));

// Translation {key, options?} of a failed signature
function toSignError(err) {
    const body = err.body ?? {};

    if (err.status === HTTP.BAD_REQUEST) {
        // Bean validation returns {field: message}; the wrong password returns {message}
        if (body.termsAccepted) return {key: "managerContracts.sign.errorTerms"};
        if (body.password) return {key: "managerContracts.sign.errorPassword"};
        return {key: "managerContracts.sign.errorWrongPassword"};
    }
    if (err.status === HTTP.CONFLICT) return {key: "managerContracts.sign.errorAlreadySigned"};
    if (err.status === HTTP.NOT_FOUND) return {key: "managerContracts.notFound"};

    return err.i18n ?? {key: "managerContracts.actionFailed"};
}

const ContractReviewList = ({dark, user, preview = false}) => {
    const {t} = useTranslation();
    const {refresh: refreshNotifications} = useNotifications();
    const {selectedSession} = useSession();
    const {devMode} = useDevMode();
    const s = getPostInternshipClasses(dark);

    const fetchContracts = useCallback(async () => {
        // Home preview: unsigned contracts of every session, so the manager never misses one
        if (preview) return getPendingContracts();
        return selectedSession ? getContracts(selectedSession.id) : null; // sessions still loading
    }, [preview, selectedSession]);

    const {items: contracts, setItems, failed, reload} = useLoadedList(fetchContracts);

    const shownContractIds = useMemo(
        () => (preview || !contracts ? null : contracts.map((contract) => contract.id)),
        [preview, contracts],
    );
    useCloseShownNotifications(TARGET_TYPE.CONTRACT, shownContractIds);

    const shown = useMemo(() => {
        if (!contracts) return null;
        return sortContracts(preview ? contracts.filter(isUnsigned) : contracts);
    }, [contracts, preview]);

    // Returns {success: true} or {success: false, message: {key}} (the form displays it)
    const handleSign = async (contract, {termsAccepted, password}) => {
        try {
            const signed = devMode
                ? await devSignContract(contract.id, user?.email)
                : await signContract(contract.id, termsAccepted, password);

            setItems((previous) =>
                (previous ?? []).map((item) => (item.id === contract.id ? {...item, ...signed} : item)));
            void refreshNotifications();

            return {success: true};
        } catch (err) {
            // Someone else signed it, or it vanished: show the current state
            if (err.status === HTTP.CONFLICT || err.status === HTTP.NOT_FOUND) await reload();
            return {success: false, message: toSignError(err)};
        }
    };

    const cards = (shown ?? []).map((contract) => (
        <ContractCard
            key={contract.id}
            contract={contract}
            dark={dark}
            devMode={devMode}
            onSign={handleSign}
        />
    ));

    // Home preview: same states and spacing as every other Home preview
    if (preview) {
        return (
            <PreviewState dark={dark} error={failed && contracts === null} loading={shown === null}
                          empty={shown?.length === 0}>
                {cards}
            </PreviewState>
        );
    }

    let body;
    if (failed && contracts === null) {
        body = (
            <div className={s.errorText} role="alert">
                <p>{t("managerContracts.loadError")}</p>
                <Button tone="neutral" dark={dark} onClick={() => void reload()} className="mt-3">
                    {t("managerContracts.retryBtn")}
                </Button>
            </div>
        );
    } else if (shown === null) {
        body = <p className={s.loadingText} aria-busy="true">{t("managerContracts.loading")}</p>;
    } else if (shown.length === 0) {
        body = <p className={s.emptyText}>{t("managerContracts.empty")}</p>;
    } else {
        body = cards;
    }

    return (
        <div className={s.page}>
            <div className={s.headerSection}>
                <div>
                    <h1 className={s.title}>{t("managerContracts.title")}</h1>
                    <p className={s.subtitle}>{t("managerContracts.subtitle")}</p>
                </div>
            </div>

            <div className={s.listSection}>
                <div className={s.scrollArea}>{body}</div>
            </div>
        </div>
    );
};

export default ContractReviewList;
