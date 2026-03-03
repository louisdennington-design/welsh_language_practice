type SessionHistoryGraphProps = {
  history: Array<{ session: number; totalLearned: number; wordsShown?: number }>;
  requiresLogin?: boolean;
};

export function SessionHistoryGraph({ history, requiresLogin = false }: SessionHistoryGraphProps) {
  const graphWidth = 320;
  const graphHeight = 180;
  const padding = 24;

  if (requiresLogin) {
    return (
      <section className="rounded-[2rem] border border-white/50 bg-white/84 p-5 shadow-[0_22px_50px_rgba(26,67,46,0.12)] backdrop-blur">
        <h2 className="text-lg font-semibold text-slate-900">Learning over time</h2>
        <p className="mt-4 text-sm leading-6 text-slate-600">Login to display graph.</p>
      </section>
    );
  }

  if (history.length < 2) {
    return (
      <section className="rounded-[2rem] border border-white/50 bg-white/84 p-5 shadow-[0_22px_50px_rgba(26,67,46,0.12)] backdrop-blur">
        <h2 className="text-lg font-semibold text-slate-900">Learning over time</h2>
        <p className="mt-4 text-sm leading-6 text-slate-600">Complete two or more sessions to display graph.</p>
      </section>
    );
  }

  const maxValue = Math.max(...history.map((point) => point.totalLearned), 1);
  const xStep = (graphWidth - padding * 2) / (history.length - 1);
  const points = history
    .map((point, index) => {
      const x = padding + xStep * index;
      const y = graphHeight - padding - ((graphHeight - padding * 2) * point.totalLearned) / maxValue;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <section className="rounded-[2rem] border border-white/50 bg-white/84 p-5 shadow-[0_22px_50px_rgba(26,67,46,0.12)] backdrop-blur">
      <h2 className="text-lg font-semibold text-slate-900">Learning over time</h2>
      <div className="mt-4 overflow-hidden rounded-[1.5rem] bg-[#f7f9f0] p-3">
        <svg className="h-auto w-full" viewBox={`0 0 ${graphWidth} ${graphHeight}`} aria-label="Total learned by session">
          <line stroke="#d7e2b9" strokeWidth="2" x1={padding} x2={padding} y1={padding} y2={graphHeight - padding} />
          <line
            stroke="#d7e2b9"
            strokeWidth="2"
            x1={padding}
            x2={graphWidth - padding}
            y1={graphHeight - padding}
            y2={graphHeight - padding}
          />
          <polyline fill="none" points={points} stroke="#234812" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
          {history.map((point, index) => {
            const x = padding + xStep * index;
            const y = graphHeight - padding - ((graphHeight - padding * 2) * point.totalLearned) / maxValue;

            return <circle cx={x} cy={y} fill="#769036" key={`${point.session}-${point.totalLearned}`} r="5" />;
          })}
        </svg>
      </div>
    </section>
  );
}
