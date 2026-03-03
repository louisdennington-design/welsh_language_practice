import { ResetPasswordForm } from '@/components/reset-password-form';

export const dynamic = 'force-dynamic';

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const nextPath = searchParams?.next ?? '/flashcards';

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 p-6">
      <ResetPasswordForm nextPath={nextPath} />
    </main>
  );
}
