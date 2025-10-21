
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
import { useUser, useFirestore } from "@/firebase";
import { useUserProfile } from "@/firebase/auth/use-user-profile";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { plans } from "@/lib/plans";

export default function BillingPage() {
    const { user, loading: userLoading } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile(user?.uid);
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = React.useState(false);

    const handleSelectPlan = async (planId: string) => {
        if (!firestore || !user) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo seleccionar el plan.'});
            return;
        }
        
        setIsProcessing(true);
        const userRef = doc(firestore, 'users', user.uid);
        try {
            await updateDoc(userRef, { plan: planId });
            toast({ title: 'Plan Actualizado', description: `Tu plan ha sido cambiado a ${planId}.`});
        } catch (error) {
            console.error('Error updating plan:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar tu plan.'});
        } finally {
            setIsProcessing(false);
        }
    };

    const loading = userLoading || profileLoading;
    const currentPlanId = userProfile?.plan || 'Individual';

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
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
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
                          <Card key={plan.name} className={cn(isCurrent && "border-primary")}>
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
                                    onClick={() => handleSelectPlan(plan.id)}
                                >
                                    {isProcessing ? "Procesando..." : (isCurrent ? "Plan Actual" : "Seleccionar Plan")}
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
