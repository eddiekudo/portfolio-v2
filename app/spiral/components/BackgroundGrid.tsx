import React from 'react'

export default function BackgroundGrid() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-40 overflow-hidden pointer-events-none z-0"
      preserveAspectRatio="none"
      viewBox="0 0 1920 1200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      aria-hidden="true"
    >
      <g clipPath="url(#grid-clip)">
        <rect width="1920" height="1200" fill="url(#grid-pattern)" fillOpacity="0.2" />
        <g filter="url(#grid-vignette)">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M2442 1526H-522V-326H2442V1526ZM960 14C453.003 14 42 276.585 42 600.5C42 924.415 453.003 1187 960 1187C1467 1187 1878 924.415 1878 600.5C1878 276.585 1467 14 960 14Z"
            fill="#0A0A0A"
          />
        </g>
      </g>
      <defs>
        <filter
          id="grid-vignette"
          x="-1022"
          y="-826"
          width="3964"
          height="2852"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="250" result="vignette-blur" />
        </filter>
        <clipPath id="grid-clip">
          <rect width="1920" height="1200" fill="white" />
        </clipPath>
        <pattern
          id="grid-pattern"
          patternUnits="userSpaceOnUse"
          patternTransform="matrix(50 0 0 50 934.75 574.75)"
          preserveAspectRatio="none"
          viewBox="-0.5 -0.5 100 100"
          width="1"
          height="1"
        >
          <use xlinkHref="#grid-cell" transform="translate(-100 -100)" />
          <use xlinkHref="#grid-cell" transform="translate(0 -100)" />
          <use xlinkHref="#grid-cell" transform="translate(-100 0)" />
          <g id="grid-cell">
            <rect width="100" height="100" stroke="white" />
          </g>
        </pattern>
      </defs>
    </svg>
  )
}
