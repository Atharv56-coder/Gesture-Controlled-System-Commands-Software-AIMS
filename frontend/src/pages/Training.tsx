import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader, Cpu, Brain, Zap, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { API_URL } from '../config/api';

export default function Training() {
    const [isTraining, setIsTraining] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        "Initializing core syndicate...",
        "Loading landmark datasets...",
        "Normalizing neural geometry...",
        "Training KNN classifier...",
        "Calibrating Euclidean metrics...",
        "Generating production weights...",
        "Finalizing synchronization..."
    ];

    useEffect(() => {
        let interval: any;
        if (isTraining) {
            setCurrentStep(0);
            interval = setInterval(() => {
                setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
            }, 600);
        } else {
            setCurrentStep(0);
        }
        return () => clearInterval(interval);
    }, [isTraining]);

    const handleTrain = async () => {
        setIsTraining(true);
        setStatus('idle');
        const toastId = toast.loading("Synthesizing neural weights...");
        try {
            const res = await fetch(`${API_URL}/train`, { method: 'POST' });

            if (res.ok) {
                setStatus('success');
                toast.success("Weights synchronized successfully", { id: toastId });
            } else {
                setStatus('error');
                toast.error("Syndicate failure. Insufficient data.", { id: toastId });
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
            toast.error("Connection lost during synthesis", { id: toastId });
        } finally {
            setIsTraining(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-10">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                        Neural Optimization
                    </div>
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter mb-4">
                    Core <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Synthesis</span>
                </h1>
                <p className="text-slate-500 text-lg max-w-2xl font-medium leading-relaxed">
                    Optimize the neural network weights for enhanced gesture precision and lower latency.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="glass-premium p-10 rounded-[3rem] border border-white/5 relative overflow-hidden group shadow-2xl"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none" />

                <div className="relative z-10 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center border border-white/5 ring-4 ring-blue-500/5 shadow-inner">
                                <Brain className={`w-7 h-7 ${isTraining ? 'text-blue-400 animate-pulse' : 'text-slate-600'}`} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white tracking-tight">Engine Registry</h2>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    Status: {isTraining ? steps[currentStep] : status === 'success' ? 'Synchronized' : 'Standby'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {status === 'success' && (
                                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                    <CheckCircle size={16} className="text-emerald-400" />
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Optimal</span>
                                </motion.div>
                            )}
                            {status === 'error' && (
                                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                    <AlertCircle size={16} className="text-red-400" />
                                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Fault Detected</span>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-end px-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Integration Progress</span>
                                <span className="text-[10px] font-mono text-blue-400 uppercase">{isTraining ? `${Math.round((currentStep + 1) / steps.length * 100)}%` : status === 'success' ? '100%' : '0%'}</span>
                            </div>
                            <div className="w-full bg-slate-950/50 rounded-2xl h-4 p-1 border border-white/5 overflow-hidden shadow-inner">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: isTraining ? `${((currentStep + 1) / steps.length) * 100}%` : status === 'success' ? '100%' : '0%'
                                    }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className={`h-full rounded-full ${isTraining ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-[0_0_20px_-3px_rgba(59,130,246,0.6)]' :
                                        status === 'success' ? 'bg-emerald-500 shadow-[0_0_20px_-3px_rgba(16,185,129,0.4)]' : 'bg-slate-800'
                                        }`}
                                />
                            </div>
                        </div>

                        {/* Detailed Step List (Only visible when training) */}
                        <AnimatePresence>
                            {isTraining && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="grid grid-cols-1 gap-2"
                                >
                                    {steps.map((step, idx) => (
                                        <div key={idx} className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900/40 border border-white/5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${idx === currentStep ? 'bg-blue-400 animate-pulse' : idx < currentStep ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${idx === currentStep ? 'text-blue-400' : idx < currentStep ? 'text-emerald-500/60' : 'text-slate-600'}`}>
                                                {step}
                                            </span>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 glass-card rounded-[2rem] border border-white/5 hover:border-blue-500/20 transition-colors group/card">
                            <div className="flex items-center gap-3 mb-3">
                                <Cpu className="text-blue-400 w-4 h-4 group-hover/card:scale-110 transition-transform" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compute Logic</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                Utilizing local hardware acceleration to re-calculate Euclidean distances for KNN classification.
                            </p>
                        </div>
                        <div className="p-6 glass-card rounded-[2rem] border border-white/5 hover:border-purple-500/20 transition-colors group/card">
                            <div className="flex items-center gap-3 mb-3">
                                <Layers className="text-purple-400 w-4 h-4 group-hover/card:scale-110 transition-transform" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Feature Extraction</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                Refining hand landmark coordinate normalization to ensure invariance across different lighting conditions.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleTrain}
                        disabled={isTraining}
                        className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-4 group ${isTraining
                            ? 'bg-slate-900 text-slate-600 cursor-not-allowed border border-white/5 shadow-none'
                            : 'bg-white text-slate-950 hover:bg-blue-600 hover:text-white shadow-2xl shadow-blue-500/20 active:scale-[0.98]'
                            }`}
                    >
                        {isTraining ? <Loader className="animate-spin" size={20} /> : <Zap size={20} className="group-hover:fill-current transition-all" />}
                        {isTraining ? 'Synthesizing...' : 'Sustain Synchronization'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
