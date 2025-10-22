export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container flex h-16 flex-col items-center justify-center gap-1 py-4">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} BaseImponible.cl. All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground">
          Desarrollado por Asesor25.cl
        </p>
      </div>
    </footer>
  );
}
