import React from "react";

export default function Logo({
  width = 600,
  height = 300,
}: {
  width?: number;
  height?: number;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 600 300"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradiente principal */}
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8A2BE2" />
            <stop offset="50%" stopColor="#00C9FF" />
            <stop offset="100%" stopColor="#00FFA3" />
          </linearGradient>

          {/* Gradiente texto */}
          <linearGradient id="textGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#00C9FF" />
          </linearGradient>

          {/* Glow forte */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Brilho animado */}
          <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* CENTRAL */}
        <g transform="translate(300,150)" textAnchor="middle">

          {/* Ícone com glow */}
          <g transform="translate(-60,-120)" filter="url(#glow)">
            <rect
              x="0"
              y="0"
              width="120"
              height="120"
              rx="25"
              stroke="url(#grad1)"
              strokeWidth="4"
              fill="none"
            />

            {/* topo calendário */}
            <line x1="25" y1="-10" x2="25" y2="20" stroke="url(#grad1)" strokeWidth="4" />
            <line x1="95" y1="-10" x2="95" y2="20" stroke="url(#grad1)" strokeWidth="4" />

            {/* A estilizado */}
            <path
              d="M30 90 L60 30 L90 90"
              stroke="url(#grad1)"
              strokeWidth="4"
              fill="none"
            />

            {/* Check */}
            <path
              d="M50 75 L60 85 L80 60"
              stroke="url(#grad1)"
              strokeWidth="3"
              fill="none"
            />
          </g>

          {/* TEXTO PRINCIPAL COM GLOW */}
          <text
            y="40"
            fontFamily="Poppins, Arial, sans-serif"
            fontSize="54"
            fill="url(#textGlow)"
            fontWeight="700"
            filter="url(#glow)"
          >
            AgendPro
          </text>

          {/* BRILHO PASSANDO */}
          <rect x="-150" y="0" width="300" height="60" fill="url(#shine)">
            <animate
              attributeName="x"
              from="-300"
              to="300"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </rect>

          {/* LINHA NEON */}
          <line
            x1="-140"
            y1="70"
            x2="140"
            y2="70"
            stroke="url(#grad1)"
            strokeWidth="2"
            opacity="0.7"
            filter="url(#glow)"
          />

          {/* SUBTÍTULO */}
          <text
            y="100"
            fontFamily="Poppins, Arial, sans-serif"
            fontSize="16"
            fill="#CCCCCC"
          >
            uma empresa do Grupo{" "}
            <tspan fill="#00C9FF" fontWeight="700">
              NSG
            </tspan>
          </text>
        </g>
      </svg>
    </div>
  );
}