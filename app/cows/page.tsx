"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Filter, Users, HeartPulse, TrendingDown, Baby, Inbox, ChevronRight, Pipette, Activity } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { format, parseISO, isValid } from 'date-fns';

const formatDateSafe = (dateStr: string | undefined, formatStr: string) => {
    if (!dateStr) return '--';
    const date = parseISO(dateStr);
    if (!isValid(date)) return '---';
    return format(date, formatStr);
};

export default function CowListPage() {
    const { cows, events, getGroups } = useStore();
    const [activeTab, setActiveTab] = useState<'todo' | 'secas' | 'asecar' | 'parto' | 'sanidad'>('todo');
    const [filterRaza, setFilterRaza] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const groups = getGroups();

    // Identificar vacas que han tenido sanidad recientemente o históricamente
    const vacasConHistorialSanitario = useMemo(() => {
        const ids = new Set(events.filter(e => e.tipo === 'sanidad').map(e => e.cowId));
        return cows.filter(c => ids.has(c.id));
    }, [events, cows]);

    const filteredList = useMemo(() => {
        let base = cows;
        if (activeTab === 'secas') base = groups.secas;
        if (activeTab === 'asecar') base = groups.aSecar;
        if (activeTab === 'parto') base = groups.proximasParto;
        if (activeTab === 'sanidad') base = vacasConHistorialSanitario;

        if (filterRaza) {
            base = base.filter(c => c.raza === filterRaza);
        }

        if (searchTerm) {
            base = base.filter(c => c.id.toLowerCase().includes(searchTerm.toLowerCase()) || (c.rp && c.rp.toLowerCase().includes(searchTerm.toLowerCase())));
        }

        return base;
    }, [activeTab, filterRaza, groups, cows, vacasConHistorialSanitario, searchTerm]);

    return (
        <main className="min-h-screen bg-slate-50 pb-24 font-sans">
            {/* HEADER DE NAVEGACIÓN */}
            <div className="bg-slate-900 text-white p-6 pb-16 rounded-b-[3rem] shadow-2xl relative">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/" className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black italic tracking-tighter">RODEO <span className="text-indigo-400">GENERAL</span></h1>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Gestión Total de Animales</p>
                    </div>
                </div>

                {/* BUSCADOR */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por Caravana o RP..."
                        className="w-full bg-slate-800 border-2 border-slate-700/50 p-4 pl-12 rounded-2xl text-white font-bold outline-none focus:border-indigo-500 transition-all shadow-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="p-5 -mt-12 space-y-6 relative z-10">
                {/* TABS DE ESTADO */}
                <div className="flex bg-white p-2 rounded-3xl shadow-sm border border-slate-200 overflow-x-auto no-scrollbar gap-1">
                    {[
                        { id: 'todo', label: 'Todo', icon: <Users className="w-4 h-4" /> },
                        { id: 'sanidad', label: 'Sanidad', icon: <HeartPulse className="w-4 h-4" />, count: vacasConHistorialSanitario.length },
                        { id: 'asecar', label: 'A Secar', icon: <TrendingDown className="w-4 h-4" />, count: groups.aSecar.length },
                        { id: 'parto', label: 'Partos', icon: <Baby className="w-4 h-4" />, count: groups.proximasParto.length },
                        { id: 'secas', label: 'Secas', icon: <Filter className="w-4 h-4" /> }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-slate-900 text-white' : 'text-slate-400'}`}
                        >
                            {t.icon} {t.label}
                            {t.count !== undefined && t.count > 0 && (
                                <span className="bg-indigo-500 text-white px-1.5 py-0.5 rounded text-[8px]">{t.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* FILTRO DE RAZA */}
                <div className="flex gap-2">
                    {['Holando', 'Jersey', 'Cruza'].map(raza => (
                        <button
                            key={raza}
                            onClick={() => setFilterRaza(filterRaza === raza ? null : raza)}
                            className={`flex-1 py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all ${filterRaza === raza ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-400'}`}
                        >
                            {raza}
                        </button>
                    ))}
                </div>

                {/* LISTADO RESULTANTE */}
                <div className="space-y-3">
                    {filteredList.map(cow => (
                        <Link href={`/cows/${cow.id}`} key={cow.id}>
                            <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 flex justify-between items-center active:scale-[0.98] transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black text-white ${cow.raza === 'Jersey' ? 'bg-amber-600' : cow.raza === 'Holando' ? 'bg-slate-800' : 'bg-indigo-600'}`}>
                                        <span className="text-[10px] opacity-70 leading-none">ID</span>
                                        <span className="text-lg leading-none">{cow.id}</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 tracking-tight leading-none text-base">VACA #{cow.id}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">{cow.raza} • {cow.estado}</p>
                                        {cow.senasParticulares && <p className="text-[9px] text-amber-600 font-black uppercase mt-1 italic">🎨 {cow.senasParticulares}</p>}
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-2">
                                    {cow.fpp && (
                                        <div className="bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                                            <p className="text-[8px] font-black text-indigo-800 uppercase leading-none mb-0.5">Parto</p>
                                            <p className="text-[10px] font-black text-indigo-600 opacity-80">{formatDateSafe(cow.fpp, 'dd/MM')}</p>
                                        </div>
                                    )}
                                    <ChevronRight className="w-5 h-5 text-slate-300" />
                                </div>
                            </div>
                        </Link>
                    ))}

                    {filteredList.length === 0 && (
                        <div className="text-center py-20">
                            <Inbox className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No se encontraron animales</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
