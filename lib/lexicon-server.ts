import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const PAGE_SIZE = 1000;

type LexiconReadableClient = Pick<SupabaseClient<Database>, 'from'>;

export async function fetchAllEligibleLexiconRows<Row extends object>(client: LexiconReadableClient, columns: string) {
  const rows: Row[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await client
      .from('lexicon')
      .select(columns)
      .not('spacy_pos_1', 'is', null)
      .not('wordnet_themes_reduced', 'is', null)
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Unable to load flashcards: ${error.message}`);
    }

    const pageRows = (data ?? []) as unknown as Row[];

    if (pageRows.length === 0) {
      break;
    }

    rows.push(...pageRows);

    if (pageRows.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return rows;
}
