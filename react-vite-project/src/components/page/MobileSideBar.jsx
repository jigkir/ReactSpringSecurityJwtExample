import { NavLink } from 'react-router-dom';
import Icon from '../../styles/Icon.jsx';
import {forwardRef} from "react";

const MobileSidebar = forwardRef(function MobileSidebar({ isOpen, onClose, navItems, dark, t, mobileLinkClass }, ref) {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop Overlay */}
            <div
                className="fixed inset-0 h-screen w-screen bg-black/75 backdrop-blur-sm z-50 animate-fade-in"
                onClick={onClose}
            />

            {/* Slide-out Panel */}
            <div ref={ref} className={`fixed inset-y-0 left-0  w-[50vw] z-50 shadow-2xl flex flex-col overflow-hidden animate-slide-in ${dark ? "bg-blue-950" : "bg-violet-100"}`}>
                {/* Header inside side menu */}
                <div className={`flex items-center justify-between pb-4 mb-4 -mx-1 -mt-1 pl-5 pt-4 ${dark ? "bg-slate-800/95" : "bg-indigo-600"}`}>
                    <span className={`font-bold text-2xl tracking-tight text-white`}>
                        <div className="flex items-center font-extrabold text-2xl tracking-tight select-none group cursor-pointer">
                                        {/* Always light text for dark-colored navbars */}
                            <span className="text-white transition-colors duration-150">
                                Intern
                            </span>
                            {/* TLD Badge adapted for dark backgrounds */}
                            <span className={`ml-1 px-1.5 py-0.5 rounded-md text-2xl font-bold transition-all duration-150 group-hover:scale-105 whitespace-nowrap ${
                                dark
                                    ? "bg-indigo-500/20 text-indigo-600 border border-indigo-700/30 group-hover:bg-indigo-500/30"
                                    : "bg-indigo-500/10 text-indigo-200 border border-indigo-400/30 group-hover:bg-indigo-500/20"
                            }`}>
                                . ly
                            </span>
                        </div>
                    </span>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-red-600"
                        aria-label="Close menu"
                    >
                        <Icon name="close" size={24} />
                    </button>
                </div>

                {/* Navigation Links */}
                <div>
                    <nav className="flex flex-col gap-4 font-semibold">
                        {navItems.map(({ to, label, end }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={end}
                                className={mobileLinkClass}
                            >
                                {label}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </div>
        </>
    );
});

export default MobileSidebar;