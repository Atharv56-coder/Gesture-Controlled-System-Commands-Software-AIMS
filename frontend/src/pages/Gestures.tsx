import { useState, useEffect } from 'react';
import { Trash2, Camera, Loader, Hand, Zap, Shield, Plus, X, HelpCircle, Target, Brain, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import { API_URL, WS_URL } from '../config/api';

export default function Gestures() {
    const [gestures, setGestures] = useState<string[]>([]);
    const [actions, setActions] = useState<Record<string, { type: string, command: string }>>({});
    const [isRecording, setIsRecording] = useState(false);
    const [newGestureName, setNewGestureName] = useState('');
    const [isCustom, setIsCustom] = useState(false);
    const [customCommand, setCustomCommand] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [livePrediction, setLivePrediction] = useState("Monitoring...");

    useEffect(() => {
        fetchData();

        // Live prediction for the "Test Zone"
        const ws = new WebSocket(`${WS_URL}/ws`);
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setLivePrediction(data.prediction);
            } catch (e) {
                console.error(e);
            }
        };
        return () => ws.close();
    }, []);

    const fetchData = async () => {
        try {
            const [gRes, aRes] = await Promise.all([
                fetch(`${API_URL}/gestures`),
                fetch(`${API_URL}/actions`)
            ]);
            const gData = await gRes.json();
            const aData = await aRes.json();
            setGestures(gData.gestures);
            setActions(aData);
        } catch (error) {
            console.error("Failed to fetch data", error);
            toast.error("Failed to load data");
        }
    };

    const handleRecord = async () => {
        const label = newGestureName;
        if (!label) return;

        setIsRecording(true);
        const toastId = toast.loading("Initializing neural record...");
        try {
            await fetch(`${API_URL}/actions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    label: label,
                    action_type: isCustom ? 'custom' : 'predefined',
                    command: isCustom ? customCommand : newGestureName.toLowerCase().replace(' ', '_'),
                }),
            });

            await fetch(`${API_URL}/gestures/record`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label: label, num_frames: 40 }),
            });

            toast.loading("Capturing motion... Stay steady.", { id: toastId });

            setTimeout(() => {
                setIsRecording(false);
                setIsAdding(false);
                setNewGestureName('');
                setCustomCommand('');
                fetchData();
                toast.success("Pattern integrated successfully!", { id: toastId });
            }, 4500);

        } catch (error) {
            console.error("Failed to start recording", error);
            setIsRecording(false);
            toast.error("Protocol failed. Check engine status.", { id: toastId });
        }
    };

    const handleDelete = async (label: string) => {
        try {
            const res = await fetch(`${API_URL}/gestures/${encodeURIComponent(label)}`, { method: 'DELETE' });
            if (res.ok) {
                fetchData();
                toast.success(`Pattern purged from core`);
            }
        } catch (error) {
            console.error("Failed to delete gesture", error);
            toast.error("Erasure failed");
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-10">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6"
            >
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
                            Neural Mapping
                        </div>
                        <button
                            onClick={() => setShowHelp(true)}
                            className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                        >
                            <HelpCircle size={10} />
                            How to Train
                        </button>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter mb-4">
                        Gesture <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Glossary</span>
                    </h1>
                    <p className="text-slate-500 text-lg max-w-2xl font-medium leading-relaxed">
                        Train the core engine with new patterns and link them to system protocols.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Test Zone */}
                    <div className="hidden lg:flex items-center gap-4 px-6 py-3 bg-slate-900/50 rounded-2xl border border-white/5 ring-1 ring-white/5">
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                            <Target size={16} />
                        </div>
                        <div>
                            <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Live Test Zone</span>
                            <span className="block text-sm font-black text-white tracking-tight uppercase">
                                {livePrediction === 'No Hand' ? 'Scanning...' : livePrediction}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 ${isAdding ? 'bg-slate-800 text-slate-400' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25'}`}
                    >
                        {isAdding ? <X size={20} /> : <Plus size={20} />}
                        {isAdding ? 'Cancel Mapping' : 'Integrate New Pattern'}
                    </button>
                </div>
            </motion.div>

            {/* Help Modal */}
            <AnimatePresence>
                {showHelp && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="glass-premium p-10 rounded-[3rem] border border-white/10 max-w-2xl w-full relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none" />

                            <button
                                onClick={() => setShowHelp(false)}
                                className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors border border-white/5 text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>

                            <div className="space-y-8 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                                        <Brain className="text-white" size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white tracking-tight">Onboarding Protocol</h2>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mastering Gesture Neural Mapping</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { title: "Stable Feed", desc: "Ensure your hand is clearly visible in the camera before initiating a scan.", icon: Camera },
                                        { title: "Movement Sustain", desc: "Hold the gesture perfectly still for 4 seconds during the integration phase.", icon: Activity },
                                        { title: "Standard Mapping", desc: "Use registry actions for common tasks like volume and media control.", icon: Zap },
                                        { title: "Custom Scripts", icon: Shield, desc: "Bind any terminal command or application path to your unique patterns." }
                                    ].map((step, i) => (
                                        <div key={i} className="p-5 bg-slate-900/40 rounded-3xl border border-white/5 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <step.icon size={14} className="text-blue-400" />
                                                <h3 className="text-xs font-black text-white uppercase tracking-widest">{step.title}</h3>
                                            </div>
                                            <p className="text-[11px] font-medium text-slate-500 leading-relaxed">{step.desc}</p>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setShowHelp(false)}
                                    className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-400 hover:text-white transition-all shadow-xl shadow-white/5"
                                >
                                    Understood
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -20, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="glass-premium p-8 rounded-[2.5rem] border border-white/5 space-y-8">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-black text-white tracking-tight">Configuration Profile</h2>
                                <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-white/5">
                                    <button
                                        onClick={() => setIsCustom(false)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isCustom ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Standard
                                    </button>
                                    <button
                                        onClick={() => setIsCustom(true)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isCustom ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Custom Script
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col lg:flex-row gap-4">
                                {isCustom ? (
                                    <>
                                        <div className="flex-1 space-y-2">
                                            <span className="text-[10px] font-black text-slate-500 uppercase px-1">Pattern Identifier</span>
                                            <input
                                                type="text"
                                                placeholder="e.g., Launch Terminal"
                                                value={newGestureName}
                                                onChange={(e) => setNewGestureName(e.target.value)}
                                                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-slate-700"
                                            />
                                        </div>
                                        <div className="flex-[2] space-y-2">
                                            <span className="text-[10px] font-black text-slate-500 uppercase px-1">System Executable</span>
                                            <input
                                                type="text"
                                                placeholder="e.g., cmd.exe /c start ..."
                                                value={customCommand}
                                                onChange={(e) => setCustomCommand(e.target.value)}
                                                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-4 text-white font-mono focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-slate-700"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 space-y-2">
                                        <span className="text-[10px] font-black text-slate-500 uppercase px-1">Action Registry</span>
                                        <select
                                            value={newGestureName}
                                            onChange={(e) => setNewGestureName(e.target.value)}
                                            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
                                        >
                                            <option value="" disabled>Inquire Action...</option>
                                            <option value="Volume Up">Volume Up</option>
                                            <option value="Volume Down">Volume Down</option>
                                            <option value="Mute">Mute</option>
                                            <option value="Unmute">Unmute</option>
                                            <option value="Play">Play</option>
                                            <option value="Pause">Pause</option>
                                            <option value="Next Track">Next Track</option>
                                            <option value="Previous Track">Previous Track</option>
                                            <option value="Screenshot">Screenshot</option>
                                            <option value="Tab Switch">Tab Switch</option>
                                            <option value="Neutral">Neutral (Monitor Only)</option>
                                        </select>
                                    </div>
                                )}
                                <div className="flex flex-col justify-end">
                                    <button
                                        onClick={handleRecord}
                                        disabled={isRecording || !newGestureName || (isCustom && !customCommand)}
                                        className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 transition-all ${isRecording
                                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-none'
                                            : isCustom
                                                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                            }`}
                                    >
                                        {isRecording ? <Loader className="animate-spin w-5 h-5" /> : <Camera className="w-5 h-5 fill-white/10" />}
                                        {isRecording ? 'Syncing...' : 'Initiate Scan'}
                                    </button>
                                </div>
                            </div>

                            {isRecording && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20 flex items-center gap-4"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                    <p className="text-sm font-bold text-amber-500 uppercase tracking-widest">
                                        Optical Sensors Active: Sustain gesture pattern for 4 seconds...
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Gestures List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {gestures.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full p-20 glass-premium rounded-[3rem] border border-white/5 flex flex-col items-center justify-center text-center space-y-6"
                        >
                            <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center ring-1 ring-white/5">
                                <Hand className="w-10 h-10 text-slate-700" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white">Registry Empty</h3>
                                <p className="text-slate-500 mt-1 max-w-xs font-medium">No neural patterns have been integrated into the engine.</p>
                            </div>
                        </motion.div>
                    ) : (
                        gestures.map((gesture, index) => (
                            <motion.div
                                key={gesture}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="glass-card p-6 rounded-[2rem] flex flex-col group relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Profile 0{index + 1}</span>
                                        <h3 className="text-xl font-black text-white tracking-tight">{gesture}</h3>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(gesture)}
                                        className="p-3 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all border border-transparent hover:border-red-400/20"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5 group-hover:bg-slate-950/80 transition-colors relative z-10">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                                        <span className="text-slate-500">Protocol</span>
                                        <span className={`px-2 py-0.5 rounded-lg border ${actions[gesture]?.type === 'custom' ? 'border-purple-500/30 text-purple-400' : 'border-blue-500/30 text-blue-400'}`}>
                                            {actions[gesture]?.type || 'Standard'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${actions[gesture]?.type === 'custom' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                            {actions[gesture]?.type === 'custom' ? <Zap size={14} /> : <Shield size={14} />}
                                        </div>
                                        <p className="text-sm font-bold text-slate-300 truncate font-mono">
                                            {actions[gesture]?.command || 'No link established'}
                                        </p>
                                    </div>
                                </div>

                                {/* Decoration */}
                                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500/5 blur-3xl group-hover:bg-blue-500/10 transition-colors" />
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
