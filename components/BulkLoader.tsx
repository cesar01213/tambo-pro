"use client";

import { useState } from 'react';
import { X, Clipboard, FileText, Upload, CheckCircle, AlertCircle, Loader2, Database, Activity } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { Cow, Evento, Raza, Categoria, EstadoReproductivo } from '@/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function BulkLoader({ isOpen, onClose }: Props) {
    const { bulkAddCows, bulkAddEvents } = useStore();
    const [text, setText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewCows, setPreviewCows] = useState<Cow[]>([]);
    const [previewEvents, setPreviewEvents] = useState<Evento[]>([]);
    const [step, setStep] = useState<1 | 2>(1); // 1: Input, 2: Preview
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.name.endsWith('.txt')) {
            setError('Por ahora solo se admiten archivos .txt');
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            setText(event.target?.result as string);
            setError(null);
        };
        reader.readAsText(file);
    };

    const smartParse = (input: string) => {
        const lines = input.split('\n').map(l => l.trim());
        const cows: Cow[] = [];
        const events: Evento[] = [];
        let currentCow: Cow | null = null;
        let inEventsBlock = false;

        lines.forEach(line => {
            // Limpieza básica: ignorar líneas vacías, separadores o etiquetas markdown
            if (!line || line.startsWith('---') || line.startsWith('```')) return;

            // Detectar inicio de una nueva vaca (ID: [valor] o RP: [valor])
            const idMatch = line.match(/^(?:ID:?\s*|#\s*)?(\w+)$/i);
            const isJustIdLine = idMatch && !line.includes(':') && !line.includes('|');
            const isExplicitIdLine = line.toLowerCase().startsWith('id:');

            if (isExplicitIdLine || isJustIdLine) {
                const id = idMatch ? idMatch[1] : line;
                currentCow = {
                    id,
                    rp: '',
                    raza: 'Holando',
                    categoria: 'Vaca',
                    fechaNacimiento: new Date().toISOString(),
                    estado: 'Lactancia',
                    estadoRepro: 'Vacía',
                    partosTotales: 0,
                    diasPreñez: 0,
                    senasParticulares: ''
                };
                cows.push(currentCow);
                inEventsBlock = false;
                return;
            }

            if (!currentCow) return;

            // Detectar Propiedades de la Vaca
            const lowerLine = line.toLowerCase();
            if (lowerLine.startsWith('rp:')) currentCow.rp = line.split(':')[1].trim();
            if (lowerLine.startsWith('raza:')) currentCow.raza = line.split(':')[1].trim() as Raza;

            // DETECTOR DE FECHAS CLAVE
            if (lowerLine.startsWith('ultima:') || lowerLine.startsWith('última:')) {
                currentCow.ultimoParto = line.split(':')[1].trim();
            }
            if (lowerLine.startsWith('fpp:') || lowerLine.startsWith('prox:') || lowerLine.startsWith('próx:')) {
                currentCow.fpp = line.split(':')[1].trim();
            }

            if (lowerLine.startsWith('senas:') || lowerLine.startsWith('señas:'))
                currentCow.senasParticulares = line.split(':')[1].trim();
            if (lowerLine.startsWith('categoria:') || lowerLine.startsWith('categoría:'))
                currentCow.categoria = line.split(':')[1].trim() as Categoria;
            if (lowerLine.startsWith('estado:')) {
                const val = line.split(':')[1].trim();
                if (['Lactancia', 'Seca'].includes(val)) currentCow.estado = val as any;
                if (['Vacía', 'Inseminada', 'Preñada', 'Seca'].includes(val)) currentCow.estadoRepro = val as any;
            }
            if (lowerLine.startsWith('partos:')) currentCow.partosTotales = parseInt(line.split(':')[1].trim()) || 0;
            if (lowerLine.startsWith('fechanac:')) currentCow.fechaNacimiento = line.split(':')[1].trim();

            // Detectar Bloque de Eventos
            if (lowerLine.startsWith('eventos:')) {
                inEventsBlock = true;
                return;
            }

            // Procesar Eventos (líneas que empiezan con -)
            if (inEventsBlock && line.startsWith('-')) {
                const eventLine = line.substring(1).trim();
                let datePart = eventLine.split('|')[0].trim().replace(/:$/, '');
                const propsPart = eventLine.includes('|') ? eventLine.substring(eventLine.indexOf('|')) : '';

                const event: Evento = {
                    id: Date.now() + Math.random(),
                    cowId: currentCow.id,
                    fecha: datePart || new Date().toISOString(),
                    tipo: 'celo',
                    detalle: 'Carga veterinaria sincronizada'
                };

                // Parsear propiedades del evento |prop: valor|
                const props = propsPart.split('|').filter(p => p.includes(':'));
                props.forEach(p => {
                    const [key, val] = p.split(':').map(s => s.trim());
                    if (key === 'tipo') event.tipo = val as any;
                    if (key === 'detalle') event.detalle = val;
                    if (key === 'litros') event.litros = parseFloat(val);
                    if (key === 'grasa') event.grasa = parseFloat(val);
                    if (key === 'proteina') event.proteina = parseFloat(val);
                    if (key === 'diasRetiro') event.diasRetiro = parseInt(val);
                    if (key === 'fechaLiberacion') event.fechaLiberacion = val;
                    if (key === 'resultado') event.resultadoTacto = val as any;
                    if (key === 'mesesGesta') event.mesesGestacion = parseInt(val);
                    if (key === 'toro') event.toro = val;
                    if (key === 'servicio') event.numeroServicio = parseInt(val);
                });

                events.push(event);

                // ACTUALIZACIÓN DE ESTADOS (Con Protección de Leche)
                // Solo actualizamos si NO es un evento de control lechero
                if (event.tipo !== 'controlLechero') {
                    if (event.tipo === 'parto') {
                        currentCow.estado = 'Lactancia';
                        currentCow.ultimoParto = event.fecha;
                        currentCow.estadoRepro = 'Vacía';
                    }
                    if (event.tipo === 'inseminacion') {
                        currentCow.estadoRepro = 'Inseminada';
                    }
                    if (event.tipo === 'tacto') {
                        if (event.resultadoTacto === 'Preñada') {
                            currentCow.estadoRepro = 'Preñada';
                        } else if (event.resultadoTacto === 'Vacía') {
                            currentCow.estadoRepro = 'Vacía';
                        }
                    }
                }
            }
        });

        // Caso especial: si es una lista simple (coma separadad), procesar como IDs simples
        if (cows.length === 0 && input.trim().length > 0) {
            const simpleIds = input.split(/[\n,;]+/).map(i => i.trim()).filter(i => i.length > 0);
            simpleIds.forEach(id => {
                cows.push({
                    id,
                    rp: '',
                    raza: 'Holando',
                    categoria: 'Vaca',
                    fechaNacimiento: new Date().toISOString(),
                    estado: 'Lactancia',
                    estadoRepro: 'Vacía',
                    partosTotales: 0,
                    diasPreñez: 0
                });
            });
        }

        return { cows, events };
    };

    const handleProcessText = () => {
        setIsProcessing(true);
        setTimeout(() => {
            const { cows, events } = smartParse(text);
            if (cows.length === 0) {
                setError('No se detectaron vacas válidas en el texto.');
                setIsProcessing(false);
                return;
            }
            setPreviewCows(cows);
            setPreviewEvents(events);
            setIsProcessing(false);
            setStep(2);
            setError(null);
        }, 1000);
    };

    const handleConfirm = () => {
        bulkAddCows(previewCows);
        bulkAddEvents(previewEvents);
        onClose();
        setStep(1);
        setText('');
        setPreviewCows([]);
        setPreviewEvents([]);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10">
                <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black tracking-tighter uppercase italic leading-none">Carga Masiva <span className="text-indigo-400 font-black">Pro</span></h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2">Detección Inteligente de Registros</p>
                    </div>
                    <button onClick={onClose} className="bg-white/10 p-2 rounded-xl text-white/70">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {step === 1 ? (
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-6 rounded-[2.5rem] border-2 border-slate-100 flex gap-5 items-start">
                                <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg shadow-indigo-900/40">
                                    <Database className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 text-lg leading-tight mb-1">Carga Inteligente</p>
                                    <p className="text-xs text-slate-500 font-bold">Pega listas simples o fichas técnicas completas. El sistema detectará IDs, Razas y Eventos automáticamente.</p>
                                </div>
                            </div>

                            <textarea
                                className="w-full h-64 p-6 bg-slate-50 border-4 border-slate-100 rounded-[2.5rem] font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 shadow-inner"
                                placeholder={`Ejemplo de carga:\nID: 10\nRP: 5001\nRaza: Holando\nEventos:\n- 2025-12-27: |tipo: celo|`}
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                            />

                            <div className="flex gap-4">
                                <button
                                    onClick={handleProcessText}
                                    disabled={!text || isProcessing}
                                    className="flex-[3] bg-slate-900 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-2xl active:scale-95 disabled:opacity-50 transition-all"
                                >
                                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clipboard className="w-5 h-5 " />}
                                    Procesar Registros
                                </button>
                                <div className="flex-1 flex items-center justify-center">
                                    <label className="w-full h-full flex items-center justify-center bg-white border-4 border-slate-100 text-slate-400 p-4 rounded-3xl cursor-pointer hover:bg-slate-50 hover:border-slate-200 transition-all">
                                        <Upload className="w-6 h-6" />
                                        <input type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
                                    </label>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border-2 border-red-100 p-4 rounded-2xl flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    <p className="text-red-600 text-[10px] font-black uppercase tracking-widest">{error}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h4 className="font-black text-slate-900 text-2xl tracking-tighter uppercase italic">Vista Previa</h4>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Revisa los datos antes de confirmar</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="text-center">
                                        <p className="text-[11px] font-black text-indigo-600 uppercase leading-none">{previewCows.length}</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">VACAS</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[11px] font-black text-emerald-600 uppercase leading-none">{previewEvents.length}</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">EVENTOS</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 no-scrollbar">
                                {previewCows.map((cow, idx) => (
                                    <div key={idx} className="bg-slate-50 p-5 rounded-[2rem] border-2 border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black">
                                                #{cow.id}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-sm">Vaca {cow.rp ? `(RP: ${cow.rp})` : ''}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{cow.raza} • {cow.estadoRepro}</p>
                                                {cow.senasParticulares && (
                                                    <p className="text-[9px] font-black text-amber-600 uppercase mt-1 italic leading-none">🎨 {cow.senasParticulares}</p>
                                                )}
                                            </div>
                                        </div>
                                        {previewEvents.filter(e => e.cowId === cow.id).length > 0 && (
                                            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                                                <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-0.5">Eventos</p>
                                                <p className="text-[10px] font-black text-indigo-600">{previewEvents.filter(e => e.cowId === cow.id).length}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-3xl font-black uppercase text-xs tracking-widest transition-all hover:bg-slate-200"
                                >
                                    Corregir
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="flex-[2] bg-emerald-600 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    Cargar {previewCows.length} Vacas
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
