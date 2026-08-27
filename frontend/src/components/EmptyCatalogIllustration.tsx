export function EmptyCatalogIllustration() {
  return (
    <svg viewBox="0 0 640 300" className="w-full max-w-sm mx-auto" fill="none">
      {/* Левый завиток-декор */}
      <path
        d="M40 190 C20 175, 22 145, 52 143 C82 141, 90 168, 68 176 C52 182, 42 168, 54 160"
        stroke="#c7d2c9"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="6 7"
      />
      <path
        d="M56 176 C110 200, 160 200, 235 196"
        stroke="#c7d2c9"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="6 7"
      />

      {/* Правый завиток-декор (зеркально) */}
      <path
        d="M600 190 C620 175, 618 145, 588 143 C558 141, 550 168, 572 176 C588 182, 598 168, 586 160"
        stroke="#c7d2c9"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="6 7"
      />
      <path
        d="M584 176 C530 200, 480 200, 405 196"
        stroke="#c7d2c9"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="6 7"
      />

      {/* Стебель и грустные поникшие листья */}
      <path d="M320 150 C320 120, 322 95, 320 78" stroke="#86a06f" strokeWidth="2.5" strokeDasharray="5 6" strokeLinecap="round" />
      <path
        d="M320 100 C300 92, 278 98, 268 82 C288 74, 312 78, 320 100Z"
        fill="#dcecd4"
        stroke="#86a06f"
        strokeWidth="2.5"
        strokeDasharray="5 6"
        strokeLinejoin="round"
      />
      <path
        d="M322 88 C342 78, 366 82, 376 64 C354 58, 330 64, 322 88Z"
        fill="#dcecd4"
        stroke="#86a06f"
        strokeWidth="2.5"
        strokeDasharray="5 6"
        strokeLinejoin="round"
      />

      {/* Горшок */}
      <ellipse cx="320" cy="150" rx="72" ry="15" fill="#fde8d8" stroke="#e8a978" strokeWidth="2.5" strokeDasharray="6 6" />
      <path
        d="M253 150 L275 232 C275 240, 365 240, 365 232 L387 150"
        fill="#f6c197"
        stroke="#e8a978"
        strokeWidth="2.5"
        strokeDasharray="6 6"
        strokeLinejoin="round"
      />

      {/* Грустные глаза-крестики и рот */}
      <path d="M296 180 L306 190 M306 180 L296 190" stroke="#8a5a34" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M334 180 L344 190 M344 180 L334 190" stroke="#8a5a34" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M305 208 C313 200, 327 200, 335 208" stroke="#8a5a34" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 5" />

      {/* Лупа — ищем, но не находим */}
      <circle cx="320" cy="262" r="24" fill="#fff" stroke="#9ca8a0" strokeWidth="2.5" strokeDasharray="6 6" />
      <line x1="337" y1="279" x2="356" y2="298" stroke="#9ca8a0" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
