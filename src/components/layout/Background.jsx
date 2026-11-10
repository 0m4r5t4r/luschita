import { memo } from 'react';

const BUBBLES = 10;

// Fondo vivo: malla de color pastel con parallax, burbujas flotantes y grano sutil.
function Background() {
  return (
    <div className="bg" aria-hidden="true">
      <div className="bg-blob blob-a" />
      <div className="bg-blob blob-b" />
      <div className="bg-blob blob-c" />
      <div className="bg-blob blob-d" />
      <div className="bg-blob blob-e" />
      {Array.from({ length: BUBBLES }, (_, i) => (
        <span key={i} className={`bubble bubble-${i + 1}`} />
      ))}
      <div className="bg-grain" />
    </div>
  );
}

export default memo(Background);
