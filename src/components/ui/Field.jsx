import { useId } from 'react';

// Campo con label accesible. Se pasa el input como función para recibir el id.
export default function Field({ label, children, style }) {
  const id = useId();
  return (
    <div className="input-group" style={style}>
      <label htmlFor={id}>{label}</label>
      {children(id)}
    </div>
  );
}
