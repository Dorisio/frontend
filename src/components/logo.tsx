/**
 * Dorisio Logo Component
 * Displays the Dorisio brand logo
 */

import Image from 'next/image';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export function Logo({ width = 36, height = 36, className = '' }: LogoProps): JSX.Element {
  return (
    <Image
      src="/dorisio-logo.svg"
      alt="Dorisio"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}
