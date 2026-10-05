type InstagramIconProps = {
  size?: number;
  className?: string;
};

export function InstagramIcon({ size = 18, className }: InstagramIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.8"
        width="18"
        x="3"
        y="3"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="6.5" fill="currentColor" r="1.1" />
    </svg>
  );
}
