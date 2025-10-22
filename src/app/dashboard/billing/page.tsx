'use client';

import React from "react";
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
import { useUser } from "@/firebase";
import { useUserProfile } from "@/firebase/auth/use-user-profile";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { plans } from "@/lib/plans";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export default function BillingPage() {
    const { user, loading: userLoading } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile(user?.uid);
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = React.useState(false);

    const handlePayment = async (planId: string) => {
        setIsProcessing(true);
        toast({
            title: 'Redirigiendo a la pasarela de pago...',
            description: `Estás a punto de pagar por el plan ${planId}.`,
        });

        // Simulación de redirección a Flow.cl
        // En una implementación real, aquí se generaría la URL de pago
        // y se redirigiría al usuario: router.push(paymentUrl);
        setTimeout(() => {
            toast({
                title: 'Esperando confirmación de pago',
                description: 'Una vez que el pago se confirme, tu suscripción se actualizará automáticamente.',
            });
            setIsProcessing(false);
        }, 3000);
    };

    const loading = userLoading || profileLoading;
    const currentPlanId = userProfile?.plan || 'Individual';
    const subscriptionEndDate = userProfile?.subscriptionEndDate;

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Facturación y Suscripción</CardTitle>
                    <CardDescription>Gestiona tu plan y revisa tu historial de pagos.</CardDescription>
                </CardHeader>
                <CardContent>
                     {subscriptionEndDate && (
                        <div className="mb-8 rounded-lg border bg-card p-4">
                            <h3 className="text-lg font-semibold">Tu Plan Actual: <span className="text-primary">{plans.find(p => p.id === currentPlanId)?.name}</span></h3>
                            <p className="text-muted-foreground">
                                Tu suscripción es válida hasta el: <span className="font-bold">{format(parseISO(subscriptionEndDate), "dd 'de' MMMM 'de' yyyy", { locale: es })}</span>.
                            </p>
                        </div>
                    )}
                    <section>
                      <h2 className="text-xl font-semibold mb-4">Planes de Suscripción</h2>
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                               <Card key={i}>
                                   <CardHeader>
                                        <Skeleton className="h-6 w-1/2" />
                                        <Skeleton className="h-4 w-full mt-1" />
                                   </CardHeader>
                                   <CardContent className="space-y-4">
                                        <Skeleton className="h-10 w-1/3" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-4/5" />
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-4 w-4/5" />
                                        </div>
                                   </CardContent>
                                   <CardFooter>
                                       <Skeleton className="h-10 w-full" />
                                   </CardFooter>
                               </Card>
                            ))
                        ) : (
                        plans.map(plan => {
                          const isCurrent = plan.id === currentPlanId;
                          return (
                          <Card key={plan.name} className={cn(isCurrent && "border-primary ring-1 ring-primary")}>
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
                                <Button 
                                    className="w-full"
                                    disabled={isCurrent || isProcessing}
                                    onClick={() => handlePayment(plan.id)}
                                >
                                    {isProcessing ? "Procesando..." : (isCurrent ? "Plan Actual" : "Pagar con Flow")}
                                </Button>
                            </CardFooter>
                          </Card>
                        )})
                        )}
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
