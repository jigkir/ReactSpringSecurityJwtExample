import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import fetcher from "../../utils/fetcher.js";
import {useTranslation} from 'react-i18next';

const GestionnaireHome = () => {
  const [message, setMessage] = useState("");
  const {dark} = useOutletContext();
    const { t } = useTranslation();

    const handleAccessGestionnaireEndpoint = () => {
    setMessage("");
    fetcher("/user/gestionnaire/demo", { method: "GET" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(t("arror.apiError")` (${response.status})`);
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
      <h1>{t("managerPage.pageInfo")}</h1>
      <button style={{ width: 'fit-content' }} onClick={handleAccessGestionnaireEndpoint}>
          {t("managerPage.buttonInfo")}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
export default GestionnaireHome;