import { Logo } from './logo';

export function Footer() {
  return (
    <footer className="border-t bg-gray-900 text-gray-400">
      <div className="container py-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Logo variant="horizontal" className="h-9 w-44"/>
            <div className="flex flex-col items-center gap-1 sm:items-end">
                 <p className="text-sm">
                    © {new Date().getFullYear()} BaseImponible.cl
                </p>
                <p className="text-xs">
                    Desarrollado por Asesor25.cl
                </p>
            </div>
        </div>
      </div>
    </footer>
  );
}
