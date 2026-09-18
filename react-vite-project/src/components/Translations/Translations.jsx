import i18next from 'i18next'
import {initReactI18next} from 'react-i18next'

i18next
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        lng: 'en',
        resources: {
            en:{
                translations: {
                    maincontainer:{
                        title: "Example of Spring Security with JWT",
                        subtitle: "In this example, you'll find everything you need to implement security using JWT tokens"
                    },
                    title: "Example of Spring Security with JWT",
                }
            },
            fr:{
                translations: {
                    mainContainer:{
                        title: "Example de Spring security avec JWT",
                        subtitle: "Dans cet exemple, vous trouverez le nécessaire pour implanter la sécurité avec des tokens JWT"
                    }
                }
            }
        }
    });