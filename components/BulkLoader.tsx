"use client";

import { useState } from 'react';
import { X, Clipboard, Upload, CheckCircle, AlertCircle, Loader2, Database, Activity } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { Cow, Evento } from '@/types';

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
    const [step, setStep] = useState<1 | 2>(1);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            setText(event.target?.result as string);
            setError(null);
        };
        reader.readAsText(file);
    };

    const smartParse = (input: string) => {
        const lines = input.split('\n');
        const cows: Cow[] = [];
        const events: Evento[] = [];
        let currentCow: Cow | null = null;
        let inEventsBlock = false;

        // Regex para detectar IDs (Ignora y espacios extra)
        const idRegex = /^(?:\s*)?(?:ID:?\s*|#\s*|^)(\d+\w*)$/i;

        lines.forEach(rawLine => {
            let line = rawLine.trim();
            if (!line || line.startsWith('---')) return;
            line = line.replace(/^\s*/i, ''); // Limpiar basura

            // 1. Detectar Nueva Vaca
            const idMatch = line.match(idRegex);
            const isIdLine = idMatch && !line.includes('|') && (line.toLowerCase().startsWith('id') || !line.includes(':'));

            if (isIdLine) {
                const id = idMatch![1];
                if (['rp', 'raza', 'estado', 'eventos', 'ultima', 'fpp'].includes(id.toLowerCase())) return;

                currentCow = {
                    id,
                    rp: id,
                    raza: 'Holando',
                    categoria: 'Vaca',
                    fechaNacimiento: new Date().toISOString(),
                    estado: 'Lactancia',
                    estadoRepro: 'Vacía',
                    partosTotales: 0, // Se llenará con "Lactancia:"
                    diasPreñez: 0,
                    senasParticulares: ''
                };
                cows.push(currentCow);
                inEventsBlock = false;
                return;
            }

            if (!currentCow) return;

            // 2. Leer Propiedades (Ahora incluye FPP y Lactancia)
            const lowerLine = line.toLowerCase();
            if (lowerLine.startsWith('rp:')) currentCow.rp = line.split(':')[1].trim();
            if (lowerLine.startsWith('ultima:')) currentCow.ultimoParto = line.split(':')[1].trim();

            // NUEVO: Leer Fecha Probable de Parto directa de la ficha
            if (lowerLine.startsWith('fpp:') || lowerLine.startsWith('prox:') || lowerLine.startsWith('próx:')) {
                const fppRaw = line.split(':')[1].trim();
                if (fppRaw && fppRaw.length > 5) currentCow.fpp = fppRaw;
            }
            // NUEVO: Leer Número de Lactancia
            if (lowerLine.startsWith('lactancia:') || lowerLine.startsWith('lact:')) {
                currentCow.partosTotales = parseInt(line.split(':')[1].trim()) || 0;
            }

            // 3. Bloque de Eventos
            if (lowerLine.startsWith('eventos:')) {
                inEventsBlock = true;
                return;
            }

            // 4. Procesar Eventos
            if (inEventsBlock && line.startsWith('-')) {
                const eventLine = line.substring(1).trim();
                const parts = eventLine.split(':');
                let datePart = parts[0].trim();

                if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const propsPart = eventLine.substring(datePart.length + 1);

                    const event: Evento = {
                        id: Date.now() + Math.random(),
                        cowId: currentCow.id,
                        fecha: datePart,
                        tipo: 'celo',
                        detalle: ''
                    };

                    const props = propsPart.split('|').filter(p => p.trim());
                    let servicios = '';

                    props.forEach(p => {
                        const [k, v] = p.split(':').map(s => s.trim());
                        if (!k || !v) return;

                        if (k === 'tipo') event.tipo = v as any;
                        if (k === 'detalle') event.detalle = v;
                        if (k === 'toro') event.toro = v;
                        if (k === 'resultado') event.resultadoTacto = v as any;
                        if (k === 'litros') event.litros = parseFloat(v);

                        // NUEVO: Capturar número de servicio
                        if (k === 'servicios' || k === 'n') servicios = v;
                    });

                    // Si hay inseminación y tenemos el dato de servicios, lo agregamos al detalle
                    if (event.tipo === 'inseminacion' && servicios) {
                        event.detalle = `${event.detalle || ''} (Servicio Nº ${servicios})`.trim();
                    }
                    // Si solo tenemos el toro en detalle, lo dejamos limpio
                    if (event.tipo === 'inseminacion' && !event.detalle && event.toro) {
                        event.detalle = event.toro + (servicios ? ` (Servicio Nº ${servicios})` : '');
                    }

                    events.push(event);

                    // Auto-actualizar estado
                    if (event.tipo === 'parto') {
                        currentCow.estado = 'Lactancia';
                        currentCow.ultimoParto = event.fecha;
                        currentCow.estadoRepro = 'Vacía';
                    }
                    if (event.tipo === 'tacto' && event.resultadoTacto === 'Preñada') {
                        currentCow.estadoRepro = 'Preñada';
                    }
                }
            }
        });

        return { cows, events };
    };

    const handleProcessText = () => {
        if (!text) return;
        setIsProcessing(true);
        setError(null);
        setTimeout(() => {
            try {
                const { cows, events } = smartParse(text);
                if (cows.length === 0) {
                    setError('No se detectaron vacas. Revisa el formato.');
                    setIsProcessing(false);
                    return;
                }
                setPreviewCows(cows);
                setPreviewEvents(events);
                setStep(2);
            } catch (err) {
                console.error(err);
                setError('Error al procesar.');
                setIsProcessing(false);
            }
        }, 100);
    };

    const handleConfirm = () => {
        bulkAddCows(previewCows);
        bulkAddEvents(previewEvents);
        onClose();
        setTimeout(() => {
            setStep(1); setText(''); setPreviewCows([]); setPreviewEvents([]);
        }, 300);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-2xl font-black uppercase italic">Carga Masiva <span className="text-indigo-400">V3</span></h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2">Con FPP y Servicios</p>
                    </div>
                    <button onClick={onClose}><X className="w-6 h-6" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8">
                    {step === 1 ? (
                        <div className="space-y-6">
                            <textarea
                                className="w-full h-64 p-6 bg-slate-50 border-4 border-slate-100 rounded-[2.5rem] font-mono text-xs"
                                placeholder="Pega aquí el contenido de carga_full_v3.txt..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                            />
                            <div className="flex gap-4">
                                <button onClick={handleProcessText} disabled={!text || isProcessing} className="flex-[3] bg-slate-900 text-white py-5 rounded-3xl font-black uppercase text-xs">
                                    {isProcessing ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : 'Procesar'}
                                </button>
                                <label className="flex-1 bg-white border-4 border-slate-100 flex items-center justify-center rounded-3xl cursor-pointer">
                                    <Upload className="w-6 h-6 text-slate-400" />
                                    <input type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
                                </label>
                            </div>
                            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <h4 className="font-black text-2xl">Vista Previa</h4>
                                <p className="text-xs font-bold text-slate-400">{previewCows.length} Vacas</p>
                            </div>
                            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                                {previewCows.slice(0, 50).map((c, i) => (
                                    <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <span className="font-black bg-white px-2 py-1 rounded-lg border text-xs">#{c.id}</span>
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">Parto: {c.ultimoParto}</p>
                                                {c.fpp && <p className="text-[10px] font-black text-indigo-500">FPP: {c.fpp}</p>}
                                            </div>
                                        </div>
                                        {previewEvents.filter(e => e.cowId === c.id && e.tipo === 'inseminacion').length > 0 && (
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                                                {previewEvents.find(e => e.cowId === c.id && e.tipo === 'inseminacion')?.detalle}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setStep(1)} className="flex-1 bg-slate-100 py-4 rounded-3xl font-black text-xs uppercase text-slate-500">Atrás</button>
                                <button onClick={handleConfirm} className="flex-[2] bg-emerald-600 text-white py-4 rounded-3xl font-black text-xs uppercase">Confirmar Carga</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
