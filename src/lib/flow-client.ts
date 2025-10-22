// NOTE: Este archivo se ha deshabilitado para evitar problemas de instalación.
// La lógica se ha movido directamente a los endpoints de la API.
const flow: any = {
    send: () => Promise.reject(new Error("Flow client is disabled.")),
};
export default flow;
