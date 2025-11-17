"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var admin_1 = require("../src/lib/firebase/admin");
function addEconomicIndicators() {
    return __awaiter(this, void 0, void 0, function () {
        var adminApp, firestore, collectionName, documentId, docRef, docSnap, indicators, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    console.log('Conectando a Firebase...');
                    return [4 /*yield*/, (0, admin_1.getAdminApp)()];
                case 1:
                    adminApp = _a.sent();
                    firestore = adminApp.firestore();
                    collectionName = 'economic-indicators';
                    documentId = '2025-6';
                    console.log("Verificando si el documento '".concat(documentId, "' ya existe en '").concat(collectionName, "'"));
                    docRef = firestore.collection(collectionName).doc(documentId);
                    return [4 /*yield*/, docRef.get()];
                case 2:
                    docSnap = _a.sent();
                    if (docSnap.exists) {
                        console.log("El documento '".concat(documentId, "' ya existe. No se requiere ninguna acci\u00F3n."));
                        return [2 /*return*/]; // Si ya existe, no hacemos nada.
                    }
                    console.log("El documento '".concat(documentId, "' no existe. Creando y a\u00F1adiendo datos..."));
                    indicators = {
                        year: 2025,
                        month: 6,
                        uf: 37500.0, // Valor estimado para UF
                        utm: 65000.0, // Valor estimado para UTM
                        gratificationCap: 216666.0 // Valor estimado para el tope de gratificación
                    };
                    return [4 /*yield*/, docRef.set(indicators)];
                case 3:
                    _a.sent();
                    console.log('¡Éxito!');
                    console.log("Se han a\u00F1adido los indicadores econ\u00F3micos para Junio de 2025 en la colecci\u00F3n '".concat(collectionName, "'."));
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error('Ha ocurrido un error al intentar añadir los indicadores económicos:', error_1);
                    // Si ocurre un error, el script terminará con un código de salida diferente a 0.
                    process.exit(1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Ejecutamos la función principal y cerramos la conexión cuando termina.
addEconomicIndicators().then(function () {
    console.log('Script finalizado correctamente.');
    process.exit(0);
}).catch(function () {
    // El error ya se ha impreso en la consola, así que solo salimos.
    process.exit(1);
});
