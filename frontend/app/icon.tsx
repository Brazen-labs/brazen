import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="8" cy="23" r="7" fill="#F4623A" />
        <circle cx="24" cy="9" r="7" fill="#F4623A" fillOpacity="0.4" />
        <path
          d="M11.5 18.5C15.5 12.5 17.5 10.5 20.5 8.5"
          stroke="#F4623A"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M17 7.6L21 8.9L19.6 12.8"
          stroke="#F4623A"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    { ...size },
  );
}
