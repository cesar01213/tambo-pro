"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cow, Evento, Alerta, UserRole } from '@/types';
import { isAfter, parseISO, differenceInDays, addDays, differenceInMonths, format } from 'date-fns';
import { supabase } from '@/lib/supabase';

// Mapeos para Supabase
const mapCowToDb = (cow: Cow) => ({
    id: cow.id,
    rp: cow.rp,
    raza: cow.raza,
    categoria: cow.categoria,
    fecha_nacimiento: cow.fechaNacimiento,
    padre: cow.padre,
    madre: cow.madre,
    estado: cow.estado,
    estado_repro: cow.estadoRepro,
    ultimo_parto: cow.ultimoParto,
    partos_totales: cow.partosTotales,
    fpp: cow.fpp,
    dias_preñez: cow.diasPreñez,
    senas_particulares: cow.senasParticulares,
    ultimo_celo: cow.ultimoCelo,
    establecimiento_id: cow.establecimientoId
});

const mapDbToCow = (db: any): Cow => ({
    id: db.id,
    rp: db.rp || '',
    raza: db.raza,
    categoria: db.categoria,
    fechaNacimiento: db.fecha_nacimiento,
    padre: db.padre || '',
    madre: db.madre || '',
    estado: db.estado,
    estadoRepro: db.estado_repro,
    ultimoParto: db.ultimo_parto || undefined,
    partosTotales: db.partos_totales || 0,
    fpp: db.fpp || undefined,
    diasPreñez: db.dias_preñez || 0,
    senasParticulares: db.senas_particulares || undefined,
    ultimoCelo: db.ultimo_celo || undefined,
    establecimientoId: db.establecimiento_id
});

const mapEventToDb = (e: Evento) => ({
    id: e.id,
    cow_id: e.cowId,
    tipo: e.tipo,
    fecha: e.fecha,
    detalle: e.detalle,
    grado_mastitis: e.gradoMastitis,
    cuartos: e.cuartos,
    medicamento: e.medicamento,
    dias_retiro: e.diasRetiro,
    fecha_liberacion: e.fechaLiberacion,
    resultado_tacto: e.resultadoTacto,
    meses_gestacion: e.mesesGestacion,
    litros: e.litros,
    grasa: e.grasa,
    proteina: e.proteina,
    intensidad_celo: e.intensidadCelo,
    sexo_cria: e.sexoCria,
    peso_cria: e.pesoCria,
    destino_cria: e.destinoCria,
    establecimiento_id: e.establecimientoId,
    recorded_by: e.recordedBy
});

const mapDbToEvent = (db: any): Evento => ({
    id: db.id,
    cowId: db.cow_id,
    tipo: db.tipo,
    fecha: db.fecha,
    detalle: db.detalle,
    gradoMastitis: db.grado_mastitis || undefined,
    cuartos: db.cuartos || [],
    medicamento: db.medicamento || '',
    diasRetiro: db.dias_retiro || 0,
    fechaLiberacion: db.fecha_liberacion || undefined,
    resultadoTacto: db.resultado_tacto || undefined,
    mesesGestacion: db.meses_gestacion || undefined,
    litros: db.litros || undefined,
    grasa: db.grasa || undefined,
    proteina: db.proteina || undefined,
    intensidadCelo: db.intensidad_celo || undefined,
    sexoCria: db.sexo_cria || undefined,
    pesoCria: db.peso_cria || undefined,
    destinoCria: db.destino_cria || undefined,
    establecimientoId: db.establecimiento_id,
    recordedBy: db.recorded_by
});

