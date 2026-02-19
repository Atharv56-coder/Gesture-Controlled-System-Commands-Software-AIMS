import { Activity, Hand, Radio, Clock, Info } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL, WS_URL } from '../config/api';

const StatCard = ({ title, value, icon: Icon, color, delay, tooltip }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="glass-card p-6 rounded-3xl relative overflow-hidden group"
    >
        <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-${color}-500/10 transition-colors duration-500`} />

        <div className="flex justify-between items-start mb-6 relative z-10">
            <div className={`p-4 rounded-2xl bg-${color}-500/10 text-${color}-400 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ring-1 ring-${color}-500/20`}>
                <Icon size={24} />
            </div>
            <div className="group/tooltip relative">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5 cursor-help">
                    <Info size={10} className="text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Info</span>
                </div>
                <div className="absolute right-0 top-full mt-2 w-48 p-3 glass-premium rounded-2xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 border border-white/10 shadow-2xl">
                    <p className="text-[10px] font-bold text-slate-300 leading-tight">
                        {tooltip}
                    </p>
                </div>
            </div>
        </div>

        <div className="relative z-10">
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-[0.1em] mb-1">{title}</h3>
            <div className="text-3xl font-black text-white tracking-tight">{value}</div>
        </div>
    </motion.div>
);

export default function Dashboard() {
    const [prediction, setPrediction] = useState("Initializing...");
    const [isRecording, setIsRecording] = useState(false);
    const [history, setHistory] = useState<{ id: string, label: string, time: string }[]>([]);
    const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
    const lastPredictionRef = useRef("");

    useEffect(() => {
        let ws: WebSocket;
        let reconnectTimeout: any;

        const connect = () => {
            setWsStatus('connecting');
            ws = new WebSocket(`${WS_URL}/ws`);

            ws.onopen = () => {
                console.log("Connected to WS");
                setWsStatus('connected');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setPrediction(data.prediction);
                    setIsRecording(data.is_recording);

                    // Add to history if prediction changed and it's not "No Hand"
                    if (data.prediction !== "No Hand" && data.prediction !== lastPredictionRef.current) {
                        const newEntry = {
                            id: Math.random().toString(36).substr(2, 9),
                            label: data.prediction,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        };
                        setHistory(prev => [newEntry, ...prev].slice(0, 10));
                        lastPredictionRef.current = data.prediction;
                    } else if (data.prediction === "No Hand") {
                        lastPredictionRef.current = "";
                    }
                } catch (e) {
                    console.error(e);
                }
            };

            ws.onerror = () => {
                setWsStatus('error');
            };

            ws.onclose = () => {
                setWsStatus('error');
                reconnectTimeout = setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            if (ws) ws.close();
            clearTimeout(reconnectTimeout);
        };
    }, []);

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Content */}
                <div className="lg:col-span-8 space-y-10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                                Control Center
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${wsStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                wsStatus === 'connecting' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                    'bg-red-500/10 text-red-500 border-red-500/20'
                                }`}>
                                WS: {wsStatus}
                            </div>
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter mb-4">
                            Neural <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Workspace</span>
                        </h1>
                        <p className="text-slate-500 text-lg max-w-2xl font-medium leading-relaxed">
                            Synthesizing real-time gesture data through the computer vision engine.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StatCard
                            title="Gesture Engine"
                            value={prediction}
                            icon={prediction === "No Hand" ? Radio : Hand}
                            color={prediction === "No Hand" ? "slate" : "blue"}
                            delay={0.1}
                            tooltip="Shows the currently detected hand pattern from the live camera feed."
                        />
                        <StatCard
                            title="System Protocol"
                            value={isRecording ? "Capturing" : "Monitoring"}
                            icon={Activity}
                            color={isRecording ? "amber" : "emerald"}
                            delay={0.2}
                            tooltip="Status of the engine. 'Monitoring' means it's ready, 'Capturing' means it's recording data."
                        />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="relative group"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative glass-premium p-4 rounded-[2.2rem] overflow-hidden border border-white/10 shadow-2xl">
                            <div className="aspect-video bg-slate-950 rounded-3xl overflow-hidden relative">
                                <img
                                    src={`${API_URL}/video_feed`}
                                    alt="Gesture Camera Feed"
                                    className="w-full h-full object-cover rounded-3xl opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                                />

                                {/* Overlays */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />

                                <div className="absolute top-6 left-6 flex items-center gap-4">
                                    <div className="px-4 py-2 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center gap-3">
                                        <div className="flex gap-1">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className={`w-1 h-3 rounded-full bg-blue-500/50 ${prediction !== 'No Hand' ? 'animate-bounce' : ''}`} style={{ animationDelay: `${i * 0.1}s` }} />
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Signal: {prediction !== 'No Hand' ? 'Stable' : 'Searching'}</span>
                                    </div>
                                </div>

                                <div className="absolute bottom-6 right-6 px-4 py-2 bg-emerald-500/10 backdrop-blur-xl rounded-2xl border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    {isRecording ? 'Capturing Neural Input' : 'Engine Ready'}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Sidebar - Activity Log */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="lg:col-span-4"
                >
                    <div className="glass-premium p-8 rounded-[2.5rem] border border-white/10 h-full flex flex-col space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                                    <Clock size={16} />
                                </div>
                                <h2 className="text-xl font-black text-white tracking-tight">Activity Log</h2>
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last 10 Events</span>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {history.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-white/5">
                                            <Radio className="text-slate-700 animate-pulse" size={20} />
                                        </div>
                                        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Monitoring for neural activity...</p>
                                    </motion.div>
                                ) : (
                                    history.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: 20, scale: 0.95 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 group hover:border-blue-500/30 transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md text-[8px] font-black uppercase tracking-widest border border-blue-500/20">
                                                    Recognized
                                                </div>
                                                <span className="text-[10px] font-mono text-slate-600">{item.time}</span>
                                            </div>
                                            <h3 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">{item.label}</h3>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="pt-6 border-t border-white/5">
                            <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">
                                "The activity log persists current session patterns for visual synthesis and verification."
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
