import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Home, Hand, Settings, Activity, Zap } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const sidebarVariants: Variants = {
    hidden: { x: -280, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 20
        }
    },
};

const itemVariants: Variants = {
    hover: { x: 5, color: '#38bdf8' },
};

export default function Sidebar() {
    const navItems = [
        { name: 'Dashboard', icon: Home, path: '/' },
        { name: 'Gestures', icon: Hand, path: '/gestures' },
        { name: 'Training', icon: Activity, path: '/training' },
        { name: 'Settings', icon: Settings, path: '/settings' },
    ];

    return (
        <motion.aside
            initial="hidden"
            animate="visible"
            variants={sidebarVariants}
            className="w-72 h-[calc(100vh-2rem)] glass-premium fixed left-4 top-4 z-50 flex flex-col p-6 rounded-3xl m-0"
        >
            <div className="mb-10 px-2 flex items-center space-x-3 group cursor-default">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:rotate-12 transition-transform duration-300">
                    <Zap className="text-white w-6 h-6 fill-white" />
                </div>
                <div>
                    <h1 className="text-xl font-black tracking-tight text-white leading-none">
                        GESTURE<span className="text-blue-400">FLOW</span>
                    </h1>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">System Controller</span>
                </div>
            </div>

            <nav className="flex-1 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            `group flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 relative ${isActive
                                ? 'text-blue-400 bg-blue-500/5'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <motion.div
                                        layoutId="active-nav"
                                        className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}
                                <motion.div variants={itemVariants} whileHover="hover" className="flex items-center space-x-3 w-full">
                                    <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-400' : 'group-hover:text-blue-400'}`} />
                                    <span className="font-semibold text-sm tracking-wide">{item.name}</span>
                                </motion.div>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="pt-6 border-t border-white/5">
                <div className="flex items-center space-x-3 px-4 py-4 rounded-2xl bg-slate-900/40 border border-white/5">
                    <div className="relative">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Engine Status</span>
                        <span className="text-xs font-bold text-emerald-400">Core Sync: Active</span>
                    </div>
                </div>
            </div>
        </motion.aside>
    );
}
