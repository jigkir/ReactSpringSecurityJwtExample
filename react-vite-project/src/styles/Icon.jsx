// Material Icons : https://fonts.google.com/icons

const Icon = ({name, size = 24, filled = false, className = "", ...rest}) => (
    <span
        className={`material-symbols-outlined ${className}`}
        style={{fontSize: size, fontVariationSettings: `'FILL' ${filled ? 1 : 0}`}}
        aria-hidden="true"
        {...rest}
    >
        {name}
    </span>
);

export default Icon;