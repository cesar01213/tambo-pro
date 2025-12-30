"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/context/StoreContext';
import { Building2, Plus, ArrowRight, LogOut } from 'lucide-react';

export default function EstablishmentSetup() {
    const { userProfile } = useStore();
    const [nombre, setNombre] = useState('');
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

            // Recargar la página para activar el StoreContext con el nuevo ID
            window.location.reload();
        } catch (err: any) {
            setError(err.message || 'Error al crear el establecimiento');
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
                    <h1 className="text-3xl font-black text-white tracking-tighter italic">BIENVENIDO A <span className="text-indigo-400">PRO</span></h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Configuración Inicial</p>
                </div>

                <div className="p-10 space-y-8">
                    {userProfile?.role === 'admin' ? (
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 italic tracking-tighter mb-2">Creá tu Tambo</h2>
                                <p className="text-slate-500 text-xs font-medium leading-relaxed">
                                    Para empezar a cargar tus vacas, necesitamos que le pongas un nombre a tu establecimiento.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Establecimiento</label>
                                    <input
                                        type="text"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        placeholder="Ej: La Esperanza, Tambo El Trebol..."
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-800 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-300"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-red-500 text-[10px] font-black uppercase text-center bg-red-50 p-3 rounded-xl border border-red-100 italic">
                                    ⚠️ {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-900/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loading ? 'Creando...' : 'Crear mi Tambo'}
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </form>
                    ) : (
                        <div className="text-center space-y-6">
                            <div className="bg-amber-50 p-6 rounded-3xl border-2 border-amber-100">
                                <h2 className="text-lg font-black text-amber-800 italic tracking-tighter mb-2">Acceso de Personal</h2>
                                <p className="text-amber-700 text-xs font-medium leading-relaxed">
                                    Tu cuenta está configurada como **Personal**. El Administrador de tu tambo debe asignarte a un establecimiento para que puedas ver el rodeo.
                                </p>
                            </div>
                            <p className="text-slate-400 text-[10px] font-black uppercase italic">
                                Contactá al dueño para que te habilite el acceso.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
