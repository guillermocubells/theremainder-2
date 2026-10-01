import { PageSEO } from "@/components/seo";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ShippingInfo = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageSEO
        title="Envíos y entregas"
        description="Información sobre preparación, envíos, plazos de entrega, devoluciones y costes de pago."
        path="/envios-y-entregas"
      />
      
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        <article className="max-w-3xl mx-auto prose prose-sm sm:prose-base prose-neutral dark:prose-invert">
          {/* Page Header */}
          <header className="text-center mb-10 md:mb-14 not-prose">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
              Envíos y entregas
            </h1>
          </header>

          {/* Sección 1 — Preparación y días de envío */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-8 mb-4">
              1. Preparación y días de envío
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Los pedidos se preparan y se envían los lunes al inicio de cada semana, salvo que se notifique lo contrario de forma interna.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Una vez preparado, el envío queda en manos del transportista correspondiente.
            </p>
          </section>

          <Separator className="my-6" />

          {/* Sección 2 — Zonas de envío */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-8 mb-4">
              2. Zonas de envío
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Enviamos principalmente dentro de la Unión Europea, con distintos proveedores según destino.
            </p>
            
            <Alert className="not-prose border-destructive/30 bg-destructive/5">
              <Info className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-foreground">
                <strong>No realizamos envíos a:</strong> Islas Canarias, Islas Baleares, Ceuta y Melilla.
              </AlertDescription>
            </Alert>
            
            <ul className="space-y-2 text-muted-foreground text-sm list-disc pl-5">
              <li><strong className="text-foreground">España (Península):</strong> envíos disponibles en toda la península.</li>
            </ul>
          </section>

          <Separator className="my-6" />

          {/* Sección 3 — Gastos de envío (cálculo automático) */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-8 mb-4">
              3. Gastos de envío
            </h2>
            
            <Alert className="not-prose border-moss/30 bg-moss/5">
              <Info className="h-4 w-4 text-moss" />
              <AlertDescription className="text-foreground">
                <strong>La web calcula automáticamente los gastos de envío</strong> según la altura y el peso de la planta.
              </AlertDescription>
            </Alert>

            <p className="text-muted-foreground text-sm mt-4">
              Para macetas especiales 40–50 cm: <strong className="text-foreground">consultar precios</strong>.
            </p>
          </section>

          <Separator className="my-6" />

          {/* Sección 4 — Tarifas orientativas (Península España) */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-8 mb-4">
              4. Tarifas de envío — España (Península)
            </h2>

            <div className="not-prose overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Coste</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Primera planta</TableCell>
                    <TableCell>8,00 €</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Cada planta adicional</TableCell>
                    <TableCell>1,50 €</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Pedidos desde 150 €</TableCell>
                    <TableCell>Envío gratuito</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <p className="text-muted-foreground text-sm italic mt-4">
              El coste exacto se muestra en el checkout antes de confirmar el pedido.
            </p>
          </section>

          <Separator className="my-6" />

          {/* Sección 5 — Tarifas por zona (resto de Europa) */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-8 mb-4">
              5. Tarifas de envío — resto de Europa
            </h2>

            <div className="not-prose overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zona</TableHead>
                    <TableHead>Países</TableHead>
                    <TableHead>1.ª planta</TableHead>
                    <TableHead>Adicional</TableHead>
                    <TableHead>Envío gratis</TableHead>
                    <TableHead>Días</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Portugal</TableCell>
                    <TableCell className="text-muted-foreground text-xs">Portugal</TableCell>
                    <TableCell>12,00 €</TableCell>
                    <TableCell>2,00 €</TableCell>
                    <TableCell>200 €</TableCell>
                    <TableCell>3–5</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Francia</TableCell>
                    <TableCell className="text-muted-foreground text-xs">Francia</TableCell>
                    <TableCell>15,00 €</TableCell>
                    <TableCell>2,50 €</TableCell>
                    <TableCell>250 €</TableCell>
                    <TableCell>4–6</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Italia</TableCell>
                    <TableCell className="text-muted-foreground text-xs">Italia</TableCell>
                    <TableCell>16,00 €</TableCell>
                    <TableCell>2,80 €</TableCell>
                    <TableCell>280 €</TableCell>
                    <TableCell>4–7</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Europa Central</TableCell>
                    <TableCell className="text-muted-foreground text-xs">Alemania, Austria, Bélgica, Luxemburgo, Países Bajos</TableCell>
                    <TableCell>18,00 €</TableCell>
                    <TableCell>3,00 €</TableCell>
                    <TableCell>300 €</TableCell>
                    <TableCell>5–8</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Europa del Este</TableCell>
                    <TableCell className="text-muted-foreground text-xs">Bulgaria, Croacia, Eslovaquia, Eslovenia, Hungría, Polonia, República Checa, Rumanía</TableCell>
                    <TableCell>22,00 €</TableCell>
                    <TableCell>3,50 €</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>6–10</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Países Nórdicos</TableCell>
                    <TableCell className="text-muted-foreground text-xs">Dinamarca, Finlandia, Suecia</TableCell>
                    <TableCell>25,00 €</TableCell>
                    <TableCell>4,00 €</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>6–10</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Países Bálticos</TableCell>
                    <TableCell className="text-muted-foreground text-xs">Estonia, Letonia, Lituania</TableCell>
                    <TableCell>28,00 €</TableCell>
                    <TableCell>4,50 €</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>7–12</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Irlanda, Malta, Chipre y Grecia</TableCell>
                    <TableCell className="text-muted-foreground text-xs">Chipre, Grecia, Irlanda, Malta</TableCell>
                    <TableCell>30,00 €</TableCell>
                    <TableCell>5,00 €</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>8–14</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <p className="text-muted-foreground text-sm italic mt-4">
              El coste exacto se muestra en el checkout antes de confirmar el pedido.
            </p>
          </section>

          <Separator className="my-6" />

          {/* Sección 6 — Transportistas y tiempos de entrega */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-8 mb-4">
              6. Transportistas y tiempos de entrega
            </h2>
            
            <ul className="space-y-2 text-muted-foreground text-sm list-disc pl-5">
              <li><strong className="text-foreground">España (Península):</strong> Seur → 2–4 días laborables</li>
              <li><strong className="text-foreground">Resto de Europa:</strong> DPD Group (estándar) → según zona, ver la tabla del apartado 5</li>
            </ul>

            <p className="text-muted-foreground text-sm italic mt-4">
              Los plazos son estimados y pueden variar según la temporada y las condiciones del transporte.
            </p>
          </section>

          <Separator className="my-6" />

          {/* Sección 7 — Devoluciones */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-8 mb-4">
              7. Devoluciones
            </h2>
            
            <ul className="space-y-3 text-muted-foreground text-sm list-disc pl-5">
              <li>Las devoluciones solo se aceptan durante los <strong className="text-foreground">15 días posteriores</strong> a la entrega de la planta.</li>
              <li>Transcurrido ese plazo, no se aceptarán devoluciones, ya que el deterioro suele deberse a mala manipulación o condiciones de cultivo.</li>
              <li>Las devoluciones serán <strong className="text-foreground">a cargo del comprador</strong> si las plantas llegan en buen estado y cumplen las medidas especificadas en el anuncio.</li>
            </ul>
          </section>

          <Separator className="my-6" />

          {/* Sección 8 — Pagos y comisiones */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-8 mb-4">
              8. Pagos y comisiones
            </h2>
            
            <ul className="space-y-2 text-muted-foreground text-sm list-disc pl-5">
              <li><strong className="text-foreground">PayPal:</strong> coste adicional del 3,20% del importe total de la compra.</li>
              <li><strong className="text-foreground">Stripe:</strong> puede aplicar un coste adicional según la plataforma y método de pago.</li>
              <li><strong className="text-foreground">Resto de métodos de pago:</strong> sin coste adicional.</li>
            </ul>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default ShippingInfo;
