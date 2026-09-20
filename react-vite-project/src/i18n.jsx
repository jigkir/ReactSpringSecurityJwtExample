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
                    error:{
                        accessRefused: "Access denied: endpoint reserved for the manager (403).",
                        apiError: "API error"
                    },
                    footer:{
                        copyright:"Copyright © 2026",
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
                    managerPage:{
                        pageInfo:"Manager home page",
                        buttonInfo:"Access the manager endpoint",
                    },
                    borrowerPage:{
                        pageInfo:"Borrower home page",
                        buttonInfo:"Access the manager endpoint",
                    },
                    attendantPage:{
                        pageInfo:"Attendant home page",
                        buttonInfo:"Access the manager endpoint",
                    },
                    signup:{
                        signupInfo:"Create an account",
                        noSignup:"No signup form available for this role yet.",
                        signupFormConfirm:"Sign in",
                    },
                    login:{

                    },
                }
            },
            fr:{
                translation: {
                    about:{
                        version:"Version 1.0.0",
                        backLabel:"Retour"
                    },
                    error:{
                        accessRefused: "Accès refusé: endpoint réservé au gestionnaire (403).",
                        apiError: "Erreur API"
                    },
                    footer:{
                        copyright:"Copyright © 2026",
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
                        login:"Connecter",
                        signup:"S'enregistrer",
                    },
                    managerPage:{
                        pageInfo:"Page accueil gestionnaire",
                        buttonInfo:"Accéder à l'endpoint gestionnaire",
                    },
                    borrowerPage:{
                        pageInfo:"Page accueil emprunteur",
                        buttonInfo:"Accéder à l'endpoint gestionnaire",
                    },
                    attendantPage:{
                        pageInfo:"Page accueil prepose",
                        buttonInfo:"Accéder à l'endpoint gestionnaire",
                    },
                    signup:{
                        signupInfo:"Créer un compte",
                        noSignup:"Aucun formulaire d'inscription n'est disponible pour ce rôle.",
                        signupFormConfirm:"Se Connecter",
                    },
                    login:{

                    },
                }
            }
        }
    });

export default i18n;