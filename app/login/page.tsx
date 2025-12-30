"use client";

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, ChevronRight, ShieldCheck, Activity, UserPlus, LifeBuoy } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rescueLink, setRescueLink] = useState('');
    const [showRescue, setShowRescue] = useState(false);

    const handleRescue = async () => {
        if (!rescueLink.includes('#access_token=')) {
            setError('El link no parece válido. Asegurate de copiar el link completo que te dio el error.');
            return;
        }

        setLoading(true);
        try {
            const hash = rescueLink.split('#')[1];
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (accessToken && refreshToken) {
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                });

                if (!error) {
                    window.location.href = '/';
                } else {
                    setError('Error al procesar el link: ' + error.message);
                }
            } else {
                setError('No se encontraron las llaves de acceso en el link.');
            }
        } catch (err) {
            setError('Error crítico al procesar el link de rescate.');
        }
        setLoading(false);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
            setError('Error de Configuración: No se detectaron las llaves. Reiniciá la app (Cerrá y abrí de nuevo).');
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                if (error.message.includes('Email not confirmed')) {
                    setError('Falta confirmar tu cuenta. Por favor revisá tu email y hacé clic en el link de confirmación.');
                } else if (error.message.includes('Invalid login credentials')) {
                    setError('Credenciales incorrectas. Revisá tu email y contraseña.');
                } else {
                    setError(error.message);
                }
                setLoading(false);
            } else {
                window.location.href = '/';
            }
        } catch (err: any) {
            setError('Error de Conexión: No se pudo contactar con Supabase. Revisá tu internet.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Fondo Decorativo */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full opacity-10 blur-[100px] -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600 rounded-full opacity-10 blur-[100px] -ml-48 -mb-48"></div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="bg-indigo-600 p-4 rounded-[2rem] shadow-2xl shadow-indigo-900/50">
                            <Activity className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-white italic tracking-tighter">TAMBO<span className="text-indigo-400">PRO</span></h1>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] mt-2 opacity-70">Acceso al Sistema Gestión</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[3rem] shadow-2xl space-y-6">
                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-2xl text-red-200 text-xs font-bold text-center animate-in shake-in">
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
                                    className="w-full bg-slate-800/50 border-2 border-slate-700/50 p-5 pl-14 rounded-3xl text-white font-bold outline-none focus:border-indigo-500 transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    required
                                    type="password"
                                    placeholder="Contraseña"
                                    className="w-full bg-slate-800/50 border-2 border-slate-700/50 p-5 pl-14 rounded-3xl text-white font-bold outline-none focus:border-indigo-500 transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-3xl shadow-xl shadow-indigo-900/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <ShieldCheck className="w-6 h-6" />
                                    <span>INGRESAR AL POTRERO</span>
                                    <ChevronRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-8 space-y-4">
                    <Link href="/register" className="text-indigo-400 text-xs font-black uppercase tracking-widest hover:text-indigo-300 transition-all flex items-center justify-center gap-2">
                        <UserPlus className="w-4 h-4" /> ¿NO TENÉS CUENTA? CREAR UNA AQUÍ
                    </Link>

                    <div className="pt-4 border-t border-white/5">
                        {!showRescue ? (
                            <button
                                onClick={() => setShowRescue(true)}
                                className="text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-indigo-400 transition-all flex items-center justify-center gap-2 mx-auto"
                            >
                                <LifeBuoy className="w-3 h-3" /> ¿TENÉS PROBLEMAS CON EL MAIL DE CONFIRMACIÓN?
                            </button>
                        ) : (
                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Pellizcá y pegá aquí el link de error (el que empieza con localhost):</p>
                                <input
                                    type="text"
                                    placeholder="Pegá el link largo aquí..."
                                    className="w-full bg-slate-800/80 border border-indigo-500/30 p-4 rounded-2xl text-white text-[10px] outline-none focus:border-indigo-500"
                                    value={rescueLink}
                                    onChange={(e) => setRescueLink(e.target.value)}
                                />
                                <button
                                    onClick={handleRescue}
                                    className="w-full bg-indigo-600/20 text-indigo-400 border border-indigo-600/50 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600/40"
                                >
                                    ENTRAR CON ESTE LINK
                                </button>
                            </div>
                        )}
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-10">
                        Solo para personal autorizado del establecimiento rural "Tambo Pro" - {new Date().getFullYear()}
                    </p>
                </div>
            </div>
        </div>
    );
}
