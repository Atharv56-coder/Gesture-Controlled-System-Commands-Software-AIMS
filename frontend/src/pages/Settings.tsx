import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Sliders, Globe, Lock } from 'lucide-react';

export default function Settings() {
    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-10">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="px-3 py-1 bg-slate-500/10 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5">
                        System Configuration
                    </div>
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter mb-4">
                    Global <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Settings</span>
                </h1>
                <p className="text-slate-500 text-lg max-w-2xl font-medium leading-relaxed">
                    Adjust the neural engine sensitivity and system-wide protocols.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                    { title: "Engine Sensitivity", icon: Sliders, desc: "Calibrate gesture detection threshold for accuracy." },
                    { title: "Network Protocols", icon: Globe, desc: "Manage WebSocket synchronization and API endpoints." },
                    { title: "Security Layers", icon: Lock, desc: "Encrypt neural data and secure system commands." },
                    { title: "Main Controller", icon: SettingsIcon, desc: "General application behavior and interface settings." }
                ].map((item, i) => (
                    <motion.div
                        key={item.title}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * i }}
                        className="glass-card p-6 rounded-[2.5rem] border border-white/5 group hover:bg-slate-900/50 transition-all cursor-not-allowed"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center border border-white/5 text-slate-500 group-hover:text-blue-400 transition-colors">
                                <item.icon size={20} />
                            </div>
                            <h3 className="text-lg font-black text-white tracking-tight">{item.title}</h3>
                        </div>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed">
                            {item.desc}
                        </p>
                        <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-600">Module Lock</span>
                            <span className="text-slate-700">v1.2.0</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="p-8 glass-premium rounded-[2.5rem] border border-white/5 text-center"
            >
                <div className="inline-flex px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">
                    Advanced Access Required
                </div>
                <p className="text-slate-500 font-medium italic">
                    "Fine-tuning of neural parameters is locked to prevent core instability."
                </p>
            </motion.div>
        </div>
    );
}
