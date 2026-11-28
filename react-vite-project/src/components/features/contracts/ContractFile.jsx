


import {useMemo} from "react";
import {useOutletContext, useParams} from "react-router-dom";
import {getContractFile} from "../../shared/core/api/Api.jsx";
import {TARGET_TYPE, useCloseShownNotifications} from "../../shared/notification/NotificationsProvider.jsx";
import {getContractRole} from "../../../utils/roles/ContractRole.js";
import PdfFilePage from "../../shared/documents/PdfFilePage.jsx";

const ContractFile = () => {
    const {dark, user} = useOutletContext();
    const {id} = useParams();
    const {basePath} = getContractRole(user);
    const contractId = Number(id);
    const shownIds = useMemo(() => [contractId], [contractId]);
    useCloseShownNotifications(TARGET_TYPE.CONTRACT, shownIds);
    return (
        <PdfFilePage
            dark={dark} id={contractId} backTo={basePath}
            titleKey="managerContracts.file.title" subtitleKey="managerContracts.file.subtitle"
            backKey="managerContracts.file.back" docType="contract"
            fetchFile={getContractFile}
        />
    );
};

export default ContractFile;
