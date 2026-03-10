import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/server/supabase-server';

type FeedbackBody = {
  comment?: string;
  english_1?: string;
  theme?: string;
  word_id?: number;
  welsh_lc?: string;
};

function buildFeedbackEmailText(
  body: Required<Pick<FeedbackBody, 'english_1' | 'welsh_lc' | 'word_id'>> & { comment: string | null; theme: string | null },
  userId: string | null,
) {
  return [
    'CymruCards translation feedback',
    '',
    `word_id: ${body.word_id}`,
    `welsh_lc: ${body.welsh_lc}`,
    `english_1: ${body.english_1}`,
    `theme: ${body.theme ?? '(none)'}`,
    `user_message: ${body.comment ?? '(none)'}`,
    `reported_by_user_id: ${userId ?? '(anonymous)'}`,
    `reported_at_utc: ${new Date().toISOString()}`,
  ].join('\n');
}

async function sendFeedbackEmail(
  body: Required<Pick<FeedbackBody, 'english_1' | 'welsh_lc' | 'word_id'>> & { comment: string | null; theme: string | null },
  userId: string | null,
) {
  const sendGridApiKey = process.env.SENDGRID_API_KEY?.trim();
  const fromEmail = process.env.FEEDBACK_EMAIL_FROM?.trim();
  const toEmail = process.env.FEEDBACK_EMAIL_TO?.trim() || 'cymru.cards.app@gmail.com';
  const replyToEmail = process.env.FEEDBACK_EMAIL_REPLY_TO?.trim() || toEmail;

  if (!sendGridApiKey || !fromEmail) {
    throw new Error('Feedback email delivery is not configured. Set SENDGRID_API_KEY and FEEDBACK_EMAIL_FROM.');
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    body: JSON.stringify({
      content: [{ type: 'text/plain', value: buildFeedbackEmailText(body, userId) }],
      from: { email: fromEmail },
      personalizations: [{ to: [{ email: toEmail }] }],
      reply_to: { email: replyToEmail },
      subject: `CymruCards translation feedback (word_id ${body.word_id})`,
    }),
    headers: {
      Authorization: `Bearer ${sendGridApiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    const sendGridError = await response.text().catch(() => '');
    throw new Error(`Failed to send feedback email: ${sendGridError || response.statusText}`);
  }

  return {
    messageId: response.headers.get('x-message-id'),
    status: response.status,
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as FeedbackBody | null;

  if (!body || typeof body.word_id !== 'number' || typeof body.welsh_lc !== 'string' || typeof body.english_1 !== 'string') {
    return NextResponse.json({ error: 'Invalid feedback payload.' }, { status: 400 });
  }

  const supabaseServer = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  const payload = {
    comment: body.comment?.trim() ? body.comment.trim() : null,
    english_1: body.english_1,
    theme: body.theme ?? null,
    welsh_lc: body.welsh_lc,
    word_id: body.word_id,
  };

  const { error } = await supabaseServer.schema('public').from('translation_feedback').insert({ ...payload, user_id: user?.id ?? null });

  if (error) {
    console.error('translation-feedback db insert failed', { error: error.message, word_id: payload.word_id });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    const emailResult = await sendFeedbackEmail(payload, user?.id ?? null);
    console.info('translation-feedback email sent', {
      message_id: emailResult.messageId,
      provider_status: emailResult.status,
      to: process.env.FEEDBACK_EMAIL_TO?.trim() || 'cymru.cards.app@gmail.com',
      word_id: payload.word_id,
    });
    return NextResponse.json({ message_id: emailResult.messageId, ok: true, provider_status: emailResult.status });
  } catch (emailError) {
    const message =
      emailError instanceof Error
        ? emailError.message
        : 'Failed to send feedback email.';
    console.error('translation-feedback email failed', { error: message, word_id: payload.word_id });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
