import {CV_BUTTON_BASE, CV_BUTTON_TONES} from './AppStyles.jsx';
import Icon from './Icon.jsx';

export function useButtonClasses(dark) {
    const btnTone = dark ? CV_BUTTON_TONES.dark : CV_BUTTON_TONES.light;
    return {btn: CV_BUTTON_BASE, btnTone};
}

// tone: neutral | accent | danger | success      icon: Material Symbols name (optional)
const Button = ({tone = "neutral", dark, icon, className = "", children, ...rest}) => {
    const {btn, btnTone} = useButtonClasses(dark);
    return (
        <button className={`${btn} ${btnTone[tone]} ${className}`} {...rest}>
            {icon && <Icon name={icon} size={18}/>}
            {children}
        </button>
    );
};

export default Button;