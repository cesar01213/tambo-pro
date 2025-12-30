"use client";

import { useState, useMemo, useEffect } from 'react';
import { X, Search, AlertTriangle, ShieldCheck, Clock, ArrowRight, Droplet, Activity, FlaskConical, Stethoscope, Baby } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { addDays, format, differenceInDays, parseISO } from 'date-fns';
import { Cuarto } from '@/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
}

const MEDICAMENTOS_COMUNES = [
    { nombre: 'Cefalexina (Mastitis)', retiro: 4 },
    { nombre: 'Amoxicilina (Secado)', retiro: 30 },
    { nombre: 'Tratamiento Grado 1 (Suave)', retiro: 2 },
    { nombre: 'Antibiótico General', retiro: 5 },
];

const RECOMENDACION_SEMEN: Record<string, string> = {
    'Holando': 'Semen Sexado Holandés (Alta Prod)',
    'Jersey': 'Semen Jersey Australiano (Grasa/Sólidos)',
    'Cruza': 'Semen Carne (Angus/Hereford)',
    'default': 'Semen Convencional'
};

export default function AddEventModal({ isOpen, onClose, initialData }: Props) {
    const { cows, events, addEvent, getCow, userProfile } = useStore();
    const canRecordMedicalOrIA = userProfile?.role === 'admin' || userProfile?.role === 'tambero';

    const [selectedCowId, setSelectedCowId] = useState('');
    const [tipo, setTipo] = useState<'celo' | 'sanidad' | 'inseminacion' | 'parto' | 'tacto' | 'controlLechero'>('celo');
    const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 16));

    // Detalle común
    const [detalle, setDetalle] = useState('');

    // Sanidad
    const [grado, setGrado] = useState<1 | 2 | 3 | 'Clínico' | undefined>(undefined);
    const [cuartos, setCuartos] = useState<Cuarto[]>([]);
    const [medicamento, setMedicamento] = useState('');
    const [diasRetiro, setDiasRetiro] = useState<number>(0);

    // Tacto
    const [resultadoTacto, setResultadoTacto] = useState<'Preñada' | 'Vacía'>('Vacía');
    const [mesesGestacion, setMesesGestacion] = useState(0);

    // Control Lechero
    const [litros, setLitros] = useState(0);
    const [grasa, setGrasa] = useState(0);
    const [proteina, setProteina] = useState(0);

    // Mejoras Repro Pro
    const [intensidadCelo, setIntensidadCelo] = useState<'Suave' | 'Normal' | 'Fuerte'>('Normal');
    const [sexoCria, setSexoCria] = useState<'Macho' | 'Hembra' | 'Mellizos'>('Hembra');
    const [pesoCria, setPesoCria] = useState<number>(0);
    const [destinoCria, setDestinoCria] = useState<'Campo' | 'Venta' | 'Muerto'>('Campo');

    useEffect(() => {
        if (initialData) {
            setSelectedCowId(initialData.cowId || '');
            setTipo(initialData.tipo || 'celo');
            setDetalle(initialData.detalle || '');
        }
    }, [initialData]);

    const vacaActiva = useMemo(() => getCow(selectedCowId), [selectedCowId, getCow]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCowId || !fecha) return;

        let finalDetalle = detalle;
        let fechaLib = undefined;

        if (tipo === 'sanidad' && diasRetiro > 0) {
            fechaLib = addDays(new Date(fecha), diasRetiro).toISOString();
        }

        addEvent({
            id: Date.now(),
            cowId: selectedCowId,
            tipo,
            fecha: new Date(fecha).toISOString(),
            detalle: finalDetalle,
            gradoMastitis: grado,
            cuartos,
            medicamento,
            diasRetiro,
            fechaLiberacion: fechaLib,
            resultadoTacto,
            mesesGestacion,
            litros,
            grasa,
            proteina,
            intensidadCelo: tipo === 'celo' ? intensidadCelo : undefined,
            sexoCria: tipo === 'parto' ? sexoCria : undefined,
            pesoCria: tipo === 'parto' ? pesoCria : undefined,
            destinoCria: tipo === 'parto' ? destinoCria : undefined
        });

        onClose();
        resetForm();
    };

    const resetForm = () => {
        setSelectedCowId('');
        setTipo('celo');
        setDetalle('');
        setGrado(undefined);
        setCuartos([]);
        setMedicamento('');
        setDiasRetiro(0);
        setResultadoTacto('Vacía');
        setMesesGestacion(0);
        setLitros(0);
        setGrasa(0);
        setProteina(0);
        setIntensidadCelo('Normal');
        setSexoCria('Hembra');
        setPesoCria(0);
        setDestinoCria('Campo');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
            <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
                <div className="bg-slate-900 p-6 text-white flex justify-between items-center flex-shrink-0">
                    <div>
                        <h3 className="font-black text-xl tracking-tighter uppercase italic">Registro Técnico</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Actualización de Libreta Digital</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-800 rounded-2xl">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">

                    {/* SELECCION VACA */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Animal</label>
                        <select
                            required
                            className="w-full p-4 border-2 border-slate-100 rounded-2xl text-slate-900 bg-slate-50 font-black focus:border-indigo-500 outline-none transition-all shadow-sm appearance-none"
                            value={selectedCowId}
                            onChange={(e) => setSelectedCowId(e.target.value)}
                        >
                            <option value="">Seleccionar Caravana...</option>
                            {cows.map(cow => (
                                <option key={cow.id} value={cow.id}>#{cow.id} ({cow.raza})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: 'celo', label: 'Celo', icon: <Clock />, restricted: false },
                            { id: 'inseminacion', label: 'IA', icon: <Droplet />, restricted: true },
                            { id: 'tacto', label: 'Tacto', icon: <Stethoscope />, restricted: true },
                            { id: 'parto', label: 'Parto', icon: <Baby />, restricted: false },
                            { id: 'sanidad', label: 'Sanidad', icon: <ShieldCheck />, restricted: true },
                            { id: 'controlLechero', label: 'Leche', icon: <FlaskConical />, restricted: false }
                        ].map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                disabled={t.restricted && !canRecordMedicalOrIA}
                                onClick={() => setTipo(t.id as any)}
                                className={`p-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${tipo === t.id ? 'bg-slate-900 text-white scale-105 shadow-xl' :
                                        (t.restricted && !canRecordMedicalOrIA) ? 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50' : 'bg-slate-50 border-2 border-slate-100 text-slate-400'
                                    }`}
                            >
                                <span className="w-5 h-5">{t.icon}</span>
                                <span className="text-[9px] font-black uppercase tracking-tighter">{t.label}</span>
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1">Fecha del Evento</label>
                        <input type="datetime-local" className="w-full p-4 border-2 border-slate-100 rounded-2xl font-black bg-slate-50 focus:border-indigo-500 outline-none" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                    </div>

                    {/* MEJORAS REPRO: INTENSIDAD DE CELO */}
                    {tipo === 'celo' && (
                        <div className="bg-amber-50 p-5 rounded-3xl border-2 border-amber-100 space-y-4 animate-in slide-in-from-top-4">
                            <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest text-center">Intensidad del Celo</p>
                            <div className="flex gap-2">
                                {(['Suave', 'Normal', 'Fuerte'] as const).map(i => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setIntensidadCelo(i)}
                                        className={`flex-1 py-3 rounded-2xl font-black uppercase text-[10px] transition-all ${intensidadCelo === i ? 'bg-amber-600 text-white shadow-lg' : 'bg-white text-amber-400 border-2 border-amber-100'}`}
                                    >
                                        {i}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* MEJORAS REPRO: DATOS DEL PARTO / CRÍA */}
                    {tipo === 'parto' && (
                        <div className="bg-sky-50 p-5 rounded-3xl border-2 border-sky-100 space-y-4 animate-in slide-in-from-top-4">
                            <p className="text-[10px] font-black text-sky-900 uppercase tracking-widest text-center">Ficha de la Cría</p>

                            <div>
                                <label className="block text-[9px] font-black text-sky-900 uppercase mb-2">Sexo</label>
                                <div className="flex gap-2">
                                    {(['Hembra', 'Macho', 'Mellizos'] as const).map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setSexoCria(s)}
                                            className={`flex-1 py-3 rounded-xl font-black uppercase text-[9px] transition-all ${sexoCria === s ? 'bg-sky-600 text-white' : 'bg-white text-sky-400 border border-sky-200'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[9px] font-black text-sky-900 uppercase mb-1">Peso (kg)</label>
                                    <input type="number" className="w-full p-3 rounded-xl border border-sky-200 font-bold" value={pesoCria} onChange={(e) => setPesoCria(Number(e.target.value))} />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-sky-900 uppercase mb-1">Destino</label>
                                    <select className="w-full p-3 rounded-xl border border-sky-200 font-bold bg-white outline-none" value={destinoCria} onChange={(e) => setDestinoCria(e.target.value as any)}>
                                        <option value="Campo">Se queda (Campo)</option>
                                        <option value="Venta">Venta</option>
                                        <option value="Muerto">Muerto</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CAMPOS DINÁMICOS POR TIPO */}
                    {tipo === 'sanidad' && (
                        <div className="space-y-4 animate-in slide-in-from-top-2">
                            {/* SUBTIPO MASTIDIS O GENERAL */}
                            <div className="flex gap-2">
                                {['General', 'Mastitis'].map(st => (
                                    <button
                                        key={st}
                                        type="button"
                                        onClick={() => setDetalle(st === 'Mastitis' ? 'Mastitis' : '')}
                                        className={`flex-1 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${detalle.includes('Mastitis') && st === 'Mastitis' || !detalle.includes('Mastitis') && st === 'General' ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-50 border-2 border-slate-100 text-slate-400'}`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>

                            {detalle.includes('Mastitis') && (
                                <div className="bg-red-50 p-5 rounded-3xl border-2 border-red-100 space-y-4">
                                    {/* CUARTOS AFECTADOS */}
                                    <div>
                                        <p className="text-[9px] font-black text-red-900 uppercase mb-2 text-center tracking-widest">Cuartos Afectados</p>
                                        <div className="grid grid-cols-4 gap-2">
                                            {(['AI', 'AD', 'PI', 'PD'] as Cuarto[]).map(c => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => setCuartos(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                                                    className={`py-3 rounded-xl font-black text-[10px] transition-all ${cuartos.includes(c) ? 'bg-red-500 text-white' : 'bg-white text-red-300 border border-red-100'}`}
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* GRADO DE SEVERIDAD */}
                                    <div>
                                        <p className="text-[9px] font-black text-red-900 uppercase mb-2 text-center tracking-widest">Grado de Severidad</p>
                                        <div className="flex gap-2">
                                            {([1, 2, 3] as const).map(g => (
                                                <button
                                                    key={g}
                                                    type="button"
                                                    onClick={() => {
                                                        setGrado(g);
                                                        // Lógica de Autocompletado Inteligente
                                                        if (g === 1) { setMedicamento('Pomo Intramamario'); setDiasRetiro(3); }
                                                        if (g === 2) { setMedicamento('Pomo + Antiinflamatorio'); setDiasRetiro(5); }
                                                        if (g === 3) { setMedicamento('Antibiótico Sistémico + Fluidos'); setDiasRetiro(7); }
                                                    }}
                                                    className={`flex-1 py-3 rounded-xl font-black text-[10px] transition-all ${grado === g ? 'bg-red-900 text-white' : 'bg-white text-red-900/40 border border-red-100'}`}
                                                >
                                                    Grado {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-white p-5 rounded-3xl border-2 border-slate-100 space-y-4">
                                <div>
                                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 ml-1">Medicamento / Tratamiento</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-800 outline-none focus:border-red-500 transition-all"
                                        placeholder="Ej: Cefalexina..."
                                        value={medicamento}
                                        onChange={(e) => setMedicamento(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-red-900 uppercase mb-1 ml-1">Días de Retiro (Bloqueo)</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 bg-red-50 border-2 border-red-100 rounded-xl font-black text-red-900 outline-none"
                                        value={diasRetiro}
                                        onChange={(e) => setDiasRetiro(Number(e.target.value))}
                                    />
                                    {diasRetiro > 0 && (
                                        <p className="text-[10px] font-black text-red-500 mt-2 px-1 animate-pulse">
                                            ⚠️ LIBERACIÓN: {format(addDays(new Date(fecha), diasRetiro), 'dd/MM/yyyy')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {tipo === 'tacto' && (
                        <div className="bg-indigo-50 p-5 rounded-3xl border-2 border-indigo-100 space-y-4 animate-in slide-in-from-top-4">
                            <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest text-center">Diagnóstico de Tacto</p>
                            <div className="flex gap-3">
                                {['Preñada', 'Vacía'].map(r => (
                                    <button key={r} type="button" onClick={() => setResultadoTacto(r as any)} className={`flex-1 py-4 rounded-2xl font-black uppercase text-xs transition-all ${resultadoTacto === r ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-indigo-400 border-2 border-indigo-50'}`}>{r}</button>
                                ))}
                            </div>
                            {resultadoTacto === 'Preñada' && (
                                <div>
                                    <label className="block text-[9px] font-black text-indigo-900 uppercase mb-2">Meses de Gestación</label>
                                    <input type="number" className="w-full p-3 rounded-xl border-2 border-indigo-100 font-bold" value={mesesGestacion} onChange={(e) => setMesesGestacion(Number(e.target.value))} />
                                </div>
                            )}
                        </div>
                    )}

                    {tipo === 'controlLechero' && (
                        <div className="bg-emerald-50 p-5 rounded-3xl border-2 border-emerald-100 space-y-4 animate-in slide-in-from-top-4">
                            <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest text-center">Datos de Producción</p>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-[9px] font-black text-emerald-900 uppercase mb-1">Litros</label>
                                    <input type="number" step="0.1" className="w-full p-3 rounded-xl border-2 border-emerald-100 font-bold" value={litros} onChange={(e) => setLitros(Number(e.target.value))} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[9px] font-black text-emerald-900 uppercase mb-1">Grasa %</label>
                                        <input type="number" step="0.01" className="w-full p-3 rounded-xl border-2 border-emerald-100 font-bold" value={grasa} onChange={(e) => setGrasa(Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-emerald-900 uppercase mb-1">Prot %</label>
                                        <input type="number" step="0.01" className="w-full p-3 rounded-xl border-2 border-emerald-100 font-bold" value={proteina} onChange={(e) => setProteina(Number(e.target.value))} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {tipo === 'sanidad' && (
                        <div className="bg-red-50 p-5 rounded-3xl border-2 border-red-100 space-y-4 animate-in slide-in-from-top-2">
                            <div>
                                <label className="block text-[9px] font-black text-red-900 uppercase mb-2">Días de Retiro (Bloqueo)</label>
                                <input type="number" className="w-full p-3 rounded-xl border-2 border-red-100 font-bold" value={diasRetiro} onChange={(e) => setDiasRetiro(Number(e.target.value))} />
                                <p className="text-[9px] font-bold text-red-400 mt-1 uppercase italic tracking-tighter">* La vaca saldrá del monitor automáticamente al terminar.</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Notas / Detalles</label>
                        <textarea className="w-full p-4 border-2 border-slate-100 rounded-3xl font-bold bg-slate-50 focus:border-indigo-500 outline-none transition-all" rows={3} placeholder="Escribe observaciones técnicas aquí..." value={detalle} onChange={(e) => setDetalle(e.target.value)} />
                    </div>

                    <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-[2rem] shadow-2xl active:scale-95 transition-all text-xl flex items-center justify-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-emerald-400" />
                        GUARDAR CAMBIOS
                    </button>
                </form>
            </div>
        </div>
    );
}
