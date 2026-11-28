


import SignForm from "../../shared/documents/SignForm.jsx";

function SignContractForm(props) {
    return <SignForm {...props} i18nPrefix="managerContracts" fallbackErrorKey="managerContracts.actionFailed"/>;
}

export default SignContractForm;
