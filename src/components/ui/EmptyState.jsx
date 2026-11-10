export default function EmptyState({ icon = '🫧', children, action }) {
  return (
    <div className="empty-message">
      <div className="empty-icon">{icon}</div>
      <div>{children}</div>
      {action}
    </div>
  );
}
