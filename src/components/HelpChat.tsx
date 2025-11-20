
'use client';

import React, { useState } from 'react';
import { HelpCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchResult {
  sectionTitle: string;
  content: string;
}

export default function HelpChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null); // Estado para el mensaje de error

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    setResults([]);
    setError(null); // Limpiar errores previos

    try {
      const response = await fetch('/api/help-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Si la respuesta no es OK, lanzamos un error con el mensaje del servidor
        throw new Error(data.message || 'Error en la búsqueda');
      }
      
      setResults(data as SearchResult[]);

    } catch (err) {
      console.error('Error en la búsqueda:', err);
      if (err instanceof Error) {
          setError(err.message); // Guardar el mensaje de error para mostrarlo
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setError(null);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <div className={cn(
        'transition-all duration-300 ease-in-out',
        isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0',
        'fixed bottom-24 right-5 z-50 flex h-[500px] w-96 flex-col rounded-lg border bg-background shadow-lg'
      )}>
        <header className="flex items-center justify-between border-b p-3 bg-muted/50">
          <h4 className="font-bold text-foreground">Asistente de Ayuda</h4>
          <Button variant="ghost" size="icon" onClick={() => { setIsOpen(false); resetChat(); }} aria-label="Cerrar chat">
            <X className="h-4 w-4" />
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading && <p className="text-muted-foreground">Buscando...</p>}
          
          {/* Mostrar el mensaje de error */}
          {error && <p className="text-destructive text-sm">{error}</p>}

          {!isLoading && !error && hasSearched && results.length === 0 && (
            <p className="text-muted-foreground">No se encontraron resultados para "{query}". Intenta con otras palabras.</p>
          )}
          {!isLoading && !error && results.length > 0 && (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="p-3 rounded-md border bg-muted/30">
                  <h5 className="font-bold text-foreground">{result.sectionTitle}</h5>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.content}</p>
                </div>
              ))}
            </div>
          )}
          {!hasSearched && !error && <p className="text-muted-foreground">Haz una pregunta sobre cómo usar Contacloud.</p>}
        </main>
        <footer className="flex items-center gap-2 border-t p-3">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: ¿Cómo crear un empleado?"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isLoading} aria-label="Buscar">
            {isLoading ? '...' : <Send className="h-4 w-4"/>}
          </Button>
        </footer>
      </div>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
            'transition-all duration-300 ease-in-out h-16 w-16 rounded-full shadow-lg',
            isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
        )}
        aria-label="Abrir chat de ayuda"
      >
        <HelpCircle size={32} />
      </Button>
    </div>
  );
}
