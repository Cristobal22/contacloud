# Guía de Formato para Archivo Previred (Actualizado)

A continuación se detalla la estructura y validaciones para cada campo del archivo de 105 posiciones para Previred, basado en la documentación oficial.

---

### Sección 1: Datos del Trabajador (Campos 1-25)

| # | Nombre Campo | Detalle Validaciones |
|---|---|---|
| 1 | RUT Trabajador | Numérico > 0. Debe ser válido según Módulo 11. |
| 2 | DV | Carácter. Validación según Módulo 11. |
| 3 | Apellido Paterno | >= 2 caracteres, no alfabéticos o > 30 caracteres es error. |
| 4 | Apellido Materno | >= 2 caracteres, no alfabéticos o > 30 caracteres es error. |
| 5 | Nombres | >= 2 caracteres, no alfabéticos o > 30 caracteres es error. |
| 6 | Sexo | M: Masculino, F: Femenino. |
| 7 | Nacionalidad | 0: Chileno, 1: Extranjero. |
| 8 | Tipo Pago | 1: Remuneraciones, 2: Gratificaciones, 3: Bono Ley. |
| 9 | Período (Desde) | Formato `mmaaaa`. |
| 10 | Período (Hasta) | Formato `mmaaaa`. |
| 11 | Régimen Previsional | AFP, INP, etc. según Tabla N°4. |
| 12 | Tipo Trabajador | Activo, Pensionado, etc. según Tabla N°5. |
| 13 | Días Trabajados | Numérico, 0 a 30. |
| 14 | Tipo de Línea | 00: Normal, 01-06: Especial. Ver Tabla N°6. |
| 15 | Código Movimiento | Contratación, Cese, etc. según Tabla N°7. |
| 16 | Fecha Desde | `dd-mm-aaaa`. Obligatoria para movimientos 1, 3, 4, 5, 6, 7, 8, 11. |
| 17 | Fecha Hasta | `dd-mm-aaaa`. Obligatoria para movimientos 2, 3, 4, 6, 11. |
| 18 | Tramo Asig. Familiar | A, B, C, D. Ver Tabla N°8. |
| 19 | # Cargas Simples | >= 0. |
| 20 | # Cargas Maternales | >= 0. |
| 21 | # Cargas Inválidas | >= 0. |
| 22 | Asignación Familiar | >= 0. Monto no puede superar $960.000. |
| 23 | Asignación Retroactiva | >= 0. Monto no puede superar $960.000. |
| 24 | Reintegro Cargas | >= 0. Monto no puede superar $960.000. |
| 25 | Subsidio Trab. Joven | Ver Tabla Equivalencia N°9. |

---

### Sección 2: Datos AFP (Campos 26-39)

| # | Nombre Campo | Detalle Validaciones |
|---|---|---|
| 26 | Código AFP | Código válido según Tabla N°10. |
| 27 | Renta Imponible AFP | Si días trabajados > 0, RI > 0. Máximo imponible 60 UF. |
| 28 | Cotización Obligatoria AFP| Renta Imponible * Tasa Cotizaciones AFP (descontando SIS). |
| 29 | Cotización SIS | Renta Imponible * Tasa SIS. |
| 30 | Ahorro Voluntario AFP | >= 0. |
| 31-36| Datos Sustitutiva | Varios, ver PDF. |
| 37 | Puesto de Trabajo Pesado| Descripción Puesto. |
| 38 | % Cotización T. Pesado | Numérico, 02.00 a 04.00. |
| 39 | Cotización T. Pesado | Renta Imp. (27) * Tasa puesto trabajo pesado (38). |

---

### Sección 3: Ahorro Previsional (APVI/APVC) (Campos 40-49)

| # | Nombre Campo | Detalle Validaciones |
|---|---|---|
| 40 | Código Institución APVI | Código válido según Tabla N°11. |
| 41 | Número Contrato APVI | Alfanumérico, máx 20 caracteres. |
| 42 | Forma de Pago APVI | 1: Directo, 2: Indirecto. |
| 43 | Cotización APVI | >= 0. |
| 44 | Depósitos Convenidos | >= 0. |
| 45 | Código Institución APVC | Código válido según Tabla N°11. |
| 46 | Número Contrato APVC | Alfanumérico, máx 20 caracteres. |
| 47 | Forma de Pago APVC | 1: Directo, 2: Indirecto. |
| 48 | Cotización Trabajador APVC| >= 0. |
| 49 | Cotización Empleador APVC| >= 0. |

---

### Sección 4: Datos IPS - ISL - Fonasa (Campos 62-74)

| # | Nombre Campo | Detalle Validaciones |
|---|---|---|
| 62 | Código Ex Caja | Válido según Tabla N°14 EX CAJAS. |
| 64 | Renta Imponible IPS/ISL | Máximo Renta Imponible para Gratificaciones o Bono Ley. |
| 65 | Cotización Obligatoria IPS| Rta. Imp. (64) * Tasa Ex Caja (63). |
| 70 | Cotización Fonasa | 7% de la Rta. Imp. (64). En caso de CCAF, es 1.8% y 5.2% va a CCAF. |
| 71 | Cotización Acc. Trabajo | Se paga a través de ISL si no está afiliada a Mutual. |

---

### Sección 5: Datos de Salud (Campos 75-82)

| # | Nombre Campo | Detalle Validaciones |
|---|---|---|
| 75 | Código Institución Salud | Válido según Tabla N°16. |
| 76 | Número de FUN | Si es Isapre, N° de FUN. Si es Fonasa, vacío. |
| 77 | Renta Imponible Isapre | Máximo Renta Imponible. |
| 78 | Moneda Plan Isapre | 1: Pesos, 2: UF. |
| 79 | Cotización Pactada | Valor del plan. Si es Fonasa, va 0. |
| 80 | Cotización Obligatoria | 7% de Rta. Imp. (77). |
| 81 | Cotización Adicional | Cot. Pactada (79) - Cot. Legal (80). > 0. |
| 82 | Monto Garantía GES | >= 0. |

---

### Sección 6: Datos CCAF y Otros (Campos 83-105)

| # | Nombre Campo | Detalle Validaciones |
|---|---|---|
| 83 | Código Caja (CCAF) | Válido según Tabla N°18. Obligatorio si la empresa tiene CCAF. |
| 84 | Renta Imponible CCAF | Máximo Renta Imponible. |
| 85 | Créditos Personales | >= 0. |
| 90 | Cotización a CCAF | Renta Imponible (84) * 5.2%. |
| 96 | Código Mutualidad | Válido según Tabla N°19. Obligatorio si la empresa tiene Mutual. |
| 97 | Renta Imponible Mutual | Máximo Renta Imponible. |
| 98 | Cotización Acc. Trabajo | Renta Imponible (97) * Cotización Adicional. |
| 100| Renta Imponible S. Cesantía| Informar Renta total imponible. |
| 101| Aporte Trabajador S. Cesantía| 0.6% para Contrato Indefinido, 0% para otros. |
| 102| Aporte Empleador S. Cesantía| 2.4% para Contrato Indefinido, 3% para otros. |
| 105| Centro de Costos | Alfanumérico. Debe estar configurado en Previred. |
