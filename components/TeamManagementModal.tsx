"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/context/StoreContext';
import { UserRole } from '@/types';
import { Users, UserCog, UserCheck, Shield, HardHat, LogOut, ChevronRight, X, Loader2, Mail } from 'lucide-react';

interface TeamMember {
    id: string;
    email: string;
    role: UserRole;
    updated_at: string;
}

export default function TeamManagementModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { userProfile } = useStore();
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && userProfile?.establecimientoId) {
            fetchTeam();
        }
    }, [isOpen, userProfile]);

    const fetchTeam = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('establecimiento_id', userProfile?.establecimientoId);

        if (data) setTeam(data);
        setLoading(false);
    };

    const updateRole = async (userId: string, newRole: UserRole) => {
        setUpdating(userId);
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (!error) {
            setTeam(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m));
        }
        setUpdating(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95">
                <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black tracking-tighter uppercase italic leading-none">Mi <span className="text-indigo-400">Equipo</span></h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2">Gestión de Rangos y Accesos</p>
                    </div>
                    <button onClick={onClose} className="bg-white/10 p-2 rounded-xl text-white/70 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Cargando personal...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {team.map((member) => (
                                <div key={member.id} className="bg-slate-50 p-6 rounded-[2.5rem] border-2 border-slate-100 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${member.role === 'admin' ? 'bg-indigo-600 text-white' :
                                            member.role === 'tambero' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                                            }`}>
                                            {member.role === 'admin' ? <Shield className="w-7 h-7" /> :
                                                member.role === 'tambero' ? <UserCheck className="w-7 h-7" /> : <HardHat className="w-7 h-7" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3 h-3 text-slate-400" />
                                                <p className="text-xs font-bold text-slate-500 truncate max-w-[150px]">{member.email}</p>
                                            </div>
                                            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none mt-1">
                                                {member.id === userProfile?.id ? 'Tú (Propietario)' : 'Personal del Tambo'}
                                            </h4>
                                            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${member.role === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                                                member.role === 'tambero' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                Rango: {member.role}
                                            </span>
                                        </div>
                                    </div>

                                    {userProfile?.role === 'admin' && member.id !== userProfile.id && (
                                        <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => updateRole(member.id, 'tambero')}
                                                disabled={updating === member.id}
                                                className={`py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all ${member.role === 'tambero' ? 'bg-emerald-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-400 hover:border-emerald-600 hover:text-emerald-600'
                                                    }`}
                                            >
                                                {updating === member.id ? '...' : 'Tambero'}
                                            </button>
                                            <button
                                                onClick={() => updateRole(member.id, 'vaquero')}
                                                disabled={updating === member.id}
                                                className={`py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all ${member.role === 'vaquero' ? 'bg-amber-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-400 hover:border-amber-600 hover:text-amber-600'
                                                    }`}
                                            >
                                                {updating === member.id ? '...' : 'Vaquero'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {team.length === 0 && (
                                <div className="text-center py-10 opacity-50">
                                    <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No hay otros miembros aún</p>
                                </div>
                            )}

                            <div className="bg-indigo-50 p-6 rounded-[2.5rem] border-2 border-indigo-100 space-y-4">
                                <div>
                                    <p className="text-[9px] font-black text-indigo-900 uppercase tracking-[0.3em] mb-2 text-center">CÓDIGO DE INVITACIÓN PARA PERSONAL</p>
                                    <div className="bg-white border-2 border-indigo-200 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
                                        <code className="text-[10px] font-black text-indigo-600 truncate flex-1 uppercase tracking-tighter">
                                            {userProfile?.establecimientoId}
                                        </code>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(userProfile?.establecimientoId || '');
                                                alert('¡Código copiado! Pásaselo a tu equipo.');
                                            }}
                                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-90 transition-all shadow-md"
                                        >
                                            COPIAR CÓDIGO
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[11px] text-indigo-700 font-medium leading-relaxed text-center px-2">
                                    Comparte este código con tus empleados. Ellos deben usar la opción <strong>"ENTRAR CON CÓDIGO"</strong> en la pantalla de inicio y pegarlo cuando se les pida.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all"
                    >
                        Cerrar Gestión
                    </button>
                </div>
            </div>
        </div>
    );
}
