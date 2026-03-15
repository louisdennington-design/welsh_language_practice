import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  height: 180,
  width: 180,
};

export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: 'linear-gradient(180deg, #2C5439 0%, #40664a 100%)',
          color: 'white',
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
          padding: '20%',
          width: '100%',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            background: 'linear-gradient(180deg, rgba(246,250,236,0.96) 0%, rgba(224,237,206,0.96) 100%)',
            borderRadius: '28%',
            color: '#2C5439',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '22px 16px',
          }}
        >
          <div style={{ fontSize: 60, fontWeight: 800, letterSpacing: '-0.06em', lineHeight: 1 }}>CC</div>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.12em', marginTop: 4, textTransform: 'uppercase' }}>
            CymruCards
          </div>
        </div>
      </div>
    ),
    size,
  );
}
