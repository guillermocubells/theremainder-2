import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { Plant } from "@/data/plants";

// ---------- mocks ----------
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
    }),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: "es", changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}));

// Prevent PlantSearchEngine's useAISearch from triggering effect loops
// La ruta real tras la reestructura por dominios es @/hooks/catalog/*.
// Con la ruta vieja el mock no se aplicaba: el grid usaba el hook real,
// que contra el cliente de Supabase simulado devuelve cero plantas. Las
// pruebas llevaban desde entonces comprobando una rejilla vacia.
vi.mock("@/hooks/catalog/useAISearch", () => ({
  useAISearch: (_query: string, plants: Plant[]) => ({
    filteredPlants: plants,
    detectedPostalCode: null,
    climateInfo: null,
    sortedByViability: [],
  }),
  isCareQuery: () => false,
}));
vi.mock("@/contexts/CurrencyContext", () => ({
  useCurrency: () => ({
    currency: "EUR",
    setCurrency: vi.fn(),
    formatPrice: (price: number) => `€${price.toFixed(2)}`,
    convertPrice: (price: number) => price,
    rates: {},
    loading: false,
  }),
  CurrencyProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// PlantCard usa el carrito. Al arreglar el mock del catalogo, la rejilla pasa
// a pintar tarjetas de verdad y sin esto revienta con "useCart must be used
// within a CartProvider".
vi.mock("@/contexts/CartContext", () => ({
  useCart: () => ({
    items: [],
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    getItemQuantity: () => 0,
    getTotalPrice: () => 0,
    getTotalItems: () => 0,
    isCartOpen: false,
    setIsCartOpen: vi.fn(),
  }),
  CartProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function makePlant(overrides: Partial<Plant> & { id: string; name: string }): Plant {
  return {
    variety: "",
    quantity: 5,
    commonName: overrides.name,
    description: "",
    link: "",
    location: "",
    light: "Soleada",
    growthRate: "Medio",
    notes: "",
    price: 10,
    ...overrides,
  };
}

const mockPlants: Plant[] = Array.from({ length: 30 }, (_, i) =>
  makePlant({
    id: `plant-${i + 1}`,
    name: `Planta ${i + 1}`,
    plantGroup: i % 3 === 0 ? "Palmeras" : i % 3 === 1 ? "Helechos arbóreos" : "Cícadas",
    price: 10 + i,
  }),
);

vi.mock("@/hooks/catalog/useCatalogPlants", () => ({
  useCatalogPlants: () => ({
    plants: mockPlants,
    loading: false,
    error: null,
  }),
}));

import { intersectAll } from "./setup";
import PlantsGrid from "@/components/catalog/PlantsGrid";

function renderGrid() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <HelmetProvider>
      <QueryClientProvider client={qc}>
        <TooltipProvider>
          <MemoryRouter>
            <PlantsGrid />
          </MemoryRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

describe("PlantsGrid – listado y scroll infinito", () => {
  beforeEach(() => vi.clearAllMocks());

  it("muestra el numero total de plantas", async () => {
    renderGrid();
    await waitFor(() => {
      expect(screen.getByText(/30 plantas/)).toBeInTheDocument();
    });
  });

  // La tarjeta repite el nombre (titulo y nombre comun, y de nuevo en la capa
  // de hover), asi que se cuenta por "hay al menos una" y no por unicidad.
  const estaEnPantalla = (nombre: string) =>
    screen.queryAllByText(nombre).length > 0;

  it("pinta solo la primera tanda de 12", async () => {
    renderGrid();
    await waitFor(() => expect(estaEnPantalla("Planta 1")).toBe(true));
    expect(estaEnPantalla("Planta 12")).toBe(true);
    expect(estaEnPantalla("Planta 13")).toBe(false);
  });

  it("anade otra tanda cuando el centinela entra en pantalla", async () => {
    renderGrid();
    await waitFor(() => expect(estaEnPantalla("Planta 12")).toBe(true));

    await act(async () => { intersectAll(); });

    await waitFor(() => expect(estaEnPantalla("Planta 13")).toBe(true));
    expect(estaEnPantalla("Planta 24")).toBe(true);
    expect(estaEnPantalla("Planta 25")).toBe(false);
  });

  it("acaba mostrando las 30 y deja de pedir mas", async () => {
    renderGrid();
    await waitFor(() => expect(estaEnPantalla("Planta 12")).toBe(true));

    await act(async () => { intersectAll(); });
    await waitFor(() => expect(estaEnPantalla("Planta 13")).toBe(true));
    await act(async () => { intersectAll(); });

    await waitFor(() => expect(estaEnPantalla("Planta 30")).toBe(true));

    // Agotado el catalogo, el centinela desaparece: no hay mas que cargar.
    await act(async () => { intersectAll(); });
    expect(estaEnPantalla("Planta 30")).toBe(true);
  });

  it("does not show empty state when plants exist", async () => {
    renderGrid();
    await waitFor(() => {
      expect(screen.queryByText("No se encontraron plantas")).not.toBeInTheDocument();
    });
  });
});
