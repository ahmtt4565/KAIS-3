// KAIS Logo - SVG Version (No Background)
export default function KaisLogo({ className = "h-14 w-auto", onClick, style = {} }) {
  return (
    <img
      src="/assets/kais-logo.svg"
      alt="KAIS Logo"
      className={`${className} transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      style={{ ...style, cursor: onClick ? 'pointer' : 'default' }}
    />
  );
}

