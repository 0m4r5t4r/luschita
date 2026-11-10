import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { sounds, isSoundEnabled, setSoundEnabled } from '../../lib/sound';
import { useState } from 'react';
import Logo from './Logo';
import AnimatedNumber from '../ui/AnimatedNumber';

export default function Header() {
  const { currentBusiness, actions } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const go = (path) => { sounds.navigate(); navigate(path); };
  const logout = async () => { sounds.click(); await actions.signOut(); navigate('/'); };
  const toggleSound = () => { const v = !soundOn; setSoundEnabled(v); setSoundOn(v); };

  const cls = (path) => `badge${pathname.startsWith(path) ? ' active' : ''}`;

  return (
    <header className="header">
      <Logo onClick={() => { sounds.click(); navigate(currentBusiness ? '/panel' : '/'); }} />
      <nav className="header-actions">
        {currentBusiness ? (
          <>
            <span className="badge badge-wallet" onClick={() => go('/panel')} title="Ir a mi monedero">
              💰 $<AnimatedNumber value={currentBusiness.wallet.balance} decimals={2} />
            </span>
            <span className={cls('/panel')} onClick={() => go('/panel')}>Panel</span>
            <span className={cls('/explorar')} onClick={() => go('/explorar')}>Explorar</span>
            <span className="badge" onClick={logout}>Salir</span>
          </>
        ) : (
          <>
            <NavLink to="/explorar" className={cls('/explorar')} onClick={sounds.navigate}>Explorar negocios</NavLink>
            <NavLink to="/login" className={cls('/login')} onClick={sounds.navigate}>Acceso negocio</NavLink>
          </>
        )}
        <button
          type="button"
          className={`sound-toggle${soundOn ? '' : ' off'}`}
          onClick={toggleSound}
          aria-label={soundOn ? 'Silenciar sonidos' : 'Activar sonidos'}
          title={soundOn ? 'Sonidos activados' : 'Sonidos silenciados'}
        >
          {soundOn ? '🔊' : '🔇'}
        </button>
      </nav>
    </header>
  );
}
