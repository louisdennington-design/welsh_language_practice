export default function LearningTipsPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-5 py-8">
      <section
        className="rounded-[2rem] border p-6 shadow-[0_28px_80px_rgba(26,67,46,0.16)] backdrop-blur"
        style={{ backgroundColor: '#769036', borderColor: '#769036' }}
      >
        <h1 className="text-lg font-semibold text-white">Learning tips</h1>
      </section>
      <section className="rounded-[2rem] border border-white/50 bg-white/84 p-5 shadow-[0_22px_50px_rgba(26,67,46,0.12)] backdrop-blur">
        <div className="space-y-5 text-sm leading-6 text-slate-700">
          <p>
            <strong>Learning works best when you practise regularly.</strong> Short sessions done often are much more
            effective than long sessions done rarely. When you come back to words after a gap, your brain has to work a
            little to remember them. That effort strengthens memory. Try to use the app most days, even for five or ten
            minutes.
          </p>
          <p>
            <strong>When you see a card, try to recall the answer before you flip it.</strong> Do not just read the
            translation straight away. Actively trying to bring the word to mind helps you learn it faster and remember
            it for longer. Even if you are not sure, make a guess. The act of retrieval is what builds memory.
          </p>
          <p>
            <strong>Say the word out loud whenever you can.</strong> Hearing yourself say it helps your pronunciation
            and builds a stronger mental link than reading alone. Language is spoken as well as written. Using your
            voice helps you remember the sound, rhythm and stress of the word.
          </p>
          <p>
            <strong>Start by learning common, high frequency words.</strong> These are the words that appear most often
            in everyday conversation. They give you the strongest foundation for understanding and being understood.
            Once these feel familiar, move on to less common words and more complex phrases. This builds your
            communication skills step by step.
          </p>

          <div className="pt-2">
            <h2 className="text-base font-semibold text-slate-900">Ten things to know when learning the Welsh language</h2>
            <ol className="mt-4 space-y-4 list-decimal pl-5">
              <li>Welsh spelling is regular. Once you learn the sounds of the letters and letter combinations, you can usually pronounce any word correctly. It is much more consistent than English.</li>
              <li>Some letter pairs are single letters. Combinations like ll, dd, th, rh, ng and ch count as separate letters and have their own sounds. They are not just two ordinary letters placed together.</li>
              <li>Word order is often verb first. In many sentences the verb comes before the subject. For example “Dw i’n mynd” literally begins with “Am going I.” This feels unfamiliar at first but becomes natural with exposure.</li>
              <li>&ldquo;Mutations&rdquo; change the first letter of words, which can make recognising them tricky for beginners. For example “pen” can become “ben” depending on the end of the last word. Don&apos;t worry too much about this to begin with. It will come naturally the more you learn.</li>
              <li>Prepositions combine with pronouns. Instead of saying “to me” as two words, Welsh often uses one word such as “i mi” or “ata i,” and some forms are fully fused, such as “iddi hi” becoming “iddi.” Eventually, you will learn these patterns.</li>
              <li>There is no separate word for “do” in questions. Questions and negatives are formed by changing the verb structure instead.</li>
              <li>Gender matters. Nouns are either masculine or feminine. This affects adjectives, numbers and mutations. Gender often has to be memorised with the noun, because it&apos;s not obvious from the sound.</li>
              <li>There are formal and informal “you” forms. “Ti” is informal and “chi” is formal or plural. Choosing the right one depends on context and social setting.</li>
              <li>Spoken Welsh often differs from textbook Welsh. Colloquial forms such as “dw i’n” instead of “rydw i’n” are normal in everyday speech. Learning common spoken patterns will help you understand real conversations.</li>
              <li>Vocabulary overlaps less with English than some European languages. Welsh is Celtic, not Germanic or Romance. Many words will feel unfamiliar. Don&apos;t worry. You&apos;ll get there with enough repetition, which is exactly what this app is for. High frequency everyday words give the strongest foundation for communication.</li>
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
}
