export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container flex h-16 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Contador Cloud. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
