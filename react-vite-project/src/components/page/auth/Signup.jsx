import {useEffect, useState} from 'react';
import {useNavigate, useOutletContext} from 'react-router-dom';
import {getAuthClasses} from '../../../styles/appStyles.jsx';
import {RoleField, translateWarning} from '../../../utils/CommonFields.jsx';
import {getRoles} from '../../api/Api.jsx';
import Student from './signup/Student.jsx';
import Employer from './signup/Employer.jsx';
import Teacher from './signup/Teacher.jsx';
import {useTranslation} from 'react-i18next';

// Roles that are allowed to self-register — MANAGER are login-only
const SIGNUP_ROLES = ['student', 'employer', 'teacher'];

// UPDATE THIS MAP when you add a new signup form component:
// key must match the lowercase role value returned by the backend
const ROLE_COMPONENTS = (classes) => ({
    student: <Student {...classes} />,
    employer: <Employer {...classes} />,
    teacher: <Teacher {...classes} />,
});

const Signup = () => {
    const navigate = useNavigate();
    const {dark} = useOutletContext();

    const [role, setRole] = useState('');
    const [roles, setRoles] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [rolesFetchError, setRolesFetchError] = useState('');

    const classes = getAuthClasses(dark);
    const {fieldClass, labelClass, cardClass, pageClass, titleClass, subtextClass} = classes;

    const {t} = useTranslation();

    useEffect(() => {
        getRoles()
            .then((list) => {
                const mapped = list
                    .map((r) => r.toLowerCase())
                    .filter((r) => SIGNUP_ROLES.includes(r));
                setRoles(mapped);
                if (mapped.length > 0) setRole(mapped[0]);
            })
            .catch(() => setRolesFetchError({key: "signup.couldNotLoadRoles"}))
            .finally(() => setRolesLoading(false));
    }, []);

    const roleComponents = ROLE_COMPONENTS(classes);

    return (
        <div className={pageClass}>
            <div className={cardClass}>
                <h1 className={titleClass}>{t("signup.signupInfo")}</h1>

                <div className="mb-4">
                    <RoleField
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        options={roles}
                        loading={rolesLoading}
                        fetchError={translateWarning(t, rolesFetchError)}
                        labelClass={labelClass}
                        errorClass={classes.errorClass}
                        fieldClass={fieldClass}
                        label={t("commonFields.role")}
                    />
                </div>

                {role && (roleComponents[role] ?? (
                    <p className={classes.errorClass}>
                        {t("signup.noSignup")}
                    </p>
                ))}

                <p className={subtextClass}>
                    {t("signup.alreadyHaveAnAccount")}{' '}
                    <button onClick={() => navigate('/login')} className="text-blue-500 hover:underline font-medium">
                        {t("signup.signupFormConfirm")}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Signup;