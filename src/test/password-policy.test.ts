import { describe, it, expect } from 'vitest';
import { checkPassword, buildPasswordSchemas, MIN_PASSWORD_LENGTH } from '@/lib/passwordPolicy';

// La i18n real no hace falta: solo comprobamos qué clave sale.
const t = (key: string) => key;
const { loginPasswordSchema, newPasswordSchema } = buildPasswordSchemas(t);

describe('política de contraseñas', () => {
  describe('rechaza lo débil', () => {
    it.each([
      ['123456789', 'auth.errors.passwordCommon'],   // la que estaba en producción
      ['123456', 'auth.errors.passwordCommon'],
      ['password123', 'auth.errors.passwordCommon'],
      ['theremainder', 'auth.errors.passwordCommon'], // el nombre de la propia tienda
      ['corta1', 'auth.errors.passwordTooShort'],
      ['12345678901234', 'auth.errors.passwordAllDigits'],
      ['abcdefghijklm', 'auth.errors.passwordSequential'],
      ['abababababab', 'auth.errors.passwordRepeated'],
      ['aaaaaaaaaaaa', 'auth.errors.passwordRepeated'],
    ])('rechaza %s', (value, expectedKey) => {
      const result = checkPassword(value);
      expect(result.ok).toBe(false);
      expect(result.errorKey).toBe(expectedKey);
    });
  });

  describe('acepta lo razonable', () => {
    it.each([
      'palmera helecho cantabria',   // frase larga, sin símbolos
      'Tr4chycarpus-princeps!',
      'el remanente de las alturas',
      'xK9m2Ppqw7Lz',
    ])('acepta %s', (value) => {
      expect(checkPassword(value).ok).toBe(true);
    });
  });

  it('exige al menos MIN_PASSWORD_LENGTH caracteres', () => {
    const justUnder = 'a1B2c3D4e5X'.slice(0, MIN_PASSWORD_LENGTH - 1);
    expect(checkPassword(justUnder).ok).toBe(false);
  });

  // Este es el caso que importa: si el login validase fuerza, la cuenta con la
  // contraseña vieja quedaría fuera y no podría entrar a cambiarla.
  describe('el login no valida fuerza', () => {
    it('acepta una contraseña antigua y débil para iniciar sesión', () => {
      expect(loginPasswordSchema.safeParse('123456789').success).toBe(true);
    });

    it('pero esa misma no vale como contraseña nueva', () => {
      expect(newPasswordSchema.safeParse('123456789').success).toBe(false);
    });

    it('rechaza la contraseña vacía', () => {
      expect(loginPasswordSchema.safeParse('').success).toBe(false);
    });
  });

  it('no confunde una frase larga con una secuencia', () => {
    expect(checkPassword('abcdefghijkl').ok).toBe(false);       // sí es secuencia
    expect(checkPassword('palmeras y helechos').ok).toBe(true); // no lo es
  });
});
