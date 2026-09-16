import React from "react";
import { useOutletContext } from "react-router-dom";

function MainContainer() {
  const {dark} = useOutletContext();
  return (
    <div className={`maincontainer ${dark ? 'text-white' : 'text-gray-900'}`}>
      <h1>Example de Spring security avec JWT</h1>
      <p>Dans cet exemple, vous trouverez le nécessaire pour implanter la sécurité avec des tokens JWT</p>
    </div>
  );
}
export default MainContainer;