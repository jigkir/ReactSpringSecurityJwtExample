


import {useCallback, useMemo} from "react";
import {useTranslation} from "react-i18next";
import Button from "../../../styles/ui/Button.jsx";
import {getPostInternshipClasses} from "../../../styles/theme/AppStyles.jsx";
import {getContracts, signContract} from "../../shared/core/api/Api.jsx";
import {devSignContract} from "../../shared/core/api/DevApi.jsx";
import {useDevMode} from "../../shared/core/dev/DevMode.jsx";
import {TARGET_TYPE, useCloseShownNotifications, useNotifications} from "../../shared/notification/NotificationsProvider.jsx";
import {useLoadedList} from "../../../utils/hooks/useLoadedList.js";
import {useSession} from "../../../utils/session/useSession.js";
import {getContractRole} from "../../../utils/roles/ContractRole.js";
import {StatusColorSelect, useColorFilter} from "../../../utils/sorting/Sort.jsx";
import {ALL, COLOR, matchesColor} from "../../../utils/status/StatusColor.js";
import ContractCard from "./ContractCard.jsx";

const HTTP = {BAD_REQUEST: 400, NOT_FOUND: 404, CONFLICT: 409};


const CONTRACT_COLORS = [ALL, COLOR.YELLOW, COLOR.GREEN];

const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);


const sortContracts = (list, signedAtField) =>
    [...list].sort((a, b) => Number(!b[signedAtField]) - Number(!a[signedAtField]) || byNewest(a, b));


function toSignError(err) {
    const body = err.body ?? {};

    if (err.status === HTTP.BAD_REQUEST) {

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

    const [status, setStatus] = useColorFilter("status", CONTRACT_COLORS);

    const fetchContracts = useCallback(async () => {
        return selectedSession ? getContracts(selectedSession.id) : null;
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
            filterColor={status}
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
