export type Raza = 'Holando' | 'Jersey' | 'Cruza';
export type Categoria = 'Ternera' | 'Vaquillona' | 'Vaca';
export type EstadoReproductivo = 'Vacía' | 'Inseminada' | 'Preñada' | 'Seca';
export type Cuarto = 'AI' | 'AD' | 'PI' | 'PD';
export type UserRole = 'admin' | 'tambero' | 'vaquero';

export interface Cow {
    id: string; // Caravana
    rp?: string; // Registro Particular
    raza: Raza;
    categoria: Categoria;
    fechaNacimiento: string;
    padre?: string;
    madre?: string;
    estado: 'Lactancia' | 'Seca';
    estadoRepro: EstadoReproductivo;
    ultimoParto?: string;
    partosTotales: number;
    fpp?: string; // Fecha Probable de Parto
    diasPreñez?: number;
    senasParticulares?: string; // Ej: "Cinta roja en cola", "Marca en oreja"
    ultimoCelo?: string; // Para predicción de 21 días
    establecimientoId?: string;
}

export interface Evento {
    id: number;
    cowId: string;
    tipo: 'celo' | 'sanidad' | 'inseminacion' | 'parto' | 'tacto' | 'controlLechero';
    fecha: string;
    detalle: string;

    // Sanidad
    gradoMastitis?: 1 | 2 | 3 | 'Clínico';
    cuartos?: Cuarto[];
    medicamento?: string;
    diasRetiro?: number;
    fechaLiberacion?: string;

    // Reproducción
    toro?: string;
    inseminador?: string;
    resultadoTacto?: 'Preñada' | 'Vacía';
    mesesGestacion?: number;
    intensidadCelo?: 'Suave' | 'Normal' | 'Fuerte'; // Grado de celo

    // Datos del Parto / Cría
    sexoCria?: 'Macho' | 'Hembra' | 'Mellizos';
    pesoCria?: number;
    destinoCria?: 'Campo' | 'Venta' | 'Muerto';

    // Producción
    // ...
    litros?: number;
    grasa?: number;
    proteina?: number;
    numeroServicio?: number; // NUEVO: Para guardar la columna "Nº" de la planilla
    establecimientoId?: string;
    recordedBy?: string;
}

export interface Alerta {
    id: string;
    tipo: 'urgente' | 'atencion' | 'info';
    mensaje: string;
    accion: string;
    link: string;
}
