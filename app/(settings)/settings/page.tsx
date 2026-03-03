import { MobileDiagnosticsPanel } from '@/components/mobile-diagnostics-panel';
import { getEnvironmentName, getAppVersion } from '@/lib/mobile-config';
import { getPublicSiteUrl } from '@/lib/site-url';

export default function SettingsPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-5 py-8">
      <section
        className="rounded-[2rem] border p-6 shadow-[0_28px_80px_rgba(26,67,46,0.16)] backdrop-blur"
        style={{ backgroundColor: '#769036', borderColor: '#769036' }}
      >
        <h1 className="text-lg font-semibold text-white">Settings</h1>
      </section>

      <MobileDiagnosticsPanel appVersion={getAppVersion()} environment={getEnvironmentName()} siteUrl={getPublicSiteUrl()} />
    </main>
  );
}
