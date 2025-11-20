
'use client';

// DEBUGGING COMPONENT: Reemplazado temporalmente para aislar el problema de renderizado.

export default function HelpChat() {
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '100px',
      height: '100px',
      backgroundColor: 'red',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
    }}>
      DEBUG
    </div>
  );
}
