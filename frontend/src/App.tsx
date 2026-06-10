export default function App() {
  return (
    <main className="min-h-screen bg-bg-primary font-base text-text-primary">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-xs uppercase tracking-label text-text-secondary">
          CivicLens
        </p>
        <h1 className="mt-2 text-2xl font-medium text-text-primary">
          Parliamentary intelligence on Poland&rsquo;s Sejm
        </h1>
        <p className="mt-4 max-w-prose text-base leading-relaxed text-text-secondary">
          Foundation scaffold. The design system in{' '}
          <code className="rounded-sm bg-bg-secondary px-1 font-mono text-sm">
            docs/design-system.md
          </code>{' '}
          is the single source of truth — every token below comes from §1.
        </p>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Members (10th term)" value="460" />
          <Stat label="Accent" value="Polish red" />
          <Stat label="Type" value="Inter / Plex" />
          <Stat label="Mode" value="Light + dark" />
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-bg-secondary p-4">
      <p className="text-xs uppercase tracking-label text-text-secondary">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg tabular-nums text-text-primary">
        {value}
      </p>
    </div>
  );
}
