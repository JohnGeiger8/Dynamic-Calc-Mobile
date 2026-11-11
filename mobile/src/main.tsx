import React, { Component, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { IonApp, setupIonicReact } from '@ionic/react';
import '@ionic/react/css/core.css';
import './style.css';

setupIonicReact();
const Battle = lazy(() => import('./Battle'));
class ErrorBoundary extends Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="state" role="alert"><h1>Battle could not load</h1><p>Reload the page to try again.</p><button onClick={() => window.location.reload()}>Reload</button></main>;
    return this.props.children;
  }
}
createRoot(document.getElementById('root')!).render(
  <IonApp><ErrorBoundary><Suspense fallback={<main className="state" role="status"><h1>Loading Battle…</h1><p>Please wait.</p></main>}><Battle /></Suspense></ErrorBoundary></IonApp>,
);
