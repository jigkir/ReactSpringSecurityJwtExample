/**
 * SignContractForm.jsx — Inline form to sign a contract (manager, employer or student).
 *
 * The signer must tick "I accept the terms of the contract" and confirm with the password of
 * their account. Nothing is sent when the box is unticked or the password is empty.
 * In Dev mode the password field is hidden (the dev endpoint needs no password).
 *
 * `onSubmit({termsAccepted, password})` returns {success: true} or
 * {success: false, message: {key, options?}} (translated here with translateWarning).
 * On success the form closes itself; on failure it keeps the box ticked and clears the password.
 *
 * Password problems (empty or incorrect password) are shown under the password field;
 * every other problem is shown in the banner at the top of the form.
 *
 * Props
 *   dark      boolean
 *   devMode   boolean   hides the password field
 *   onSubmit  function  async ({termsAccepted, password}) => {success, message?}
 *   onClose   function  closes the form
 */

import SignForm from "../../shared/documents/SignForm.jsx";

function SignContractForm(props) {
    return <SignForm {...props} i18nPrefix="managerContracts" fallbackErrorKey="managerContracts.actionFailed"/>;
}

export default SignContractForm;
