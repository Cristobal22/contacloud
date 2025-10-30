
// src/lib/firebase/firestoreService.ts
import { db } from '@/firebase/config'; // Ruta correcta de la configuración de Firebase
import { collection, getDocs } from 'firebase/firestore';

export interface Empleado {
  id: string;
  nombre: string;
  rut: string;
  domicilio: string;
  oficio: string;
  fechaInicio: string; // Formato YYYY-MM-DD
  cargo: string;
  ultimaRemuneracion: number;
  remuneracionBaseVacaciones: number;
  diasVacacionesPendientesAnteriores: number;
  // ...cualquier otro campo que tengas en la BD
}

/**
 * Obtiene todos los empleados de la colección 'empleados' en Firestore.
 * @returns Una promesa que resuelve a un array de objetos Empleado.
 */
export async function getEmpleados(): Promise<Empleado[]> {
  try {
    const empleadosCol = collection(db, 'empleados');
    const snapshot = await getDocs(empleadosCol);
    
    if (snapshot.empty) {
      console.log('No se encontraron empleados.');
      return [];
    }

    const empleadosList = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        nombre: data.nombre || '',
        rut: data.rut || '',
        domicilio: data.domicilio || '',
        oficio: data.oficio || '',
        fechaInicio: data.fechaInicio || '',
        cargo: data.cargo || '',
        ultimaRemuneracion: data.ultimaRemuneracion || 0,
        remuneracionBaseVacaciones: data.remuneracionBaseVacaciones || 0,
        diasVacacionesPendientesAnteriores: data.diasVacacionesPendientesAnteriores || 0,
      } as Empleado;
    });

    return empleadosList;
  } catch (error) {
    console.error("Error al obtener los empleados desde Firestore:", error);
    throw new Error('No se pudieron cargar los empleados.');
  }
}
