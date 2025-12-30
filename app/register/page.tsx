"use client";

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, ChevronRight, UserPlus, Activity, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (supabase.auth.getSession === undefined || process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
            setError('Error de Configuración: No se detectaron las llaves de Supabase. Por favor reiniciá la aplicación (Cerrá la ventana negra y volvé a abrirla).');
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                setError(error.message);
                setLoading(false);
            } else {
                // Si la confirmación está desactivada en Supabase, signUp devuelve una sesión inmediatamente
                if (data.session) {
                    window.location.href = '/';
                } else {
                    setSuccess(true);
                    setLoading(false);
                }
            }
        } catch (err: any) {
            setError('Error de Conexión: No se pudo contactar con el servidor. Revisá tu internet o verificá que la app esté cargando las llaves correctamente.');
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
                <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[3rem] shadow-2xl text-center space-y-6">
                    <div className="bg-emerald-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                        <Activity className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-black text-white italic tracking-tighter">¡CUENTA CREADA!</h2>
                    <p className="text-slate-400 text-sm font-bold leading-relaxed">
                        Se envió un correo de confirmación. Por favor revisá tu bandeja de entrada antes de iniciar sesión.
                    </p>
                    <Link href="/login" className="inline-flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-widest hover:text-indigo-300 transition-all">
                        <ArrowLeft className="w-4 h-4" /> VOLVER AL LOGIN
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full opacity-10 blur-[100px] -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600 rounded-full opacity-10 blur-[100px] -ml-48 -mb-48"></div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="bg-emerald-600 p-4 rounded-[2rem] shadow-2xl shadow-emerald-900/50">
                            <UserPlus className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-white italic tracking-tighter">TAMBO<span className="text-emerald-400">PRO</span></h1>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] mt-2 opacity-70">Nuevo Registro de Usuario</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[3rem] shadow-2xl space-y-6">
                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-2xl text-red-200 text-[10px] font-bold text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    required
                                    type="email"
                                    placeholder="Tu Email (ej: tambero@campo.com)"
                                    className="w-full bg-slate-800/50 border-2 border-slate-700/50 p-5 pl-14 rounded-3xl text-white font-bold outline-none focus:border-emerald-500 transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    required
                                    type="password"
                                    placeholder="Contraseña (mín. 6 caracteres)"
                                    className="w-full bg-slate-800/50 border-2 border-slate-700/50 p-5 pl-14 rounded-3xl text-white font-bold outline-none focus:border-emerald-500 transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-3xl shadow-xl shadow-emerald-900/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <UserPlus className="w-6 h-6" />
                                    <span>CREAR MI CUENTA</span>
                                    <ChevronRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-8">
                    <Link href="/login" className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-2">
                        <ArrowLeft className="w-3 h-3" /> YA TENGO UNA CUENTA - ENTRAR
                    </Link>
                </div>
            </div>
        </div>
    );
}
