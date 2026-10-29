import {CV_BUTTON_BASE, CV_BUTTON_LIFT, CV_BUTTON_SIZES, CV_BUTTON_TONES} from './AppStyles.jsx';
import Icon from './Icon.jsx';

// tone: neutral | accent | danger | success      icon: Material Symbols name (optional)
export const ICON_TONES = {
    check_circle: "success",
    check: "success",
    send: "success",
    close: "danger",
    delete: "danger",
    visibility: "accent",
    event: "accent",
    edit: "warning",
};

// Arrow icons slide on hover (the Button is a `group`, see CV_BUTTON_BASE)
const ICON_MOTION = {
    arrow_forward: "transition-transform group-hover:translate-x-1",
    arrow_back: "transition-transform group-hover:-translate-x-1",
};

const Button = ({
                    as: Component = "button",
                    tone = "neutral",
                    lockTone = false,
                    size = "sm",
                    dark,
                    icon,
                    className = "",
                    children,
                    ...rest
                }) => {
    const tones = dark ? CV_BUTTON_TONES.dark : CV_BUTTON_TONES.light;
    const resolvedTone = lockTone ? tone : (ICON_TONES[icon] ?? tone);
    const lift = resolvedTone === "ghost" ? "" : CV_BUTTON_LIFT;
    const classes = [CV_BUTTON_BASE, CV_BUTTON_SIZES[size], tones[resolvedTone], lift, className]
        .filter(Boolean)
        .join(" ");

    return (
        <Component className={classes} {...rest}>
            {icon && <Icon name={icon} size={18} className={ICON_MOTION[icon] ?? ""}/>}
            {children}
        </Component>
    );
};

export default Button;