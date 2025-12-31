"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/context/StoreContext';
import { Building2, Plus, ArrowRight, LogOut, Link as LinkIcon } from 'lucide-react';

export default function EstablishmentSetup() {
    const { userProfile } = useStore();
    const [nombre, setNombre] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim()) return;
        setLoading(true);
        setError('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No hay sesión activa');

            // 1. Crear establecimiento
            const { data: est, error: estError } = await supabase
                .from('establecimientos')
                .insert({ nombre: nombre.trim() })
                .select()
                .single();

            if (estError) throw estError;

            // 2. Asociar al usuario actual (Upsert por seguridad)
            const { error: profError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    establecimiento_id: est.id,
                    role: 'admin',
                    email: user.email
                });

            if (profError) throw profError;

            window.location.reload();
        } catch (err: any) {
            setError(err.message || 'Error al crear el establecimiento');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;
        setLoading(true);
        setError('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No hay sesión activa');

            // 1. Verificar si el establecimiento existe
            const { data: est, error: estError } = await supabase
                .from('establecimientos')
                .select('id, nombre')
                .eq('id', joinCode.trim())
                .single();

            if (estError || !est) throw new Error('El código de establecimiento no es válido.');

            // 2. Asociar al usuario
            const { error: profError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    establecimiento_id: est.id,
                    role: userProfile?.role || 'tambero', // Mantener rol si ya tiene uno
                    email: user.email || `personal-${user.id.slice(0, 6)}@tambo.anon`
                });

            if (profError) throw profError;

            window.location.reload();
        } catch (err: any) {
            setError(err.message || 'Error al vincularse al establecimiento');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border-4 border-white">
                <div className="bg-slate-900 p-10 text-center relative">
                    <div className="absolute top-6 right-6">
                        <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="bg-indigo-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-900/40 transform -rotate-12 animate-in zoom-in-50 duration-500">
                        <Building2 className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase">Tambo <span className="text-indigo-400">Pro</span></h1>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mt-2 leading-none">Configuración de Acceso</p>
                </div>

                <div className="p-10 space-y-10">
                    {/* SECCIÓN CREAR (Solo para el que inicia) */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                                <Plus className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter leading-none">Nuevo Establecimiento</h2>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Nombre (Ej: La Esperanza)"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-800 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-300 text-sm"
                            />
                            <button
                                type="submit"
                                disabled={loading || !!joinCode}
                                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                            >
                                CREAR MI TAMBO
                            </button>
                        </form>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200"></span></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-black tracking-widest leading-none">O TAMBIÉN</span></div>
                    </div>

                    {/* SECCIÓN UNIRSE (Para el personal) */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                <LinkIcon className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter leading-none">Unirse a Equipo</h2>
                        </div>
                        <form onSubmit={handleJoin} className="space-y-4">
                            <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                placeholder="Pegá el código del tambo aquí..."
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-800 focus:border-emerald-600 outline-none transition-all placeholder:text-slate-300 text-sm uppercase"
                            />
                            <button
                                type="submit"
                                disabled={loading || !!nombre}
                                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                            >
                                VINCULARME AHORA
                            </button>
                        </form>
                    </div>

                    {error && (
                        <p className="text-red-500 text-[10px] font-black uppercase text-center bg-red-50 p-3 rounded-xl border border-red-100 italic animate-pulse">
                            ⚠️ {error}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
