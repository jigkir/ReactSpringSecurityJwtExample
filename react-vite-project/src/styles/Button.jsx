import {CV_BUTTON_BASE, CV_BUTTON_TONES} from './appStyles.jsx';

export function useButtonClasses(dark) {
    const btnTone = dark ? CV_BUTTON_TONES.dark : CV_BUTTON_TONES.light;
    return {btn: CV_BUTTON_BASE, btnTone};
}

const Button = ({tone = "neutral", dark, className = "", children, ...rest}) => {
    const {btn, btnTone} = useButtonClasses(dark);
    return (
        <button className={`${btn} ${btnTone[tone]} ${className}`} {...rest}>
            {children}
        </button>
    );
};

export default Button;