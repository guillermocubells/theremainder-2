import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

/**
 * jsdom no implementa IntersectionObserver, y el catalogo lo usa para el
 * scroll infinito. Sin este doble, montar PlantsGrid con resultados revienta
 * con ReferenceError en cuanto hay mas de una tanda.
 *
 * Guarda las instancias vivas para que una prueba pueda simular que el
 * centinela entra en pantalla: `intersectAll()`.
 */
class TestIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    observadores.add(this);
  }

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {
    observadores.delete(this);
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  trigger(): void {
    this.callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

const observadores = new Set<TestIntersectionObserver>();

/** Simula que el centinela del scroll infinito entra en pantalla. */
export function intersectAll(): void {
  for (const o of [...observadores]) o.trigger();
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: TestIntersectionObserver,
});
Object.defineProperty(globalThis, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: TestIntersectionObserver,
});
