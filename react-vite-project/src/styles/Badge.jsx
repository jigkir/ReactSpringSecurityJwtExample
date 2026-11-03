/**
 * Badge.jsx — The single "New" / unread sticker used across the app
 * (new application, new internship offer, unread count). Bounces by default.
 *
 * Props
 *   bounce     boolean  optional, default true. Pass bounce={false} for a still badge.
 *   className  string   optional extra classes
 */

const Badge = ({children, bounce = true, className = ""}) => (
    <span
        className={`px-4 py-1.5 text-sm font-bold uppercase tracking-wide shadow-md bg-indigo-500 text-white rounded-full ${bounce ? "animate-bounce motion-reduce:animate-none" : ""} ${className}`}>
        {children}
    </span>
);

export default Badge;