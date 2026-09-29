'use client';

import { validatePassword } from '@/lib/passwords';

interface PasswordRequirementsProps {
  password: string;
  showRequirements?: boolean;
}

export function PasswordRequirements({ password, showRequirements = true }: PasswordRequirementsProps) {
  const strength = validatePassword(password);

  if (!showRequirements) return null;

  const requirements = [
    { key: 'minLength', label: '9+ chars', met: strength.requirements.minLength },
    { key: 'uppercase', label: 'A-Z', met: strength.requirements.hasUppercase },
    { key: 'lowercase', label: 'a-z', met: strength.requirements.hasLowercase },
    { key: 'number', label: '0-9', met: strength.requirements.hasNumber },
    { key: 'special', label: '!@#$', met: strength.requirements.hasSpecialChar },
  ];

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {requirements.map((req) => (
        <span
          key={req.key}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition ${
            req.met
              ? 'bg-tint-green text-tint-foreground'
              : 'bg-[color:var(--card-muted)] text-[color:var(--muted-foreground)]'
          }`}
        >
          <span
            className={`flex h-2.5 w-2.5 items-center justify-center rounded-full ${
              req.met ? 'border border-outline bg-tint-foreground' : 'border border-current opacity-50'
            }`}
          />
          {req.label}
        </span>
      ))}
    </div>
  );
}
