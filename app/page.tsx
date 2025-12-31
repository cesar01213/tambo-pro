"use client";

import { supabase } from '@/lib/supabase';

// ... (existing imports)

export default function Home() {
  // ... (existing state)
  const router = useRouter(); // IMPORTANT: Need to import useRouter from next/navigation

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // ... (rest of the code)

  {
    !isLocked && userProfile?.role === 'admin' && (
      <button
        onClick={() => { setShowBulkLoader(true); setShowMenu(false); }}
        className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors group"
      >
        <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
          <PlusSquare className="w-5 h-5" />
        </div>
        <span className="font-black text-xs uppercase tracking-widest text-slate-700">Carga Masiva</span>
      </button>
    )
  }

  <div className="pt-2 mt-2 border-t border-slate-100">
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-4 p-4 hover:bg-red-50 rounded-2xl transition-colors group"
    >
      <div className="bg-slate-100 p-2 rounded-xl text-slate-400 group-hover:bg-red-500 group-hover:text-white transition-all">
        <LogOut className="w-5 h-5" />
      </div>
      <span className="font-black text-xs uppercase tracking-widest text-slate-500 group-hover:text-red-600">Cerrar Sesión</span>
    </button>
  </div>
                  </div >
                </div >
              )
}
            </div >
          </div >
        </div >

  <div className="grid grid-cols-3 gap-3">
    <div className="bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10 text-center">
      <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Censo Total</p>
      <p className="text-2xl font-black">{stats.total}</p>
    </div>
    <div className="bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10 text-center">
      <p className="text-[9px] text-slate-400 font-black uppercase mb-1">En Ordeñe</p>
      <p className="text-2xl font-black text-emerald-400">{stats.enOrdeñe}</p>
    </div>
    <div className="bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10 text-center">
      <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Vacas Secas</p>
      <p className="text-2xl font-black text-amber-400">{stats.secas}</p>
    </div>
  </div>
      </header >

      <div className="p-5 space-y-8 mt-2">

        {/* MONITOR DE INSEMINACIÓN (CELOS ACTIVOS) */}
        {activeHeats.length > 0 && (
          <section className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="text-xs font-black text-indigo-900 uppercase tracking-[0.2em] flex items-center gap-2">
                <Pipette className="w-5 h-5 text-indigo-600" />
                Monitor de Inseminación
              </h2>
              <span className="bg-indigo-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">{activeHeats.length} CELOS</span>
            </div>

            <div className="flex overflow-x-auto gap-4 pb-2 snap-x px-1 no-scrollbar">
              {activeHeats.map(({ cow, event }) => {
                const date = parseISO(event.fecha);
                const isAM = date.getHours() < 12;
                return (
                  <button
                    key={event.id}
                    onClick={() => setSelectedHeat({ cow, event })}
                    className="min-w-[280px] snap-center text-left"
                  >
                    <div className="bg-white p-5 rounded-[2.5rem] border-4 border-indigo-50 shadow-xl shadow-indigo-900/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-indigo-600 text-white py-1 px-4 rounded-bl-2xl font-black text-[9px] uppercase tracking-tighter">
                        Celo: {formatDateSafe(event.fecha, 'HH:mm')} hs
                      </div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[10px] text-slate-400 font-black uppercase leading-none mb-1">Vaca en Celo</p>
                          <h4 className="text-3xl font-black text-slate-900 tracking-tighter">#{cow.id}</h4>
                        </div>
                        <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600 mt-2">
                          <Activity className="w-6 h-6" />
                        </div>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-2xl flex items-center gap-3">
                        <Clock className="w-5 h-5 text-emerald-600" />
                        <div>
                          <p className="text-[9px] font-black text-emerald-700 uppercase leading-none mb-1">Inseminar:</p>
                          <p className="font-black text-emerald-800 text-sm">
                            {isAM ? 'Esta Tarde (PM)' : 'Mañana Temprano (AM)'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-[10px] font-black uppercase text-indigo-600 tracking-widest pl-1">
                        <span>Abrir Hoja Técnica</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* PRÓXIMOS CELOS (PREDICCIÓN) */}
        {upcomingHeats.length > 0 && (
          <section className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="text-xs font-black text-sky-900 uppercase tracking-[0.2em] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-600" />
                Predicción de Celos (Ciclo 21d)
              </h2>
            </div>

            <div className="flex overflow-x-auto gap-3 pb-2 snap-x px-1 no-scrollbar">
              {upcomingHeats.map(({ cow, daysUntil }) => (
                <Link href={`/cows/${cow.id}`} key={cow.id} className="min-w-[200px] snap-center">
                  <div className="bg-sky-600 p-4 rounded-3xl border-2 border-sky-400/30 flex flex-col items-center text-center shadow-lg shadow-sky-900/10">
                    <p className="text-[9px] font-black text-sky-100 uppercase leading-none mb-1">Vaca #{cow.id}</p>
                    <p className="text-lg font-black leading-tight text-white">
                      Celo en {daysUntil === 0 ? 'HOY' : `${daysUntil} días`}
                    </p>
                    <div className="mt-2 text-[8px] font-black text-sky-600 bg-white px-3 py-1 rounded-full uppercase">
                      {cow.raza}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* MODO MANTENIMIENTO: SOLO SI EL SEGURO ESTÁ QUITADO */}
        {!isLocked && (
          <section className="bg-white p-6 rounded-[2.5rem] border-4 border-slate-200 shadow-xl shadow-slate-900/5 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-slate-800 p-3 rounded-2xl text-white">
                <Settings className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-slate-800 font-black uppercase text-xs tracking-[0.2em]">Configuración de Base de Datos</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Estado: Edición Habilitada (Azul)</p>
              </div>
            </div>

            <button
              onClick={handleClearAll}
              className="w-full bg-slate-100 text-slate-500 border-2 border-slate-200 p-5 rounded-3xl font-black text-sm uppercase flex items-center justify-center gap-4 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm"
            >
              <Trash2 className="w-6 h-6" />
              Limpiar rodeo completo
            </button>
            <p className="text-center text-[9px] font-bold text-slate-400 uppercase mt-4 tracking-tighter italic">
              * Esta zona permite resetear todos los datos de la aplicación.
            </p>
          </section>
        )}

        {/* MONITOR SANITARIO ACTIVO */}
        {medical.enTratamiento > 0 && (
          <section className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="text-xs font-black text-red-600 uppercase tracking-[0.2em] flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
                Monitor Sanitario (Al Tacho)
              </h2>
              <span className="bg-red-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">{medical.enTratamiento} VACAS</span>
            </div>

            <div className="flex overflow-x-auto gap-4 pb-2 snap-x px-1 no-scrollbar">
              {medical.vacasAlTacho.map(id => {
                const treat = events.find(e => e.cowId === id && e.tipo === 'sanidad' && e.fechaLiberacion && isAfter(parseISO(e.fechaLiberacion), new Date()));
                return (
                  <Link href={`/cows/${id}`} key={id} className="min-w-[260px] snap-center">
                    <div className="bg-white p-5 rounded-[2.5rem] border-4 border-red-50 shadow-xl shadow-red-900/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-red-600 text-white py-1 px-4 rounded-bl-2xl font-black text-[9px] uppercase">Retiro Activo</div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[10px] text-slate-400 font-black uppercase leading-none mb-1">Animal</p>
                          <h4 className="text-3xl font-black text-slate-900 tracking-tighter">#{id}</h4>
                        </div>
                        <div className="bg-red-100 p-3 rounded-2xl text-red-600 mt-2">
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Liberación de Leche:</p>
                        <p className="font-black text-red-600 text-lg tracking-tight">
                          {treat?.fechaLiberacion ? formatDateSafe(treat.fechaLiberacion, 'dd MMM, yyyy') : 'Calcular...'}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-[10px] font-black uppercase text-indigo-600 tracking-widest pl-1">
                        <span>Ver Historial Mastitis</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}


        {/* ALERTAS PRODUCTIVAS */}
        {alertas.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] px-1">Alertas Técnicas</h2>
            <div className="space-y-4">
              {alertas.map(al => (
                <Link href={al.link} key={al.id}>
                  <div className={`bg-white p-5 rounded-[2.5rem] shadow-sm border-2 flex items-center gap-4 transition-all active:scale-[0.98] ${al.tipo === 'urgente' ? 'border-red-50' : 'border-slate-50'}`}>
                    <div className={`p-4 rounded-2xl ${al.tipo === 'urgente' ? 'bg-red-600' : 'bg-indigo-600'} text-white`}>
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-slate-900 leading-tight text-lg tracking-tight">{al.mensaje}</p>
                      <p className={`text-[10px] font-black uppercase mt-1 tracking-widest ${al.tipo === 'urgente' ? 'text-red-500' : 'text-indigo-600'}`}>{al.accion}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <VoiceAssistant onProcessCommand={handleVoiceCommand} />
      <FabMenu
        onAddCow={() => setShowAddCow(true)}
        onAddEvent={() => setShowAddEvent(true)}
        visible={true}
      />

      <AddCowModal isOpen={showAddCow} onClose={() => setShowAddCow(false)} />
      <AddEventModal isOpen={showAddEvent} onClose={() => setShowAddEvent(false)} initialData={voiceData} />
      <BulkLoader isOpen={showBulkLoader} onClose={() => setShowBulkLoader(false)} />
      <TeamManagementModal isOpen={showTeamModal} onClose={() => setShowTeamModal(false)} />
{
  selectedHeat && (
    <InseminationSheet
      cow={selectedHeat.cow}
      event={selectedHeat.event}
      isOpen={!!selectedHeat}
      onClose={() => setSelectedHeat(null)}
    />
  )
}

    </main >
  );
}
