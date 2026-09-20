import React from "react";
import { useOutletContext } from "react-router-dom";
import {useTranslation} from 'react-i18next';

function MainContainer() {
    const { t } = useTranslation();
  const {dark} = useOutletContext();
  return (
    <div className={`maincontainer ${dark ? 'text-white' : 'text-gray-900'}`}>
      <h1>{t('mainContainer.title')}</h1>
      <p>{t('mainContainer.subtitle')}</p>
    </div>
  );
}
export default MainContainer;