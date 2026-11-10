import logoImage from '../../../logolush.png';

export default function Logo({ onClick }) {
  return (
    <div
      className="logo"
      onClick={onClick}
      role="link"
      tabIndex={0}
      aria-label="LushCita, inicio"
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
    >
      <img className="logo-image" src={logoImage} alt="LushCita" />
    </div>
  );
}
