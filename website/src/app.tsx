import '@fontsource-variable/gabarito';
import '@fontsource/geist-sans';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { Suspense } from 'solid-js';
import './app.css';
import { Toaster } from './components/ui/toast';

export default function App() {
  return (
    <Router
      root={(props) => (
        <Suspense>
          {props.children}
          <Toaster />
        </Suspense>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
