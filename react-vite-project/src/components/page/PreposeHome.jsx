import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import fetcher from "../../utils/fetcher.js";

const PreposeHome = () => {
  const [message, setMessage] = useState("");
  const {dark} = useOutletContext();

  const handleAccessGestionnaireEndpoint = () => {
    setMessage("");
    fetcher("/user/gestionnaire/demo", { method: "GET" })
      .then(async (response) => {
        if (response.status === 403) {
          throw new Error("Accès refusé: endpoint réservé au gestionnaire (403).");
        }
        if (!response.ok) {
          throw new Error(`Erreur API (${response.status})`);
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
      <h1>Page accueil prepose</h1>
      <button style={{ width: 'fit-content' }} onClick={handleAccessGestionnaireEndpoint}>
        Accéder à l'endpoint gestionnaire
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
export default PreposeHome;