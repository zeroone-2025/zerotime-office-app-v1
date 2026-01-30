import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
    width: 32,
    height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    fontSize: 24,
                    background: 'white',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '20%',
                    border: '2px solid #3B82F6',
                }}
            >
                <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ width: '80%', height: '80%' }}
                >
                    <g transform="translate(50, 50) skewX(-6) translate(-50, -50)">
                        <path
                            d="M20 20 H80 V32 L40 68 H80 V80 H20 V68 L60 32 H20 V20 Z"
                            fill="black"
                        />
                        <rect
                            x="84"
                            y="70"
                            width="10"
                            height="10"
                            fill="#3B82F6"
                        />
                    </g>
                </svg>
            </div>
        ),
        // ImageResponse options
        {
            ...size,
        }
    );
}
