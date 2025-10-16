'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Contador Individual",
    price: "$19",
    priceSuffix: "/mes",
    description: "Ideal para freelancers y contadores independientes.",
    features: [
      "Gestiona hasta 5 empresas",
      "5GB de almacenamiento",
      "Soporte por correo electrónico",
      "Acceso a todos los módulos contables",
    ],
    isCurrent: false,
  },
  {
    name: "Equipo Contable",
    price: "$49",
    priceSuffix: "/mes",
    description: "Perfecto para pequeños equipos y estudios contables.",
    features: [
      "Gestiona hasta 25 empresas",
      "25GB de almacenamiento",
      "Soporte prioritario",
      "Roles de usuario y permisos",
    ],
    isCurrent: true,
  },
  {
    name: "Empresarial",
    price: "Custom",
    priceSuffix: "",
    description: "Para grandes firmas con necesidades específicas.",
    features: [
      "Empresas ilimitadas",
      "Almacenamiento ilimitado",
      "Soporte dedicado 24/7",
      "Integraciones personalizadas (API)",
    ],
    isCurrent: false,
  }
];

export default function BillingPage() {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Facturación y Suscripción</CardTitle>
                    <CardDescription>Gestiona tu plan y revisa tu historial de pagos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <section>
                      <h2 className="text-xl font-semibold mb-4">Planes de Suscripción</h2>
                      <div className="grid md:grid-cols-3 gap-6">
                        {plans.map(plan => (
                          <Card key={plan.name} className={plan.isCurrent ? "border-primary" : ""}>
                            <CardHeader>
                              <CardTitle>{plan.name}</CardTitle>
                              <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="flex items-baseline">
                                  <span className="text-4xl font-bold">{plan.price}</span>
                                  {plan.priceSuffix && <span className="ml-1 text-muted-foreground">{plan.priceSuffix}</span>}
                              </div>
                              <ul className="space-y-2 text-sm text-muted-foreground">
                                {plan.features.map(feature => (
                                  <li key={feature} className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-primary" />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" disabled={plan.isCurrent}>
                                    {plan.isCurrent ? "Plan Actual" : "Seleccionar Plan"}
                                </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </section>
                     <Separator className="my-8" />
                    <section>
                        <h2 className="text-xl font-semibold mb-4">Historial de Pagos</h2>
                         <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                            <div className="p-6 text-center text-muted-foreground">
                                <p>No hay historial de pagos disponible.</p>
                            </div>
                        </div>
                    </section>
                </CardContent>
            </Card>
        </div>
    )
}
