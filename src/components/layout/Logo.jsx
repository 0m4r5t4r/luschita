export default function Logo({ onClick }) {
  return (
    <div className="logo" onClick={onClick} role="link" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick?.()}>
      <div className="logo-icon" />
      <span className="logo-text">LushCita</span>
    </div>
  );
}
