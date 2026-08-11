import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #17130e, #2a2318)',
          borderRadius: '20%',
        }}
      >
        <div style={{ fontSize: 22, display: 'flex' }}>🏆</div>
      </div>
    ),
    { ...size }
  );
}
