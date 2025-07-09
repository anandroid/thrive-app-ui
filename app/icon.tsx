import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'
 
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
          background: 'linear-gradient(135deg, #c97b84 0%, #a85d68 100%)',
          borderRadius: '22%',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C12 2 19 7 19 14C19 18 16 21 12 21C8 21 5 18 5 14C5 7 12 2 12 2Z"
            fill="white"
            fillOpacity="0.9"
          />
          <path
            d="M12 7C12 7 8 10 8 14"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}