export default function BusinessAudioPlayer({ src, label, className = '' }) {
  if (!src) return null;

  return (
    <audio
      className={className}
      controls
      preload="none"
      src={src}
      aria-label={label}
    >
      Tu navegador no puede reproducir este archivo de audio.
    </audio>
  );
}
