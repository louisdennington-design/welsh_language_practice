import { AuthPanel } from '@/components/auth-panel';
import { MixerPanel } from '@/components/mixer-panel';
import { createSupabaseServerClient } from '@/server/supabase-server';
import { fetchAllEligibleLexiconRows } from '@/lib/lexicon-server';
import type { Database } from '@/types/database';
import type { CoreLinguisticTypeOption, ThemeOption } from '@/lib/flashcards';

export const dynamic = 'force-dynamic';

type MixerLexiconWord = Pick<
  Database['public']['Tables']['lexicon']['Row'],
  'english_1' | 'english_2' | 'english_3' | 'id' | 'spacy_pos_1' | 'welsh_lc' | 'wordnet_themes_reduced'
>;

function normalizeThemeArray(themes: string[] | null): ThemeOption[] {
  return Array.isArray(themes) ? themes : [];
}

export default async function MixerPage() {
  const supabaseServer = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  let stackWords: Array<{
    english_1: string | null;
    english_2: string | null;
    english_3: string | null;
    id: number;
    linguistic_type: CoreLinguisticTypeOption;
    themes: ThemeOption[];
    welsh_lc: string | null;
  }> = [];

  if (user) {
    const [{ data: cardStateRows, error: cardStateError }, lexiconRows] = await Promise.all([
      supabaseServer.schema('public').from('user_card_state').select('word_id, in_stack, status').eq('user_id', user.id),
      fetchAllEligibleLexiconRows<MixerLexiconWord>(
        supabaseServer,
        'id, welsh_lc, english_1, english_2, english_3, spacy_pos_1, wordnet_themes_reduced',
      ),
    ]);

    if (cardStateError) {
      console.error('Unable to load mixer stack:', cardStateError.message);
    } else {
      const stackIds = new Set((cardStateRows ?? []).filter((row) => row.in_stack && row.status === 'active').map((row) => row.word_id));
      stackWords = lexiconRows
        .filter((row) => stackIds.has(row.id) && ['ADJ', 'NOUN', 'VERB'].includes(row.spacy_pos_1 ?? ''))
        .map((row) => ({
          english_1: row.english_1,
          english_2: row.english_2,
          english_3: row.english_3,
          id: row.id,
          linguistic_type: row.spacy_pos_1 as CoreLinguisticTypeOption,
          themes: normalizeThemeArray(row.wordnet_themes_reduced),
          welsh_lc: row.welsh_lc,
        }));
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-5 py-8">
      <section
        className="rounded-[2rem] border p-6 shadow-[0_28px_80px_rgba(26,67,46,0.16)] backdrop-blur"
        style={{ backgroundColor: '#2C5439', borderColor: '#2C5439' }}
      >
        <h1 className="text-lg font-semibold tracking-tight text-white">Mixer</h1>
      </section>

      {user ? (
        <MixerPanel words={stackWords} />
      ) : (
        <section className="rounded-[2rem] border border-white/50 bg-white/84 p-6 shadow-[0_22px_50px_rgba(26,67,46,0.12)] backdrop-blur">
          <h2 className="text-xl font-semibold text-slate-900">Sign in to use Mixer</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Mixer uses the same saved stack as your flashcards and stats, so it is only available when you are signed in.
          </p>
          <div className="mt-5">
            <AuthPanel initialUserEmail={null} redirectPath="/mixer" />
          </div>
        </section>
      )}
    </main>
  );
}
