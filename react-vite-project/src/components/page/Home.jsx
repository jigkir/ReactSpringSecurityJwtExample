import {useOutletContext} from 'react-router-dom';
import {getHomeClasses} from '../../styles/AppStyles.jsx';
import {useTranslation} from 'react-i18next';

const Home = () => {
    const {dark, user} = useOutletContext();
    const classes = getHomeClasses(dark);
    const {t} = useTranslation();

    const role = (user?.role ?? "").toString().replace("ROLE_", "");

    const homeByRole = () => {
        switch (role) {
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