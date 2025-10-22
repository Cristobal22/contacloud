// import Flow from 'flow-api-client';

// // Configura Flow con tus credenciales directamente aquí
// // <-- REEMPLAZA CON TU API KEY REAL
// const FLOW_API_KEY = '7DED014F-BB5E-4362-A08B-1L9BBD532D53'; 
// // <-- REEMPLAZA CON TU SECRET KEY REAL
// const FLOW_SECRET_KEY = '68192639ec79397b7404b38198b1c918e6de1988';

// const flow = new Flow({
//     apiKey: FLOW_API_KEY,
//     secret: FLOW_SECRET_KEY,
//     // Cambia a true cuando estés listo para producción
//     production: false, 
// });

// export default flow;

// NOTE: This file has been temporarily disabled due to installation issues with the 'flow-api-client' package.
// To re-enable, a developer must ensure the package can be installed and then uncomment the code above.
const flow: any = {
    send: () => Promise.reject(new Error("Flow client is disabled.")),
};
export default flow;
