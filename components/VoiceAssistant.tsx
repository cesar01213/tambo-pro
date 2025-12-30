"use client";

import { useState, useRef, useEffect } from 'react';
import { Mic, X, Send, Bot, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

interface Props {
    onProcessCommand: (data: any) => void;
}

export default function VoiceAssistant({ onProcessCommand }: Props) {
    const { isLocked } = useStore();
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Inicializar reconocimiento de voz
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'es-AR'; // Español Argentina

            recognitionRef.current.onresult = (event: any) => {
                const current = event.resultIndex;
                const transcriptResult = event.results[current][0].transcript;
                setTranscript(transcriptResult);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                if (event.error === 'not-allowed') {
                    setError('Permiso de micrófono denegado. Habilitalo en los ajustes de tu navegador.');
                } else {
                    setError('Error al escuchar: ' + event.error);
                }
                setIsListening(false);
            };
        } else {
            setError('Tu navegador no soporta reconocimiento de voz. Intentá con Chrome.');
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    if (isLocked) return null;

    const startListening = () => {
        if (!recognitionRef.current) return;
        setError(null);
        setTranscript('');
        setIsListening(true);
        try {
            recognitionRef.current.start();
        } catch (e) {
            console.error('Recognition already started');
        }
    };

    const stopListening = () => {
        if (!recognitionRef.current) return;
        setIsListening(false);
        recognitionRef.current.stop();

        // Procesar después de un pequeño delay para asegurar el transcript final
        setTimeout(() => {
            if (transcript) {
                processWithLogic(transcript);
            }
        }, 500);
    };

    const processWithLogic = async (text: string) => {
        setIsProcessing(true);

        // Lógica de extracción local (simulando IA pero basada en regex reales)
        setTimeout(() => {
            const raw = text.toLowerCase();

            // Extraer ID de vaca (busca nros de 1 a 4 cifras)
            const idMatch = raw.match(/\d+/);
            const cowId = idMatch ? idMatch[0] : null;

            let tipo = "otros";
            let medicamento = "";
            let grado = 1;

            if (raw.includes("celo") || raw.includes("calor")) {
                tipo = "celo";
            } else if (raw.includes("mastitis") || raw.includes("mastiti")) {
                tipo = "sanidad";
                medicamento = "Cefalexina (Mastitis)";
                if (raw.includes("grado 2") || raw.includes("fuerte")) grado = 2;
                if (raw.includes("grado 3") || raw.includes("grave")) grado = 3;
            } else if (raw.includes("parto") || raw.includes("parió")) {
                tipo = "parto";
            } else if (raw.includes("tacto") || raw.includes("preñada")) {
                tipo = "tacto";
            }

            const extractedData = {
                cowId,
                tipo,
                transcript: text,
                grado,
                medicamento,
                cuartos: raw.includes("atrás") ? ["PD", "PI"] : raw.includes("adelante") ? ["AD", "AI"] : []
            };

            setIsProcessing(false);
            onProcessCommand(extractedData);
            setIsOpen(false);
        }, 1200);
    };

    return (
        <>
            {/* BOTÓN FLOTANTE DE VOZ */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-28 right-6 z-40 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 transition-all active:scale-95 border-4 border-white"
            >
                <Mic className="w-6 h-6" />
            </button>

            {/* PANEL DEL ASISTENTE */}
            {isOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom-10">
                        <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-400" />
                                <h3 className="font-black italic text-lg tracking-tighter">VOICE ASSISTANT IA</h3>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 flex flex-col items-center text-center space-y-6">
                            {error ? (
                                <div className="bg-red-50 p-6 rounded-3xl border border-red-100 space-y-3">
                                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                                    <p className="text-red-900 font-bold text-sm leading-tight">{error}</p>
                                    <button
                                        onClick={() => setError(null)}
                                        className="text-red-600 text-[10px] font-black uppercase tracking-widest border-b border-red-600/30"
                                    >
                                        Reintentar
                                    </button>
                                </div>
                            ) : isProcessing ? (
                                <div className="flex flex-col items-center gap-4 py-8">
                                    <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
                                    <p className="font-black text-slate-800 uppercase tracking-widest text-xs">Interpretando voz...</p>
                                </div>
                            ) : (
                                <>
                                    <div className={`
                                        relative p-10 rounded-full transition-all duration-500
                                        ${isListening ? 'bg-red-100 scale-110 shadow-[0_0_50px_rgba(239,68,68,0.4)]' : 'bg-slate-100 shadow-xl'}
                                    `}>
                                        <button
                                            onMouseDown={startListening}
                                            onMouseUp={stopListening}
                                            onTouchStart={startListening}
                                            onTouchEnd={stopListening}
                                            className={`
                                                p-8 rounded-full transition-all outline-none border-none
                                                ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-indigo-600 text-white'}
                                            `}
                                        >
                                            <Mic className="w-10 h-10" />
                                        </button>
                                        {isListening && (
                                            <div className="absolute -inset-2 border-2 border-red-500 rounded-full animate-ping opacity-20"></div>
                                        )}
                                    </div>

                                    <div>
                                        <p className="font-black text-slate-900 text-xl tracking-tight">
                                            {isListening ? 'Te escucho...' : 'Mantén presionado'}
                                        </p>
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2 opacity-70">
                                            {isListening ? 'Hable ahora' : 'Botón para dictar'}
                                        </p>
                                    </div>
                                </>
                            )}

                            {transcript && !isProcessing && (
                                <div className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Dictado Escuchado:</p>
                                    <p className="font-bold text-slate-700 italic">"{transcript}"</p>
                                </div>
                            )}

                            {!isListening && !isProcessing && !error && (
                                <p className="text-slate-400 text-[10px] font-medium leading-relaxed px-4">
                                    Podes decir por ejemplo: <br />
                                    <span className="text-slate-600 font-bold italic">"Vaca 145 celo fuerte"</span> o <br />
                                    <span className="text-slate-600 font-bold italic">"La 20 con mastitis"</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
