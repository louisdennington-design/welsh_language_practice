type SessionHistoryGraphProps = {
  history: Array<{ session: number; totalLearned: number; wordsShown?: number }>;
  requiresLogin?: boolean;
};

export function SessionHistoryGraph({ history, requiresLogin = false }: SessionHistoryGraphProps) {
  const graphWidth = 320;
  const graphHeight = 180;
  const padding = 24;
  const leftPadding = 42;

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
  const xStep = (graphWidth - leftPadding - padding) / (history.length - 1);
  const yTicks = [maxValue, Math.round(maxValue / 2), 0];
  const points = history
    .map((point, index) => {
      const x = leftPadding + xStep * index;
      const y = graphHeight - padding - ((graphHeight - padding * 2) * point.totalLearned) / maxValue;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <section className="rounded-[2rem] border border-white/50 bg-white/84 p-5 shadow-[0_22px_50px_rgba(26,67,46,0.12)] backdrop-blur">
      <h2 className="text-lg font-semibold text-slate-900">Learning over time</h2>
      <div className="mt-4 overflow-hidden rounded-[1.5rem] bg-[#f7f9f0] p-3">
        <svg className="h-auto w-full" viewBox={`0 0 ${graphWidth} ${graphHeight}`} aria-label="Total learned by session">
          <text
            className="fill-slate-500 text-[10px] font-medium"
            textAnchor="middle"
            transform={`translate(12 ${graphHeight / 2}) rotate(-90)`}
          >
            Total cards learned
          </text>
          <line stroke="#d7e2b9" strokeWidth="2" x1={leftPadding} x2={leftPadding} y1={padding} y2={graphHeight - padding} />
          <line
            stroke="#d7e2b9"
            strokeWidth="2"
            x1={leftPadding}
            x2={graphWidth - padding}
            y1={graphHeight - padding}
            y2={graphHeight - padding}
          />
          {yTicks.map((tick) => {
            const y = graphHeight - padding - ((graphHeight - padding * 2) * tick) / maxValue;

            return (
              <g key={tick}>
                <line stroke="#e3ebcf" strokeDasharray="4 4" strokeWidth="1.5" x1={leftPadding} x2={graphWidth - padding} y1={y} y2={y} />
                <text className="fill-slate-500 text-[10px] font-medium" textAnchor="end" x={leftPadding - 6} y={y + 3}>
                  {tick}
                </text>
              </g>
            );
          })}
          <polyline fill="none" points={points} stroke="#2C5439" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
          {history.map((point, index) => {
            const x = leftPadding + xStep * index;
            const y = graphHeight - padding - ((graphHeight - padding * 2) * point.totalLearned) / maxValue;

            return (
              <g key={`${point.session}-${point.totalLearned}`}>
                <circle cx={x} cy={y} fill="#2C5439" r="5" />
                <text className="fill-slate-500 text-[10px] font-medium" textAnchor="middle" x={x} y={graphHeight - 8}>
                  {point.session}
                </text>
              </g>
            );
          })}
          <text className="fill-slate-500 text-[10px] font-medium" textAnchor="middle" x={graphWidth / 2} y={graphHeight - 1}>
            Session
          </text>
        </svg>
      </div>
    </section>
  );
}
