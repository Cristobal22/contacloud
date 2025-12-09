"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
// scripts/update-nov-2025-parameters.ts
var app_1 = require("firebase-admin/app");
var firestore_1 = require("firebase-admin/firestore");
// Asumimos que las credenciales de servicio de Google Cloud están configuradas en el entorno de ejecución.
// Por ejemplo, a través de la variable de entorno GOOGLE_APPLICATION_CREDENTIALS
try {
    (0, app_1.initializeApp)();
}
catch (e) {
    console.log('Firebase already initialized');
}
var db = (0, firestore_1.getFirestore)();
var YEAR = 2025;
var MONTH = 11;
var UTM_NOV_2025 = 69542;
// I. Parámetros Mensuales Básicos
function updateEconomicIndicators() {
    return __awaiter(this, void 0, void 0, function () {
        var docId, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    docId = "".concat(YEAR, "-").concat(String(MONTH).padStart(2, '0'));
                    data = {
                        year: YEAR,
                        month: MONTH,
                        uf: 39643.59,
                        utm: UTM_NOV_2025,
                        minWage: 529000,
                        gratificationCap: Math.round((4.75 * 529000) / 12), // 209146
                        uta: 834504,
                    };
                    return [4 /*yield*/, db.collection('economic-indicators').doc(docId).set(data)];
                case 1:
                    _a.sent();
                    console.log("[+] Indicadores Econ\u00F3micos para ".concat(docId, " actualizados."));
                    return [2 /*return*/];
            }
        });
    });
}
// II. Parámetros Anuales y Topes Imponibles
function updateTaxableCaps() {
    return __awaiter(this, void 0, void 0, function () {
        var docId, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    docId = String(YEAR);
                    data = {
                        year: YEAR,
                        afpCap: 87.8,
                        afcCap: 131.9,
                    };
                    return [4 /*yield*/, db.collection('taxable-caps').doc(docId).set(data, { merge: true })];
                case 1:
                    _a.sent();
                    console.log("[+] Topes Imponibles para el a\u00F1o ".concat(docId, " actualizados."));
                    return [2 /*return*/];
            }
        });
    });
}
// III. Tasas de Cotización Obligatoria (AFP)
function updateAfpRates() {
    return __awaiter(this, void 0, void 0, function () {
        var afpRates, batch, _i, afpRates_1, afp, docRef;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    afpRates = [
                        { name: 'Capital', rate: 11.54 },
                        { name: 'Cuprum', rate: 11.54 },
                        { name: 'Habitat', rate: 11.37 },
                        { name: 'PlanVital', rate: 11.26 },
                        { name: 'Provida', rate: 11.55 },
                        { name: 'Modelo', rate: 10.68 },
                        { name: 'Uno', rate: 10.56 },
                    ];
                    batch = db.batch();
                    for (_i = 0, afpRates_1 = afpRates; _i < afpRates_1.length; _i++) {
                        afp = afpRates_1[_i];
                        docRef = db.collection('afp-entities').doc();
                        batch.set(docRef, {
                            name: afp.name,
                            year: YEAR,
                            month: MONTH,
                            mandatoryContribution: afp.rate,
                        });
                    }
                    return [4 /*yield*/, batch.commit()];
                case 1:
                    _a.sent();
                    console.log("[+] Tasas de ".concat(afpRates.length, " AFPs para ").concat(MONTH, "/").concat(YEAR, " actualizadas."));
                    return [2 /*return*/];
            }
        });
    });
}
// IV. Tramos de Asignación Familiar
function updateFamilyAllowance() {
    return __awaiter(this, void 0, void 0, function () {
        var brackets, batch, _i, brackets_1, bracket, docRef;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    brackets = [
                        { tramo: 'A', desde: 1, hasta: 620251, monto: 22007 },
                        { tramo: 'B', desde: 620252, hasta: 905941, monto: 13505 },
                        { tramo: 'C', desde: 905942, hasta: 1412957, monto: 4267 },
                        { tramo: 'D', desde: 1412958, hasta: Infinity, monto: 0 },
                    ];
                    batch = db.batch();
                    for (_i = 0, brackets_1 = brackets; _i < brackets_1.length; _i++) {
                        bracket = brackets_1[_i];
                        docRef = db.collection('family-allowance-parameters').doc();
                        batch.set(docRef, __assign(__assign({}, bracket), { year: YEAR, month: MONTH }));
                    }
                    return [4 /*yield*/, batch.commit()];
                case 1:
                    _a.sent();
                    console.log("[+] ".concat(brackets.length, " tramos de Asignaci\u00F3n Familiar para ").concat(MONTH, "/").concat(YEAR, " actualizados."));
                    return [2 /*return*/];
            }
        });
    });
}
// V. Tabla de Impuesto Único
function updateTaxBrackets() {
    return __awaiter(this, void 0, void 0, function () {
        var taxBrackets, snapshot, deleteBatch, addBatch, _i, taxBrackets_1, bracket, docRef;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    taxBrackets = [
                        { desdeUTM: 0, hastaUTM: 13.5, factor: 0, rebajaCLP: 0 },
                        { desdeUTM: 13.5, hastaUTM: 30, factor: 0.04, rebajaCLP: 37553 },
                        { desdeUTM: 30, hastaUTM: 50, factor: 0.08, rebajaCLP: 154671 },
                        { desdeUTM: 50, hastaUTM: 70, factor: 0.135, rebajaCLP: 430505 },
                        { desdeUTM: 70, hastaUTM: 90, factor: 0.23, rebajaCLP: 1098541 },
                        { desdeUTM: 90, hastaUTM: 120, factor: 0.304, rebajaCLP: 1765735 },
                        { desdeUTM: 120, hastaUTM: 310, factor: 0.35, rebajaCLP: 2348167 },
                        { desdeUTM: 310, hastaUTM: Infinity, factor: 0.4, rebajaCLP: 3595667 },
                    ];
                    return [4 /*yield*/, db.collection('tax-parameters').get()];
                case 1:
                    snapshot = _a.sent();
                    deleteBatch = db.batch();
                    snapshot.docs.forEach(function (doc) { return deleteBatch.delete(doc.ref); });
                    return [4 /*yield*/, deleteBatch.commit()];
                case 2:
                    _a.sent();
                    console.log('[!] Tabla de Impuesto Único anterior eliminada.');
                    addBatch = db.batch();
                    for (_i = 0, taxBrackets_1 = taxBrackets; _i < taxBrackets_1.length; _i++) {
                        bracket = taxBrackets_1[_i];
                        docRef = db.collection('tax-parameters').doc();
                        addBatch.set(docRef, {
                            desdeUTM: bracket.desdeUTM,
                            hastaUTM: bracket.hastaUTM,
                            factor: bracket.factor,
                            // Convertimos la rebaja de CLP a UTM, ya que así lo espera el backend.
                            rebajaUTM: bracket.rebajaCLP / UTM_NOV_2025,
                        });
                    }
                    return [4 /*yield*/, addBatch.commit()];
                case 3:
                    _a.sent();
                    console.log("[+] ".concat(taxBrackets.length, " nuevos tramos de Impuesto \u00DAnico a\u00F1adidos."));
                    return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Iniciando actualización de parámetros para Noviembre 2025...');
                    return [4 /*yield*/, updateEconomicIndicators()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, updateTaxableCaps()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, updateAfpRates()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, updateFamilyAllowance()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, updateTaxBrackets()];
                case 5:
                    _a.sent();
                    console.log('\n--- Actualización Completada Exitosamente ---');
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (err) {
    console.error('\n*** ERROR DURANTE LA ACTUALIZACIÓN ***');
    console.error(err);
    process.exit(1);
});
