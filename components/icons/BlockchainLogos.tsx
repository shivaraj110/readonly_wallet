export function SolanaLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 397 311"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="solana-gradient-1"
          x1="360.879"
          y1="351.455"
          x2="141.213"
          y2="-69.2936"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00FFA3" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
        <linearGradient
          id="solana-gradient-2"
          x1="264.829"
          y1="401.601"
          x2="45.163"
          y2="-19.1475"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00FFA3" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
        <linearGradient
          id="solana-gradient-3"
          x1="312.548"
          y1="376.688"
          x2="92.8822"
          y2="-44.061"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00FFA3" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
      </defs>
      <path
        d="M64.6 237.9C67.1 235.4 70.5 234 74.1 234H389.8C395.8 234 398.8 241.3 394.5 245.6L332.4 307.7C329.9 310.2 326.5 311.6 322.9 311.6H7.2C1.2 311.6 -1.8 304.3 2.5 300L64.6 237.9Z"
        fill="url(#solana-gradient-1)"
      />
      <path
        d="M64.6 3.9C67.2 1.4 70.6 0 74.1 0H389.8C395.8 0 398.8 7.3 394.5 11.6L332.4 73.7C329.9 76.2 326.5 77.6 322.9 77.6H7.2C1.2 77.6 -1.8 70.3 2.5 66L64.6 3.9Z"
        fill="url(#solana-gradient-2)"
      />
      <path
        d="M332.4 120.5C329.9 118 326.5 116.6 322.9 116.6H7.2C1.2 116.6 -1.8 123.9 2.5 128.2L64.6 190.3C67.1 192.8 70.5 194.2 74.1 194.2H389.8C395.8 194.2 398.8 186.9 394.5 182.6L332.4 120.5Z"
        fill="url(#solana-gradient-3)"
      />
    </svg>
  );
}

export function EthereumLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 256 417"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#343434"
        d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z"
      />
      <path fill="#8C8C8C" d="M127.962 0L0 212.32l127.962 75.639V154.158z" />
      <path
        fill="#3C3C3B"
        d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.601L256 236.587z"
      />
      <path fill="#8C8C8C" d="M127.962 416.905v-104.72L0 236.585z" />
      <path fill="#141414" d="M127.961 287.958l127.96-75.637-127.96-58.162z" />
      <path fill="#393939" d="M0 212.32l127.96 75.638v-133.8z" />
    </svg>
  );
}
