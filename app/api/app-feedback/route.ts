import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/server/supabase-server';

type AppFeedbackBody = {
  message?: string;
};

function buildAppFeedbackEmailText(message: string, userId: string | null) {
  return [
    'CymruCards app feedback',
    '',
    `message: ${message}`,
    `reported_by_user_id: ${userId ?? '(anonymous)'}`,
    `reported_at_utc: ${new Date().toISOString()}`,
  ].join('\n');
}

async function sendAppFeedbackEmail(message: string, userId: string | null) {
  const sendGridApiKey = process.env.SENDGRID_API_KEY?.trim();
  const fromEmail = process.env.FEEDBACK_EMAIL_FROM?.trim();
  const toEmail = process.env.FEEDBACK_EMAIL_TO?.trim() || 'cymru.cards.app@gmail.com';
  const replyToEmail = process.env.FEEDBACK_EMAIL_REPLY_TO?.trim() || toEmail;

  if (!sendGridApiKey || !fromEmail) {
    throw new Error('Feedback email delivery is not configured. Set SENDGRID_API_KEY and FEEDBACK_EMAIL_FROM.');
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    body: JSON.stringify({
      content: [{ type: 'text/plain', value: buildAppFeedbackEmailText(message, userId) }],
      from: { email: fromEmail },
      personalizations: [{ to: [{ email: toEmail }] }],
      reply_to: { email: replyToEmail },
      subject: 'User feedback on the app',
    }),
    headers: {
      Authorization: `Bearer ${sendGridApiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    const sendGridError = await response.text().catch(() => '');
    throw new Error(`Failed to send app feedback email: ${sendGridError || response.statusText}`);
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as AppFeedbackBody | null;
  const message = body?.message?.trim() ?? '';

  if (!message) {
    return NextResponse.json({ error: 'Please enter feedback before sending.' }, { status: 400 });
  }

  const supabaseServer = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  try {
    await sendAppFeedbackEmail(message, user?.id ?? null);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Failed to send app feedback email.';
    console.error('app-feedback email failed', { error: messageText });
    return NextResponse.json({ error: messageText }, { status: 500 });
  }
}
