import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    // detect user language
    // learn more: https://github.com/i18next/i18next-browser-languageDetector
    .use(LanguageDetector)
    // pass the i18n instance to react-i18next.
    .use(initReactI18next)
    // init i18next
    // for all options read: https://www.i18next.com/overview/configuration-options
    .init({
        debug: true,
        fallbackLng: 'en',
        resources: {
            en: {
                translation: {
                    about:{
                        version:"Version 1.0.0",
                        backLabel:"Go Back"
                    },
                    errorPage:{

                    },
                    footer:{
                        copyright:"Copyright © 2021",
                        about:"About",
                    },
                    mainContainer:{
                        title: "Example of Spring Security with JWT",
                        subtitle: "In this example, you'll find everything you need to implement security using JWT tokens"
                    },
                    navbar:{
                        appName:"My App",
                        acceuil:"Home",
                        about:"About",
                        emprunteur:"Borrower",
                        prepose:"Attendant",
                        gestionnaire:"Manager",
                        lightmode:"Light",
                        darkmode:"Dark",
                        disconnect:"Disconnect",
                        login:"Login",
                        signup:"Sign Up",
                        switchFench:"FR",
                        switchEnglish:"EN",
                    },
                }
            },
            fr:{
                translation: {
                    about:{
                        version:"Version 1.0.0",
                        backLabel:"Retour"
                    },
                    errorPage:{

                    },
                    footer:{
                        copyright:"Copyright © 2021",
                        about:"À propos",
                    },
                    mainContainer:{
                        title: "Exemple de Spring security avec JWT",
                        subtitle: "Dans cet exemple, vous trouverez le nécessaire pour implanter la sécurité avec des tokens JWT"
                    },
                    navbar:{
                        appName:"My App",
                        acceuil:"Acceuil",
                        about:"À propos",
                        emprunteur:"Emprunteur",
                        prepose:"Préposé",
                        gestionnaire:"Gestionnaire",
                        lightmode:"Clair",
                        darkmode:"Sombre",
                        disconnect:"Déconnection",
                        login:"Login",
                        signup:"S'enregistrer",
                    },
                }
            }
        }
    });

export default i18n;