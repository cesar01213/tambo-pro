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

        // Regex V3: Detecta IDs limpiamente
        const idRegex = /^(?:\s*)?(?:ID:?\s*|#\s*|^)(\d+\w*)$/i;

        lines.forEach(rawLine => {
            let line = rawLine.trim();
            if (!line || line.startsWith('---')) return;
            line = line.replace(/^\s*/i, ''); // Limpiar basura del OCR

            // 1. Detectar Vaca
            const idMatch = line.match(idRegex);
            const isIdLine = idMatch && !line.includes('|') && (line.toLowerCase().startsWith('id') || !line.includes(':'));

            if (isIdLine) {
                const id = idMatch![1];
                // Filtro de seguridad para no confundir propiedades con IDs
                if (['rp', 'raza', 'estado', 'eventos', 'ultima', 'fpp', 'lactancia'].includes(id.toLowerCase())) return;

                currentCow = {
                    id,
                    rp: id,
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

            // 2. Leer Propiedades de la Vaca
            const lowerLine = line.toLowerCase();
            if (lowerLine.startsWith('rp:')) currentCow.rp = line.split(':')[1].trim();
            if (lowerLine.startsWith('ultima:')) currentCow.ultimoParto = line.split(':')[1].trim();

            // NUEVO: Aquí estaba el error. Ahora leemos explícitamente FPP y Lactancia.
            if (lowerLine.startsWith('fpp:') || lowerLine.startsWith('próx:') || lowerLine.startsWith('prox:')) {
                const fppRaw = line.split(':')[1].trim();
                if (fppRaw.length > 5) currentCow.fpp = fppRaw;
            }
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

                // Validar fecha YYYY-MM-DD
                if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const propsPart = eventLine.substring(datePart.length + 1);

                    const event: Evento = {
                        id: Date.now() + Math.random(), // ID temporal único
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

                        // NUEVO: Capturamos el número de servicio
                        if (k === 'servicios' || k === 'n') servicios = v;
                    });

                    // Si hay inseminación y tenemos servicios, lo guardamos en el detalle
                    if (event.tipo === 'inseminacion') {
                        const extraInfo = servicios ? ` (Servicio Nº ${servicios})` : '';
                        // Si no hay detalle, usamos el toro + servicio
                        if (!event.detalle) {
                            event.detalle = (event.toro || 'IA') + extraInfo;
                        } else {
                            // Si ya hay detalle, le agregamos el servicio
                            event.detalle = event.detalle + extraInfo;
                        }
                    }

                    events.push(event);

                    // Lógica de Estado: Mantener sincronía
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
                    setError('No se detectaron vacas. Revisa que uses "ID: XXX"');
                    setIsProcessing(false);
                    return;
                }
                setPreviewCows(cows);
                setPreviewEvents(events);
                setStep(2);
            } catch (err) {
                console.error(err);
                setError('Error al procesar el texto.');
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
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-2xl font-black uppercase italic">Carga Masiva <span className="text-indigo-400">V3</span></h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2">Versión Final - Con FPP y Servicios</p>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8">
                    {step === 1 ? (
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3">
                                <Database className="text-indigo-600" />
                                <p className="text-xs text-slate-500 font-bold">Pega aquí el contenido de <span className="text-indigo-600">carga_full_v3.txt</span>. El sistema reconocerá FPP y Servicios automáticamente.</p>
                            </div>
                            <textarea
                                className="w-full h-64 p-6 bg-slate-50 border-4 border-slate-100 rounded-[2.5rem] font-mono text-xs text-slate-700 focus:border-indigo-500 outline-none transition-all"
                                placeholder="ID: 3904..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                            />
                            <div className="flex gap-4">
                                <button onClick={handleProcessText} disabled={!text || isProcessing} className="flex-[3] bg-slate-900 text-white py-5 rounded-3xl font-black uppercase text-xs hover:bg-slate-800 transition-all">
                                    {isProcessing ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : 'Procesar Datos'}
                                </button>
                                <label className="flex-1 bg-white border-4 border-slate-100 flex items-center justify-center rounded-3xl cursor-pointer hover:bg-slate-50">
                                    <Upload className="w-6 h-6 text-slate-400" />
                                    <input type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
                                </label>
                            </div>
                            {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 p-2 rounded-lg">{error}</p>}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <h4 className="font-black text-2xl text-slate-900">Vista Previa</h4>
                                <div className="bg-indigo-50 px-3 py-1 rounded-lg">
                                    <p className="text-xs font-black text-indigo-600">{previewCows.length} Vacas detectadas</p>
                                </div>
                            </div>
                            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                                {previewCows.slice(0, 50).map((c, i) => (
                                    <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center hover:border-indigo-200 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-sm text-slate-900">RP: {c.rp}</span>
                                                {c.fpp && <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">FPP: {c.fpp}</span>}
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Parto: {c.ultimoParto || 'N/A'} • Lact: {c.partosTotales}</p>
                                        </div>
                                        {previewEvents.filter(e => e.cowId === c.id && e.tipo === 'inseminacion').length > 0 && (
                                            <div className="text-right">
                                                <p className="text-[9px] font-bold text-emerald-600 uppercase">Inseminada</p>
                                                <p className="text-[8px] text-slate-400 font-bold">{previewEvents.find(e => e.cowId === c.id && e.tipo === 'inseminacion')?.detalle}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-slate-100">
                                <button onClick={() => setStep(1)} className="flex-1 bg-white border-2 border-slate-100 py-4 rounded-3xl font-black text-xs uppercase text-slate-500 hover:bg-slate-50">Corregir</button>
                                <button onClick={handleConfirm} className="flex-[2] bg-indigo-600 text-white py-4 rounded-3xl font-black text-xs uppercase hover:bg-indigo-500 shadow-xl shadow-indigo-200">Confirmar Carga</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