interface StoreState {
    cows: Cow[];
    events: Evento[];
    addCow: (cow: Cow) => void;
    bulkAddCows: (newCows: Cow[]) => void;
    deleteCow: (id: string) => void;
    addEvent: (event: Evento) => void;
    bulkAddEvents: (newEvents: Evento[]) => void;
    deleteEvent: (id: number) => void;
    getAlerts: () => Alerta[];
    getCow: (id: string) => Cow | undefined;
    getCowEvents: (id: string) => Evento[];
    getMedicalSummary: () => { enTratamiento: number; vacasAlTacho: string[] };
    getGroups: () => {
        secas: Cow[];
        lactancia: Cow[];
        aSecar: Cow[];
        proximasParto: Cow[];
        porRaza: Record<string, Cow[]>;
    };
    calculateMetrics: (cowId: string) => {
        del: number; // Días en Leche
        diasAbierta: number;
        edadMeses: number;
    };
    getActiveHeats: () => { cow: Cow; event: Evento }[];
    getUpcomingHeats: () => { cow: Cow; nextHeatDate: Date; daysUntil: number }[];
    isLocked: boolean;
    toggleLock: () => void;
    clearAllData: () => void;
    userProfile: { id: string; role: UserRole; establecimientoId: string | null } | null;
    initialized: boolean;
}

