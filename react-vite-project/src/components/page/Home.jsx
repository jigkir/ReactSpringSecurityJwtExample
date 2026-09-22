import {useEffect, useState} from "react";
import {useOutletContext} from "react-router-dom";
import fetcher from "../../utils/fetcher.js";
import {getHomeClasses} from "../../styles/appStyles.jsx";
import {useTranslation} from 'react-i18next';

const Home = () => {
    const {dark} = useOutletContext();
    const classes = getHomeClasses(dark);
    const { t } = useTranslation();

    const [user, setUser] = useState(null);

    useEffect(() => {
        fetcher("users/current", {})
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(t("home.apiError", {status: response.status}));
                }

                const data = await response.json();
                setUser(data);
            })
            .catch((error) => {
                console.error(error);
            });
    }, []);

    const homeByRole = () => {
        switch (user?.role) {
            case "STUDENT":
                return (
                    <div>
                        <h2 className={classes.subhead}>{t("home.roleStudent")}</h2>
                    </div>
                );

            case "TEACHER":
                return (
                    <div>
                        <h2 className={classes.subhead}>{t("home.roleTeacher")}</h2>
                    </div>
                );

            case "EMPLOYER":
                return (
                    <div>
                        <h2 className={classes.subhead}>{t("home.roleEmployer")}</h2>
                    </div>
                );

            case "MANAGER":
                return (
                    <div>
                        <h2 className={classes.subhead}>{t("home.roleManager")}</h2>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className={classes.page}>
            <h1 className={classes.heading}>
                {t("home.welcome")} {user?.firstName || ""}
            </h1>

            {homeByRole()}
        </div>
    );
};

export default Home;