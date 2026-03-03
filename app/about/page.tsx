import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Link from 'next/link';

function isHeadingBlock(block: string) {
  return (
    !block.includes('\n') &&
    !block.startsWith('http') &&
    !block.includes('Full licence text:') &&
    !block.includes('Full licence:') &&
    !block.includes('Attribution:') &&
    !block.includes('You may obtain a copy') &&
    !block.startsWith('©') &&
    !block.endsWith('.')
  );
}

function renderBlock(block: string) {
  if (isHeadingBlock(block)) {
    return (
      <h2 className="pt-2 text-base font-semibold text-slate-900" key={block}>
        {block}
      </h2>
    );
  }

  if (block.startsWith('http')) {
    return (
      <p className="break-words text-sm leading-6 text-slate-700" key={block}>
        <a className="underline underline-offset-2" href={block} rel="noreferrer" target="_blank">
          {block}
        </a>
      </p>
    );
  }

  const hyperlinkMatch = block.match(/^(Full licence(?: text)?|Attribution):\s(https?:\/\/.+)$/);

  if (hyperlinkMatch) {
    return (
      <p className="text-sm leading-6 text-slate-700" key={block}>
        {hyperlinkMatch[1]}:{' '}
        <a className="underline underline-offset-2" href={hyperlinkMatch[2]} rel="noreferrer" target="_blank">
          {hyperlinkMatch[2]}
        </a>
      </p>
    );
  }

  return (
    <p className="text-sm leading-6 text-slate-700" key={block}>
      {block}
    </p>
  );
}

export default async function AboutPage() {
  const filePath = path.join(process.cwd(), 'content/about/licences_and_data_sources.txt');
  const rawText = await readFile(filePath, 'utf8');
  const blocks = rawText
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  const [, ...contentBlocks] = blocks;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-5 py-8">
      <section
        className="rounded-[2rem] border p-6 shadow-[0_28px_80px_rgba(26,67,46,0.16)] backdrop-blur"
        style={{ backgroundColor: '#769036', borderColor: '#769036' }}
      >
        <h1 className="text-lg font-semibold text-white">Licences</h1>
      </section>
      <section className="rounded-[2rem] border border-white/50 bg-white/84 p-5 shadow-[0_22px_50px_rgba(26,67,46,0.12)] backdrop-blur">
        <div className="space-y-4">{contentBlocks.map((block) => renderBlock(block))}</div>
      </section>

      <section
        className="rounded-[2rem] border p-6 shadow-[0_28px_80px_rgba(26,67,46,0.16)] backdrop-blur"
        style={{ backgroundColor: '#769036', borderColor: '#769036' }}
      >
        <h2 className="text-lg font-semibold text-white">About</h2>
      </section>
      <section className="rounded-[2rem] border border-white/50 bg-white/84 p-5 shadow-[0_22px_50px_rgba(26,67,46,0.12)] backdrop-blur">
        <p className="text-sm leading-6 text-slate-700">
          This app was developed by Louis Dennington, a clinical psychologist with an interest in the Welsh language:{' '}
          <a className="underline underline-offset-2" href="https://www.louisdennington.co.uk" rel="noreferrer" target="_blank">
            https://www.louisdennington.co.uk
          </a>
        </p>
        <Link className="mt-4 inline-flex text-sm font-medium text-slate-700 underline underline-offset-2" href="/settings">
          Open diagnostics
        </Link>
      </section>
    </main>
  );
}
