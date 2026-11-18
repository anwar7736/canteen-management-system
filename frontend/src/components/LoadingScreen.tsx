type LoadingScreenProps = {
  label?: string;
};

export default function LoadingScreen({ label = 'Preparing your workspace' }: LoadingScreenProps) {
  return (
    <div className="app-loading" role="status" aria-live="polite">
      <div className="app-loading__mark" aria-hidden="true">
        <span className="app-loading__ring" />
        <span className="app-loading__center" />
      </div>
      <div className="app-loading__label">{label}</div>
      <div className="app-loading__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
