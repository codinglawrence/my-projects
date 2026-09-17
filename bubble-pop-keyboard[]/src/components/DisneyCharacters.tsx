import React from "react";

interface CharacterProps {
  src: string;
  alt: string;
  size?: number;
}

function CharacterImage({ src, alt, size = 90 }: CharacterProps): React.ReactElement {
  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: size,
        height: "auto",
        imageRendering: "auto",
        filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.12))",
      }}
      draggable={false}
    />
  );
}

export function CookieAnn({ size = 90 }: { size?: number }): React.ReactElement {
  return <CharacterImage src="/characters/cookie-ann.png" alt="Cookie Ann 饼饼" size={size} />;
}

export function LinaBell({ size = 90 }: { size?: number }): React.ReactElement {
  return <CharacterImage src="/characters/lina-bell.png" alt="LinaBell 玲娜贝儿" size={size} />;
}
