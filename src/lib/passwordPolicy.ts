import { z } from 'zod';

/**
 * Política de contraseñas.
 *
 * Sigue la guía del NIST (SP 800-63B): manda la longitud, no las reglas de
 * composición. Exigir mayúscula + número + símbolo empuja a la gente hacia
 * "Password1!" y no aporta seguridad real; 12 caracteres y un veto a lo obvio
 * sí lo hacen.
 *
 * IMPORTANTE — dos esquemas, no uno:
 *   - loginPasswordSchema NO valida fuerza. Quien tenga una contraseña antigua y
 *     débil debe poder entrar, precisamente para poder cambiarla. Validar fuerza
 *     en el login deja fuera a quien más necesita entrar.
 *   - newPasswordSchema SÍ. Se aplica al alta y al restablecimiento.
 *
 * Esto es validación de cliente: mejora la experiencia y frena el 99% de los
 * casos, pero cualquiera puede llamar a la API de Supabase directamente. La
 * barrera de verdad se configura en el dashboard de Supabase
 * (Authentication → Policies → minimum password length / requirements).
 */

export const MIN_PASSWORD_LENGTH = 12;

/** Las que aparecen siempre en las listas de credenciales filtradas. */
const COMMON_PASSWORDS = new Set([
  '123456', '1234567', '12345678', '123456789', '1234567890',
  'password', 'password1', 'password123', 'contraseña', 'contrasena',
  'qwerty', 'qwerty123', 'qwertyuiop', 'abc123', 'admin', 'admin123',
  'iloveyou', 'welcome', 'welcome1', 'monkey', 'dragon', 'letmein',
  '111111', '000000', 'aaaaaa', 'zxcvbn', 'football', 'baseball',
  'sunshine', 'princess', 'superman', 'trustno1', 'starwars',
  'theremainder', 'frondaprima',
]);

/** "abcdef", "123456", "cba" — teclado o alfabeto en fila. */
const isSequential = (value: string): boolean => {
  const v = value.toLowerCase();
  if (v.length < 4) return false;

  let ascending = 0;
  let descending = 0;
  for (let i = 1; i < v.length; i++) {
    const delta = v.charCodeAt(i) - v.charCodeAt(i - 1);
    if (delta === 1) ascending++;
    if (delta === -1) descending++;
  }
  // Casi toda la cadena avanza en la misma dirección.
  return ascending >= v.length - 2 || descending >= v.length - 2;
};

/** "aaaaaaaaaaaa", "abababab" — un patrón corto repetido. */
const isRepeated = (value: string): boolean => {
  const v = value.toLowerCase();
  for (let size = 1; size <= Math.floor(v.length / 3); size++) {
    const unit = v.slice(0, size);
    if (unit.repeat(Math.ceil(v.length / size)).slice(0, v.length) === v) return true;
  }
  return false;
};

export interface PasswordCheck {
  ok: boolean;
  /** Clave i18n del primer problema encontrado, o null si pasa. */
  errorKey: string | null;
}

export const checkPassword = (value: string): PasswordCheck => {
  const v = value ?? '';

  // La lista de filtradas va ANTES que la longitud a propósito. Si a quien escribe
  // "password123" le decimos solo "muy corta", alargará a "password1234" y seguirá
  // siendo pésima. Nombrar el problema real evita ese parcheo.
  if (COMMON_PASSWORDS.has(v.toLowerCase())) return { ok: false, errorKey: 'auth.errors.passwordCommon' };
  if (v.length < MIN_PASSWORD_LENGTH) return { ok: false, errorKey: 'auth.errors.passwordTooShort' };
  if (/^\d+$/.test(v)) return { ok: false, errorKey: 'auth.errors.passwordAllDigits' };
  if (isSequential(v)) return { ok: false, errorKey: 'auth.errors.passwordSequential' };
  if (isRepeated(v)) return { ok: false, errorKey: 'auth.errors.passwordRepeated' };

  return { ok: true, errorKey: null };
};

/**
 * Esquemas de zod. Reciben `t` para que los mensajes salgan traducidos, igual
 * que el resto de validaciones de la página de auth.
 */
export const buildPasswordSchemas = (t: (key: string) => string) => ({
  /** Login: solo que no esté vacía. Ver nota de arriba. */
  loginPasswordSchema: z.string().min(1, t('auth.errors.passwordRequired')),

  /** Alta y restablecimiento: política completa. */
  newPasswordSchema: z.string().superRefine((value, ctx) => {
    const { ok, errorKey } = checkPassword(value);
    if (!ok && errorKey) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: t(errorKey) });
    }
  }),
});
