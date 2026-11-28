


const Badge = ({children, bounce = true, className = ""}) => (
    <span
        className={`px-4 py-1.5 text-sm font-bold uppercase tracking-wide shadow-md bg-indigo-500 text-white rounded-full ${bounce ? "animate-bounce motion-reduce:animate-none" : ""} ${className}`}>
        {children}
    </span>
);

export default Badge;
