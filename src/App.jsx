import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import Background from './components/layout/Background';
import Header from './components/layout/Header';
import { useGlassEffects } from './hooks/useGlassEffects';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';

export default function App() {
  useGlassEffects();
  const location = useLocation();
  const navigate = useNavigate();
  const { authReady, user } = useApp();

  // Ruta protegida: /panel exige sesión de negocio.
  useEffect(() => {
    if (authReady && !user && location.pathname === '/panel') navigate('/login', { replace: true });
  }, [authReady, user, location.pathname, navigate]);

  // Las rutas /explorar y /explorar/:id comparten página (clave estable = sin re-animar al elegir negocio).
  const key = location.pathname.startsWith('/explorar') ? '/explorar' : location.pathname;

  return (
    <>
      <Background />
      <main className="glass-card spot">
        <Header />
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={key}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/panel" element={<Dashboard />} />
            <Route path="/explorar" element={<Explore />} />
            <Route path="/explorar/:bizId" element={<Explore />} />
            <Route path="*" element={<Landing />} />
          </Routes>
        </AnimatePresence>
      </main>
    </>
  );
}
