"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthProtection({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session && pathname !== '/login' && pathname !== '/register') {
                router.push('/login');
            } else if (session && (pathname === '/login' || pathname === '/register')) {
                router.push('/');
            } else {
                setAuthenticated(true);
            }
            setLoading(false);
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session && pathname !== '/login' && pathname !== '/register') {
                router.push('/login');
                setAuthenticated(false);
            } else if (session) {
                setAuthenticated(true);
                if (pathname === '/login' || pathname === '/register') router.push('/');
            }
        });

        return () => subscription.unsubscribe();
    }, [router, pathname]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return <>{children}</>;
}
