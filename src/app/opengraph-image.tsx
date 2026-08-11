import { ImageResponse } from 'next/og';

export const alt = 'Tournoi commémoratif';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #17130e 0%, #241f18 100%)',
        }}
      >
        <div style={{ fontSize: 140, display: 'flex' }}>🏆</div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: '#f3eedf',
            marginTop: 12,
            display: 'flex',
          }}
        >
          Tournoi commémoratif
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 600,
            color: '#deb84a',
            marginTop: 18,
            letterSpacing: 6,
            textTransform: 'uppercase',
            display: 'flex',
          }}
        >
          Mini-tournoi de football
        </div>
      </div>
    ),
    { ...size }
  );
}
