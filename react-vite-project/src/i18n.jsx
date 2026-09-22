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
                    cvDocuments:{
                        title:"Uploaded Documents",
                        addBtn:"Add a CV",
                        docType:"Curriculum vitae",
                        uploadedOn:"uploaded on",
                        scopePublic:"Shared with supervisors",
                        scopePrivate:"Visible to you only",
                        makePublic:"Share",
                        makePrivate:"Make private",
                        viewBtn:"Preview",
                        hideBtn:"Hide",
                        hideAsk:"Hide this CV? It will no longer appear in this list.",
                        confirmBtn:"Confirm",
                        cancelBtn:"Cancel",
                        empty:"No documents uploaded yet.",
                        loadError:"Unable to load your documents.",
                        retryBtn:"Retry",
                        errorAction:"The action failed. Please try again.",
                        previewError:"Preview unavailable (content missing).",
                    },
                    cvUpload:{
                        validation:{
                            noFile:"No file selected.",
                            invalidFormat:"Invalid file format. Please select a PDF file.",
                            tooLarge:"Your file is too large. The maximum allowed size is {{mb}} MB.",
                        },
                        pageTitle:"Upload your CV",
                        pageSubtitle:"Your CV is required to access your dashboard and apply for internship offers.",
                        uploadBtn:"Upload my CV",
                        replaceBtn:"Add a CV",
                        cancelBtn:"Cancel",
                        deleteBtn:"Delete",
                        retryBtn:"Retry",
                        continueBtn:"Go to my dashboard",
                        viewDocsBtn:"View my documents",
                        uploadingLabel:"Uploading…",
                        successMsg:"Your CV has been uploaded successfully.",
                        dragHint:"Drag and drop your CV here or",
                        orBrowse:"browse",
                        acceptedFormats:"Accepted format: PDF",
                        replaceFile:"Replace",
                        maxSize:"Maximum size: {{mb}} MB",
                    },
                    cvPreview:{
                        loading:"Loading document…",
                        error:"Unable to display this document.",
                        newTabBtn:"Open in new tab",
                        closeBtn:"Close",
                    },
                    cv:{
                        goToDashboard:"Go to my dashboard",
                        studentIdMissing:"Student ID not found. Please log out and log back in.",
                        uploadFailed:"Upload failed. Please try again.",
                        fileTooLarge:"Your file is too large. The maximum allowed size is {{mb}} MB.",
                        fileInvalid:"The file appears to be corrupted or invalid. Please select another one.",
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
                    cvDocuments:{
                        title:"Documents déposés",
                        addBtn:"Ajouter un CV",
                        docType:"Curriculum vitae",
                        uploadedOn:"déposé le",
                        scopePublic:"Partagé avec les superviseurs",
                        scopePrivate:"Visible par vous uniquement",
                        makePublic:"Partager",
                        makePrivate:"Rendre privé",
                        viewBtn:"Aperçu",
                        hideBtn:"Masquer",
                        hideAsk:"Masquer ce CV ? Il n'apparaîtra plus dans cette liste.",
                        confirmBtn:"Confirmer",
                        cancelBtn:"Annuler",
                        empty:"Aucun document déposé pour l'instant.",
                        loadError:"Impossible de charger vos documents.",
                        retryBtn:"Réessayer",
                        errorAction:"L'action a échoué. Veuillez réessayer.",
                        previewError:"Aperçu indisponible (contenu manquant).",
                    },
                    cvUpload:{
                        validation:{
                            noFile:"Aucun fichier sélectionné.",
                            invalidFormat:"Format de fichier invalide. Veuillez sélectionner un fichier PDF.",
                            tooLarge:"Votre fichier est trop volumineux. La taille maximale autorisée est de {{mb}} Mo.",
                        },
                        pageTitle:"Téléverser votre CV",
                        pageSubtitle:"Votre CV est nécessaire pour accéder à votre tableau de bord et postuler à des offres de stage.",
                        uploadBtn:"Téléverser mon CV",
                        replaceBtn:"Ajouter un CV",
                        cancelBtn:"Annuler",
                        deleteBtn:"Supprimer",
                        retryBtn:"Réessayer",
                        continueBtn:"Accéder à mon tableau de bord",
                        viewDocsBtn:"Voir mes documents",
                        uploadingLabel:"Téléversement…",
                        successMsg:"Votre CV a été téléversé avec succès.",
                        dragHint:"Glissez-déposez votre CV ici ou",
                        orBrowse:"parcourir",
                        acceptedFormats:"Format accepté : PDF",
                        replaceFile:"Remplacer",
                        maxSize:"Taille maximale : {{mb}} Mo",
                    },
                    cvPreview:{
                        loading:"Chargement du document…",
                        error:"Impossible d'afficher ce document.",
                        newTabBtn:"Ouvrir dans un nouvel onglet",
                        closeBtn:"Fermer",
                    },
                    cv:{
                        goToDashboard:"Accéder à mon tableau de bord",
                        studentIdMissing:"Identifiant étudiant introuvable. Veuillez vous déconnecter et vous reconnecter.",
                        uploadFailed:"Le téléversement a échoué. Veuillez réessayer.",
                        fileTooLarge:"Votre fichier est trop volumineux. La taille maximale autorisée est de {{mb}} Mo.",
                        fileInvalid:"Le fichier semble corrompu ou invalide. Veuillez en sélectionner un autre.",
                    },
                }
            }
        }
    });

export default i18n;