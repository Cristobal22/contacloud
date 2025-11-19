export const dynamic = 'force-static';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { plans } from '@/lib/plans';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-image');
  const featureMultiTenant = PlaceHolderImages.find(p => p.id === 'feature-multitenant');
  const featureSecurity = PlaceHolderImages.find(p => p.id === 'feature-security');
  const featureData = PlaceHolderImages.find(p => p.id === 'feature-data');

  const features = [
    {
      title: 'Arquitectura Multi-empresa',
      description: 'Gestiona de forma segura múltiples empresas con aislamiento total de los datos.',
      image: featureMultiTenant,
    },
    {
      title: 'Seguridad Avanzada',
      description: 'Control de acceso basado en roles y seguridad robusta con Firebase.',
      image: featureSecurity,
    },
    {
      title: 'Datos Centralizados',
      description: 'Optimiza la gestión de nóminas y documentos fiscales con funciones en la nube.',
      image: featureData,
    },
  ];

  const handlePlanSelection = (planName: string) => {
    const message = `Estoy interesado en el plan ${planName} de BaseImponible.cl`;
    const whatsappUrl = `https://wa.me/56920571475?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="relative py-20 md:py-32">
          <div className="container text-center">
            <div className="mx-auto max-w-3xl">
              <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                El Futuro de la Contabilidad en la Nube está Aquí
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                BaseImponible.cl ofrece una plataforma segura y multi-empresa para que los contadores modernos gestionen las finanzas, nóminas e impuestos de las empresas con una eficiencia sin igual.
              </p>
              <div className="mt-10 flex justify-center gap-4">
                <Button asChild size="lg">
                  <Link href="/login">Comenzar</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="#features">Saber Más</Link>
                </Button>
              </div>
            </div>
          </div>
          {heroImage && (
            <div className="absolute inset-0 -z-10">
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                data-ai-hint={heroImage.imageHint}
                fill
                className="object-cover opacity-10"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background to-background" />
            </div>
          )}
        </section>

        <section id="features" className="py-20 md:py-24 bg-muted/50">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">
                Funcionalidades Potentes para la Contabilidad Moderna
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Todo lo que necesitas para optimizar tus flujos de trabajo contables.
              </p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="overflow-hidden transition-shadow hover:shadow-lg">
                  <CardContent className="p-0">
                    {feature.image && (
                      <Image
                        src={feature.image.imageUrl}
                        alt={feature.image.description}
                        data-ai-hint={feature.image.imageHint}
                        width={600}
                        height={400}
                        className="aspect-video w-full object-cover"
                      />
                    )}
                    <div className="p-6">
                      <h3 className="font-headline text-xl font-semibold">{feature.title}</h3>
                      <p className="mt-2 text-muted-foreground">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20 md:py-24">
            <div className="container">
                <div className="mx-auto max-w-2xl text-center">
                <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">
                    Planes a tu Medida
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    Elige el plan que mejor se adapte al tamaño y las necesidades de tu práctica contable.
                </p>
                </div>
                 <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan, index) => (
                        <Card key={plan.name} className={cn(plan.id === 'Team' && "border-primary")}>
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
                                    variant={plan.id === 'Team' ? "default" : "outline"}
                                    onClick={() => handlePlanSelection(plan.name)}
                                >
                                    Seleccionar Plan
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                 </div>
            </div>
        </section>


        <section className="py-20 md:py-24 bg-muted/50">
          <div className="container text-center">
            <div className="mx-auto max-w-3xl">
              <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">
                ¿Listo para transformar tu práctica contable?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Únete a BaseImponible.cl hoy y experimenta la nueva generación de software contable.
              </p>
              <div className="mt-8">
                <Button asChild size="lg">
                  <Link href="/login">Regístrate Ahora</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
