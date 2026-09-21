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
                        error401:'Not authorized',
                        error404:'No server available',
                        errorGeneric:'Not ok',
                        errorUserFetchFail:'Failed to fetch user info',
                        role:"Role",
                        student: "Student",
                        teacher: "Teacher",
                        manager: "Manager",
                        email: "Email",
                        password:"Password",
                        submit:"Sign in",
                        noAccount:"No account yet?",
                        signUpButton:"Sign up",
                    },
                    student:{
                        existingId:"This student ID is already in use.",
                        emailInUse: "This email address is already in use.",
                        eitherEmailOrIdInUse:"An account with this student ID or email already exists.",
                        invalidData:"The submitted data is invalid. Please review the fields.",
                        genericServerErrorPt1:"Server error ",
                        genericServerErrorPt2:". Please try again.",
                        unableToReachServerError:"Unable to reach the server. Please try again.",
                        accountCreationButton:"Create account",
                        accountCreationButtonLoading:"Creating account…",
                    },
                    commonFields:{
                        loading:'Loading…',
                        fetchError:'Failed to load',
                        selectRoleText:'-- Select a {{selectType}} --',
                        disciplineSelect:'Please select a discipline.',
                        requiredId:'ID is required.',
                        requiredIdLength:"ID must be exactly {{length}} digits.",
                        requiredField:"This field is required.",
                        atLeastXCharacters:"Must be at least {{amount}} characters.",
                        atMostXCharacters:"Must be at most {{amount}} characters.",
                        nameRequirements:'Must contain at least one letter. Only letters, spaces, hyphens, apostrophes and periods are allowed.',
                        requiredEmail:'Email address is required.',
                        invalidEmailFormat:'Invalid email format.',
                        requiredPassword:'Password is required.',
                        mustNotContainSpaces:'Must not contain spaces.',
                        missingDigit:"one digit",
                        missingLowercaseLetter:'one lowercase letter',
                        missingUppercaseLetter:'one uppercase letter',
                        missingSpecialCharacter:'one special character',
                        missingConfirmPassword:'Please confirm your password.',
                        noMatchingPasswords:'Passwords do not match.',
                        text:"text",
                        password:"Password",
                        hidePassword:"Hide password",
                        showPassword:"Show password",
                        hideConfirmation:'Hide confirmation',
                        showConfirmation:'Show confirmation',
                    }
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
                        error401:'Non autorisé',
                        error404:'Aucun serveur disponible',
                        errorGeneric:"Ce n'est pas bon",
                        errorUserFetchFail:'Échec de la récupération des renseignements',
                        role:"Role",
                        student: "Student",
                        teacher: "Teacher",
                        manager: "Manager",
                        email: "Email",
                        password:"Password",
                        submit:"Sign in",
                        noAccount:"No account yet?",
                        signUpButton:"Sign up",
                    },
                    student:{
                        existingId:"This student ID is already in use.",
                        emailInUse: "This email address is already in use.",
                        eitherEmailOrIdInUse:"An account with this student ID or email already exists.",
                        invalidData:"The submitted data is invalid. Please review the fields.",
                        genericServerErrorPt1:"Server error ",
                        genericServerErrorPt2:". Please try again.",
                        unableToReachServerError:"Unable to reach the server. Please try again.",
                        accountCreationButton:"Create account",
                        accountCreationButtonLoading:"Creating account…",
                    },
                    commonFields:{

                    }
                }
            }
        }
    });

export default i18n;