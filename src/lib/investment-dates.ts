/**
 * Un registro de inversión pasa en un día, no en un instante: el saldo que
 * muestra el banco es el del cierre del día, y un aporte no tiene hora útil.
 * Guardarlos con la hora en que se tecleó el formulario hacía que el orden
 * dependiera del reloj —un interés escrito un minuto después del saldo quedaba
 * "posterior" a él y se sumaba encima, contando la ganancia dos veces—, y
 * además rompía la unicidad de un saldo por cuenta y día.
 *
 * Por eso todas las fechas se normalizan a medianoche UTC del día.
 */

/**
 * Medianoche UTC del día que el usuario ve en su calendario.
 *
 * Se usa en el cliente, que es el único que conoce su zona horaria: elegir el
 * 1 de agosto en Brasil produce un Date del 1 de agosto a las 00:00 locales, y
 * lo que hay que guardar es el 1 de agosto, no las 03:00 UTC de ese día.
 */
export function localDayToUtc(date: Date): Date {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
}

/**
 * Trunca a medianoche UTC. Se usa en el servidor como red de seguridad: una
 * Server Action es un endpoint público y puede llegarle cualquier fecha. Sobre
 * lo que manda el cliente ya normalizado no cambia nada.
 */
export function toUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

/**
 * Inverso de localDayToUtc: el mismo día del calendario, pero a medianoche
 * local. Hace falta para mostrar y para editar, porque date-fns y el calendario
 * trabajan en hora local: sin esto, un registro guardado como 1 de agosto a las
 * 00:00 UTC se vería como "31 jul" a cualquiera al oeste de Greenwich.
 */
export function utcDayToLocal(date: Date): Date {
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
}

/** Identidad del día, para comparar dos fechas sin que influya la hora. */
export function utcDayKey(date: Date): number {
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
}