const StoreContext = createContext<StoreState | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [cows, setCows] = useState<Cow[]>([]);
    const [events, setEvents] = useState<Evento[]>([]);
    const [userProfile, setUserProfile] = useState<{ id: string; role: UserRole; establecimientoId: string | null } | null>(null);
    const [isLocked, setIsLocked] = useState(true);
    const [initialized, setInitialized] = useState(false);

    // 1. Cargar datos locales e inicializar sesión
    useEffect(() => {
        const init = async () => {
            try {
                const savedCows = localStorage.getItem('tambo_cows');
                const savedEvents = localStorage.getItem('tambo_events');
                if (savedCows) setCows(JSON.parse(savedCows));
                if (savedEvents) setEvents(JSON.parse(savedEvents));

                // Si la URL es la de placeholder, ni intentamos conectar
                if (supabase.auth === undefined || (process.env.NEXT_PUBLIC_SUPABASE_URL || '').includes('placeholder')) {
                    console.error('❌ Supabase no está configurado. Revisa las variables de entorno en Vercel.');
                    setInitialized(true);
                    return;
                }

                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error('Error de sesión inicial:', JSON.stringify(sessionError));
                }

                if (session) {
                    await fetchUserProfile(session.user.id);
                }
            } catch (err: any) {
                if (err?.message?.includes('fetch')) {
                    console.error('🌐 Error de Conexión: No se pudo contactar con Supabase. Revisa internet y las llaves de acceso.');
                } else {
                    console.error('Error crítico en inicialización:', err);
                }
            } finally {
                setInitialized(true);
            }
        };
        init();
    }, []);

    const fetchUserProfile = async (userId: string) => {
        try {
            // Un simple select es más seguro con RLS básico
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (data) {
                setUserProfile({
                    id: data.id,
                    role: data.role as UserRole,
                    establecimientoId: data.establecimiento_id
                });
            } else if (error) {
                // Si el perfil no existe, pero hay sesión, el trigger pudo haber fallado
                // o el usuario ya existía antes del script. 
                console.warn('Perfil no encontrado, el trigger puede estar pendiente o falló:', JSON.stringify(error));

                // Intentamos una recuperación mínima: si no hay perfil, lo creamos 
                // pero solo si el usuario tiene sesión activa.
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: newProfile } = await supabase
                        .from('profiles')
                        .upsert({ id: user.id, email: user.email, role: 'admin' })
                        .select()
                        .single();

                    if (newProfile) {
                        setUserProfile({
                            id: newProfile.id,
                            role: newProfile.role as UserRole,
                            establecimientoId: newProfile.establecimiento_id
                        });
                    }
                }
            }
        } catch (err) {
            console.error('Error crítico en fetchUserProfile:', err);
        }
    };

    useEffect(() => {
        if (userProfile?.establecimientoId) {
            fetchCloudData();
        }
    }, [userProfile]);

    // 2. Cargar datos desde Supabase (Filtrado por establecimiento)
    const fetchCloudData = async () => {
        if (!userProfile?.establecimientoId) return;
        try {
            const { data: cowsDb } = await supabase.from('cows').select('*').eq('establecimiento_id', userProfile.establecimientoId);
            const { data: eventsDb } = await supabase.from('events').select('*').eq('establecimiento_id', userProfile.establecimientoId);

            if (cowsDb) setCows(cowsDb.map(mapDbToCow));
            if (eventsDb) setEvents(eventsDb.map(mapDbToEvent));
        } catch (error) {
            console.error('Error cargando datos de la nube:', error);
        }
    };

    // 3. Suscribirse a cambios en tiempo real
    useEffect(() => {
        if (!userProfile?.establecimientoId) return;

        const cowsSub = supabase.channel('cows_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'cows',
                filter: `establecimiento_id=eq.${userProfile.establecimientoId}`
            }, () => fetchCloudData())
            .subscribe();

        const eventsSub = supabase.channel('events_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'events',
                filter: `establecimiento_id=eq.${userProfile.establecimientoId}`
            }, () => fetchCloudData())
            .subscribe();

        return () => {
            supabase.removeChannel(cowsSub);
            supabase.removeChannel(eventsSub);
        };
    }, []);

    // 4. Guardar datos en LoalStorage como respaldo
    useEffect(() => {
        if (initialized) {
            localStorage.setItem('tambo_cows', JSON.stringify(cows));
            localStorage.setItem('tambo_events', JSON.stringify(events));
            localStorage.setItem('tambo_locked', JSON.stringify(isLocked));
        }
    }, [cows, events, isLocked, initialized]);

    const addCow = async (cow: Cow) => {
        const fullCow = {
            ...cow,
            estadoRepro: cow.estadoRepro || 'Vacía',
            partosTotales: cow.partosTotales || 0,
            establecimientoId: userProfile?.establecimientoId || undefined
        };
        setCows(prev => [...prev.filter(c => c.id !== cow.id), fullCow]);
        await supabase.from('cows').upsert(mapCowToDb(fullCow));
    };

    const bulkAddCows = async (newCows: Cow[]) => {
        const processed = newCows.map(c => ({
            ...c,
            estadoRepro: c.estadoRepro || 'Vacía',
            partosTotales: c.partosTotales || 0,
            establecimientoId: userProfile?.establecimientoId || undefined
        }));
        setCows(prev => {
            const existingIds = new Set(newCows.map(c => c.id));
            const filteredPrev = prev.filter(c => !existingIds.has(c.id));
            return [...filteredPrev, ...processed];
        });
        await supabase.from('cows').upsert(processed.map(mapCowToDb));
    };

    const deleteCow = async (id: string) => {
        setCows(prev => prev.filter(c => c.id !== id));
        setEvents(prev => prev.filter(e => e.cowId !== id));
        await supabase.from('cows').delete().eq('id', id);
    };

    const addEvent = async (event: Evento) => {
        const fullEvent = {
            ...event,
            establecimientoId: userProfile?.establecimientoId || undefined,
            recordedBy: userProfile?.id
        };
        setEvents(prev => [fullEvent, ...prev]);
        await supabase.from('events').insert(mapEventToDb(fullEvent));

        // INTELLIGENCE: Auto-actualización de estados según el tipo de evento
        const updatedCows = cows.map(cow => {
            if (cow.id !== event.cowId) return cow;

            let updatedCow = { ...cow };

            if (event.tipo === 'inseminacion') {
                updatedCow.estadoRepro = 'Inseminada';
                updatedCow.fpp = addDays(parseISO(event.fecha), 283).toISOString();
            }

            if (event.tipo === 'tacto') {
                if (event.resultadoTacto === 'Preñada') {
                    updatedCow.estadoRepro = 'Preñada';
                    updatedCow.diasPreñez = event.mesesGestacion ? event.mesesGestacion * 30 : cow.diasPreñez;
                } else {
                    updatedCow.estadoRepro = 'Vacía';
                    updatedCow.fpp = undefined;
                    updatedCow.diasPreñez = 0;
                }
            }

            if (event.tipo === 'parto') {
                updatedCow.estadoRepro = 'Vacía';
                updatedCow.estado = 'Lactancia';
                updatedCow.ultimoParto = event.fecha;
                updatedCow.partosTotales = (updatedCow.partosTotales || 0) + 1;
                updatedCow.fpp = undefined;
                updatedCow.diasPreñez = 0;
            }

            if (event.tipo === 'celo' && cow.estadoRepro === 'Preñada') {
                updatedCow.estadoRepro = 'Vacía';
            }

            if (event.tipo === 'celo') {
                updatedCow.ultimoCelo = event.fecha;
            }

            return updatedCow;
        });

        // Actualizar local y nube para la vaca afectada
        const affectedCow = updatedCows.find(c => c.id === event.cowId);
        if (affectedCow) {
            setCows(updatedCows);
            await supabase.from('cows').upsert(mapCowToDb(affectedCow));
        }
    };

    const bulkAddEvents = async (newEvents: Evento[]) => {
        setEvents(prev => [...newEvents, ...prev]);
        await supabase.from('events').insert(newEvents.map(mapEventToDb));
    };

    const deleteEvent = async (id: number) => {
        setEvents(prev => prev.filter(e => e.id !== id));
        await supabase.from('events').delete().eq('id', id);
    };

    const getCow = (id: string) => cows.find(c => c.id === id);
    const getCowEvents = (id: string) => events.filter(e => e.cowId === id);

    const calculateMetrics = (cowId: string) => {
        const cow = getCow(cowId);
        const hoy = new Date();
        if (!cow) return { del: 0, diasAbierta: 0, edadMeses: 0 };

        const del = cow.ultimoParto ? differenceInDays(hoy, parseISO(cow.ultimoParto)) : 0;

        let diasAbierta = 0;
        if (cow.ultimoParto) {
            if (cow.estadoRepro === 'Preñada') {
                // Si está preñada, buscamos el evento de inseminación/servicio que la preñó
                const services = events.filter(e => e.cowId === cowId && e.tipo === 'inseminacion');
                if (services.length > 0) {
                    const lastService = parseISO(services[0].fecha);
                    diasAbierta = differenceInDays(lastService, parseISO(cow.ultimoParto));
                }
            } else {
                // Si sigue vacía, son los DEL actuales
                diasAbierta = del;
            }
        }

        const edadMeses = differenceInMonths(hoy, parseISO(cow.fechaNacimiento));

        return { del, diasAbierta, edadMeses };
    };

    const getMedicalSummary = () => {
        const hoy = new Date();
        const vacasAlTachoSet = new Set<string>();
        events.forEach(e => {
            if (e.tipo === 'sanidad' && e.fechaLiberacion) {
                if (isAfter(parseISO(e.fechaLiberacion), hoy)) {
                    vacasAlTachoSet.add(e.cowId);
                }
            }
        });
        return { enTratamiento: vacasAlTachoSet.size, vacasAlTacho: Array.from(vacasAlTachoSet) };
    };

    const getGroups = () => {
        const hoy = new Date();
        const groups = {
            secas: [] as Cow[],
            lactancia: [] as Cow[],
            aSecar: [] as Cow[],
            proximasParto: [] as Cow[],
            porRaza: {} as Record<string, Cow[]>,
        };

        cows.forEach(cow => {
            if (cow.estado === 'Seca') groups.secas.push(cow);
            if (cow.estado === 'Lactancia') groups.lactancia.push(cow);
            if (!groups.porRaza[cow.raza]) groups.porRaza[cow.raza] = [];
            groups.porRaza[cow.raza].push(cow);

            if (cow.fpp) {
                const fppDate = parseISO(cow.fpp);
                const diasAlParto = differenceInDays(fppDate, hoy);
                if (diasAlParto >= 0 && diasAlParto <= 15) groups.proximasParto.push(cow);
                const fechaSecadoSugerida = addDays(fppDate, -60);
                const diasAlSecado = differenceInDays(fechaSecadoSugerida, hoy);
                if (diasAlSecado >= -7 && diasAlSecado <= 15 && cow.estado === 'Lactancia') groups.aSecar.push(cow);
            }
        });
        return groups;
    };

    const getAlerts = (): Alerta[] => {
        const alertas: Alerta[] = [];
        const hoy = new Date();

        // 1. Alertas de Retiro de Leche
        events.forEach(e => {
            if (e.tipo === 'sanidad' && e.fechaLiberacion) {
                const lib = parseISO(e.fechaLiberacion);
                if (isAfter(lib, hoy)) {
                    alertas.push({
                        id: `retiro-${e.id}`,
                        tipo: 'urgente',
                        mensaje: `Vaca ${e.cowId} - ORDEÑAR AL TACHO`,
                        accion: `Liberación: ${format(lib, 'dd/MM')}`,
                        link: `/cows/${e.cowId}`
                    });
                }
            }
        });

        // 2. Alertas Reproductivas (Celo, Repetición, DEL alto)
        cows.forEach(cow => {
            const metrics = calculateMetrics(cow.id);
            if (metrics.del > 300 && cow.estadoRepro !== 'Preñada' && cow.estado === 'Lactancia') {
                alertas.push({
                    id: `del-alto-${cow.id}`,
                    tipo: 'urgente',
                    mensaje: `Vaca ${cow.id} - DEL CRÍTICO (${metrics.del} días)`,
                    accion: 'REVISAR POR QUÉ NO PREÑA',
                    link: `/cows/${cow.id}`
                });
            }
        });

        return alertas.slice(0, 10);
    };

    const getActiveHeats = () => {
        const hoy = new Date();
        const activeHeats: { cow: Cow; event: Evento }[] = [];

        events.forEach(e => {
            if (e.tipo === 'celo') {
                const eventDate = parseISO(e.fecha);
                const diffHours = Math.abs(differenceInDays(hoy, eventDate) * 24);
                // Si es en las últimas 24 horas y la vaca no fue inseminada después de este celo
                if (differenceInDays(hoy, eventDate) < 1) {
                    const cow = getCow(e.cowId);
                    if (cow && cow.estadoRepro !== 'Inseminada' && cow.estadoRepro !== 'Preñada') {
                        activeHeats.push({ cow, event: e });
                    }
                }
            }
        });
        return activeHeats;
    };

    const getUpcomingHeats = () => {
        const hoy = new Date();
        const predictions: { cow: Cow; nextHeatDate: Date; daysUntil: number }[] = [];

        cows.forEach(cow => {
            if (cow.ultimoCelo && cow.estadoRepro !== 'Preñada') {
                const lastHeat = parseISO(cow.ultimoCelo);
                const nextHeat = addDays(lastHeat, 21);
                const daysUntil = differenceInDays(nextHeat, hoy);

                // Mostrar predicciones para los próximos 3 días
                if (daysUntil >= 0 && daysUntil <= 3) {
                    predictions.push({ cow, nextHeatDate: nextHeat, daysUntil });
                }
            }
        });
        return predictions.sort((a, b) => a.daysUntil - b.daysUntil);
    };

    const toggleLock = () => setIsLocked(!isLocked);

    const clearAllData = () => {
        if (isLocked) return;
        setCows([]);
        setEvents([]);
    };

    return (
        <StoreContext.Provider value={{
            cows, events, addCow, bulkAddCows, deleteCow, addEvent, bulkAddEvents, deleteEvent,
            getAlerts, getCow, getCowEvents, getMedicalSummary, getGroups,
            calculateMetrics, getActiveHeats, getUpcomingHeats, isLocked, toggleLock, clearAllData,
            userProfile, initialized
        }}>
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const context = useContext(StoreContext);
    if (context === undefined) throw new Error('useStore must be used within a StoreProvider');
    return context;
}
