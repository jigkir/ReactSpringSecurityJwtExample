/**
 * ContractReviewList.jsx — Internship contracts of the connected user (manager, employer or student):
 * list, filter, sign, PDF.
 *
 * Used by Contracts.jsx (/manager/contracts, /employer/contracts or /student/contracts):
 * the contracts of the session chosen in the navbar, unsigned first, then newest first.
 *
 * Status filter (StatusColorSelect, initial value from `?status=`): contracts only have
 * ALL | YELLOW | GREEN — GREEN = signed by the connected user, YELLOW = not signed yet. No red.
 *
 * The role (manager / employer / student) only changes which signature field is read
 * (managerSignedAt / employerSignedAt / studentSignedAt) and the base route of the contract page:
 * see utils/ContractRole.js.
 *
 * Signing
 *   normal mode  PUT contracts/{id}/signature {termsAccepted, password}
 *   Dev mode     PUT dev/contracts/{id}/signature?email=  (no password)
 * The backend returns the updated contract: it is patched into the list, so the card shows
 * "Signed on …" without a reload. Failures never mark the contract as signed.
 *
 * Notifications: the page closes the CONTRACT_TO_SIGN notifications of the contracts it loads
 * (session-scoped, see NotificationsProvider).
 *
 * Props: dark, user (needs user.email for Dev signing, user.role for the role)
 */

import {useCallback, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import Button from '../../styles/Button.jsx';
import {getPostInternshipClasses} from '../../styles/AppStyles.jsx';
import {getContracts, signContract} from '../api/Api.jsx';
import {devSignContract} from '../api/DevApi.jsx';
import {useDevMode} from '../dev/DevMode.jsx';
import {TARGET_TYPE, useCloseShownNotifications, useNotifications} from '../notification/NotificationsProvider.jsx';
import {useLoadedList} from '../../utils/useLoadedList.js';
import {useSession} from '../../utils/useSession.js';
import {getContractRole} from '../../utils/ContractRole.js';
import {StatusColorSelect, useColorParam} from '../../utils/Sort.jsx';
import {ALL, COLOR, matchesColor} from '../../utils/StatusColor.js';
import ContractCard from './ContractCard.jsx';

const HTTP = {BAD_REQUEST: 400, NOT_FOUND: 404, CONFLICT: 409};

// Contracts have no red: signed (GREEN) or not (YELLOW)
const CONTRACT_COLORS = [ALL, COLOR.YELLOW, COLOR.GREEN];

const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);

// Unsigned (by the connected user) first, then newest first
const sortContracts = (list, signedAtField) =>
    [...list].sort((a, b) => Number(!b[signedAtField]) - Number(!a[signedAtField]) || byNewest(a, b));

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

const ContractReviewList = ({dark, user}) => {
    const {t} = useTranslation();
    const {refresh: refreshNotifications} = useNotifications();
    const {selectedSession} = useSession();
    const {devMode} = useDevMode();
    const s = getPostInternshipClasses(dark);

    const contractRole = getContractRole(user);
    const {signedAtField} = contractRole;

    const initialStatus = useColorParam("status", CONTRACT_COLORS);
    const [status, setStatus] = useState(initialStatus);

    const fetchContracts = useCallback(async () => {
        return selectedSession ? getContracts(selectedSession.id) : null; // sessions still loading
    }, [selectedSession]);

    const {items: contracts, setItems, failed, reload} = useLoadedList(fetchContracts);

    const shownContractIds = useMemo(
        () => (contracts ? contracts.map((contract) => contract.id) : null),
        [contracts],
    );
    useCloseShownNotifications(TARGET_TYPE.CONTRACT, shownContractIds);

    const shown = useMemo(() => {
        if (!contracts) return null;
        const list = contracts.filter((contract) =>
            matchesColor(contract[signedAtField] ? COLOR.GREEN : COLOR.YELLOW, status));
        return sortContracts(list, signedAtField);
    }, [contracts, status, signedAtField]);

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
            contractRole={contractRole}
            onSign={handleSign}
        />
    ));

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
    } else if (contracts.length === 0) {
        body = <p className={s.emptyText}>{t("managerContracts.empty")}</p>;
    } else if (shown.length === 0) {
        body = <p className={s.emptyText}>{t("managerContracts.noMatch")}</p>;
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
                {contracts && contracts.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <StatusColorSelect dark={dark} value={status} onChange={setStatus}
                                           colors={CONTRACT_COLORS} page="contracts"
                                           ariaLabel={t("managerContracts.statusAria")}/>
                    </div>
                )}
                <div className={s.scrollArea}>{body}</div>
            </div>
        </div>
    );
};

export default ContractReviewList;