
const unidades = (num: number): string => {
    switch (num) {
        case 1: return 'un';
        case 2: return 'dos';
        case 3: return 'tres';
        case 4: return 'cuatro';
        case 5: return 'cinco';
        case 6: return 'seis';
        case 7: return 'siete';
        case 8: return 'ocho';
        case 9: return 'nueve';
        default: return '';
    }
};

const decenas = (num: number): string => {
    if (num < 10) return unidades(num);
    if (num < 20) { // 10-19
        switch (num) {
            case 10: return 'diez';
            case 11: return 'once';
            case 12: return 'doce';
            case 13: return 'trece';
            case 14: return 'catorce';
            case 15: return 'quince';
            default: return 'dieci' + unidades(num - 10);
        }
    }
    if (num < 30) return (num === 20) ? 'veinte' : 'veinti' + unidades(num - 20);

    const decena = Math.floor(num / 10);
    const unidad = num % 10;
    const base = (() => {
        switch (decena) {
            case 3: return 'treinta';
            case 4: return 'cuarenta';
            case 5: return 'cincuenta';
            case 6: return 'sesenta';
            case 7: return 'setenta';
            case 8: return 'ochenta';
            case 9: return 'noventa';
            default: return '';
        }
    })();

    return unidad > 0 ? `${base} y ${unidades(unidad)}` : base;
};

const centenas = (num: number): string => {
    if (num > 999) return 'mil ' + miles(num);
    if (num === 100) return 'cien';
    if (num < 100) return decenas(num);

    const centena = Math.floor(num / 100);
    const resto = num % 100;
    const base = (() => {
        switch (centena) {
            case 1: return 'ciento';
            case 5: return 'quinientos';
            case 7: return 'setecientos';
            case 9: return 'novecientos';
            default: return unidades(centena) + 'cientos';
        }
    })();

    return resto > 0 ? `${base} ${decenas(resto)}` : base;
};

const seccion = (num: number, divisor: number, singular: string, plural: string): string => {
    const cientos = Math.floor(num / divisor);
    const resto = num % divisor;
    let letras = '';

    if (cientos > 0) {
        if (cientos > 1) {
            letras = miles(cientos) + ' ' + plural;
        } else {
            letras = singular;
        }
    }

    if (resto > 0) {
        letras += ' ' + miles(resto);
    }

    return letras.trim();
};

const miles = (num: number): string => {
    if (num < 1000) return centenas(num);
    const miles = Math.floor(num / 1000);
    const resto = num % 1000;
    const milesTexto = miles === 1 ? 'mil' : centenas(miles) + ' mil';
    const restoTexto = resto > 0 ? ' ' + centenas(resto) : '';
    return (milesTexto + restoTexto).trim();
};

const millones = (num: number): string => {
    return seccion(num, 1000000, 'un millón', 'millones');
};

export function numeroAFrase(num: number): string {
    if (num === 0) return 'cero';

    const entero = Math.floor(num);
    const frase = millones(entero).trim();
    
    // Capitalize the first letter
    return frase.charAt(0).toUpperCase() + frase.slice(1);
}
