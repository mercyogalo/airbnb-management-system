import Image from 'next/image';
import Link from 'next/link';

const LOGO_URL =
  'https://s3.amazonaws.com/shecodesio-production/uploads/files/000/179/931/original/ChatGPT_Image_May_4__2026__01_18_01_PM.png?1777889924';

interface LogoProps {
  href?: string;
  size?: number;
  className?: string;
  priority?: boolean;
}

export function Logo({ href = '/', size = 52, className, priority = false }: LogoProps) {
  const image = (
    <Image
      src={LOGO_URL}
      alt="StayEasy logo"
      width={size}
      height={size}
      className={className}
      priority={priority}
    />
  );

  if (!href) return image;

  return (
    <Link href={href} aria-label="Go to home">
      {image}
    </Link>
  );
}
