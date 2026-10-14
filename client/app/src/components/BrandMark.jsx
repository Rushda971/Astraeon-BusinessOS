export default function BrandMark({ className = '' }) {
  return (
    <svg className={`astraeon-mark ${className}`} viewBox="0 0 48 48" role="img" aria-label="Astraeon restaurant mark" focusable="false">
      <circle cx="24" cy="24" r="22" fill="#3B0A12" stroke="#B58A57" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="18.5" fill="none" stroke="#E8D1AD" strokeOpacity=".25" strokeWidth=".7" />
      <g className="astraeon-mark__steam" fill="none" stroke="#E8D1AD" strokeWidth="1.8" strokeLinecap="round">
        <path d="M18 16.2c0-1.5.9-2.3.9-3.5" />
        <path d="M24 14.8c0-1.6.9-2.4.9-3.7" />
        <path d="M30 16.2c0-1.5.9-2.3.9-3.5" />
      </g>
      <circle cx="24" cy="18" r="1.7" fill="#B58A57" />
      <path d="M13.5 30.2c.8-6.8 5-10.7 10.5-10.7s9.7 3.9 10.5 10.7H13.5Z" fill="#F8EFDF" />
      <path d="M12 31.6h24M16 35h16" fill="none" stroke="#D6B98C" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 27.2c1.4-2.5 3.4-3.7 6-3.7s4.6 1.2 6 3.7" fill="none" stroke="#B58A57" strokeOpacity=".72" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
