import React from "react";
import { Link, useOutletContext } from 'react-router-dom';
import {useTranslation} from 'react-i18next';

function About() {
    const { t } = useTranslation();
  const {dark} = useOutletContext();
  return (
    <div className={dark ? 'text-white' : 'text-gray-900'}>
      <h4>{t("about.version")}</h4>
      <Link to='/'>{t("about.backLabel")}</Link>
    </div>
  );
}
export default About;
