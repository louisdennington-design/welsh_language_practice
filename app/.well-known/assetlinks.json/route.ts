import { NextResponse } from 'next/server';

const PACKAGE_NAME = 'com.welshvocab.practice';
const RELEASE_PLACEHOLDER = 'RELEASE_SHA256_FINGERPRINT';
const DEBUG_PLACEHOLDER = 'DEBUG_SHA256_FINGERPRINT';

function getFingerprints() {
  const releaseFingerprint = process.env.ANDROID_APP_LINK_SHA256_RELEASE?.trim() || RELEASE_PLACEHOLDER;
  const debugFingerprint = process.env.ANDROID_APP_LINK_SHA256_DEBUG?.trim() || DEBUG_PLACEHOLDER;

  return [releaseFingerprint, debugFingerprint];
}

export function GET() {
  const fingerprints = getFingerprints();

  return NextResponse.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: PACKAGE_NAME,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ]);
}
