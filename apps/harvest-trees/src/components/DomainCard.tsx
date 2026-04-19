import type { DomainInfo } from '../types';

interface DomainCardProps {
  domain: DomainInfo;
  onClick: () => void;
  selected?: boolean;
}

export default function DomainCard({ domain, onClick, selected }: DomainCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-60 flex flex-col items-center gap-3 p-6 rounded-lg cursor-pointer
        bg-ht-cream transition-all duration-500
        border-2
        ${selected
          ? 'border-ht-ochre shadow-lg shadow-ht-ochre/20'
          : 'border-ht-ochre/20 hover:border-ht-ochre hover:shadow-md hover:shadow-ht-ochre/15 hover:-translate-y-1'
        }
      `}
    >
      <span className="text-5xl leading-none select-none">{domain.icon}</span>
      <span className="font-cormorant italic text-2xl font-semibold text-ht-brown text-center leading-tight">
        {domain.name}
      </span>
      <span className="font-spectral text-xs text-ht-brown/60 text-center leading-relaxed">
        {domain.tagline}
      </span>
      {selected && (
        <span className="mt-1 text-xs font-spectral font-semibold text-ht-ochre tracking-wide">
          Selected
        </span>
      )}
    </button>
  );
}
