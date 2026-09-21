import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import fetcher from "../../utils/fetcher.js";
import {useTranslation} from 'react-i18next';

const EmprunteurHome = () => {
  const [message, setMessage] = useState("");
  const {dark} = useOutletContext();
  const { t } = useTranslation();

  const handleAccessGestionnaireEndpoint = () => {
    setMessage("");
    fetcher("/user/gestionnaire/demo", { method: "GET" })
      .then(async (response) => {
        if (response.status === 403) {
          throw new Error(t("error.accessRefused"));
        }
        if (!response.ok) {
          throw new Error(t("error.apiError")` (${response.status})`);
        }
        const data = await response.text();
        setMessage(data);
      })
      .catch((error) => {
        setMessage(error.message);
      });
  };

  return(
    <div className={dark ? 'text-white' : 'text-gray-900'}>
      <h1>{t("borrowerPage.pageInfo")}</h1>
      <button style={{ width: 'fit-content' }} onClick={handleAccessGestionnaireEndpoint}>
          {t("borrowerPage.buttonInfo")}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
export default EmprunteurHome;