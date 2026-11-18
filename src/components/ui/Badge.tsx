import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = ''
}) => {
  const variants = {
    default: {
      wrapper: 'bg-zinc-100 text-zinc-700 border border-zinc-200/80 shadow-2xs',
      dot: 'bg-zinc-400'
    },
    success: {
      wrapper: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs',
      dot: 'bg-emerald-500'
    },
    warning: {
      wrapper: 'bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs',
      dot: 'bg-amber-500 animate-pulse'
    },
    danger: {
      wrapper: 'bg-rose-50 text-rose-800 border border-rose-200/80 shadow-2xs',
      dot: 'bg-rose-500'
    },
    info: {
      wrapper: 'bg-sky-50 text-sky-800 border border-sky-200/80 shadow-2xs',
      dot: 'bg-sky-500'
    },
    purple: {
      wrapper: 'bg-purple-50 text-purple-800 border border-purple-200/80 shadow-2xs',
      dot: 'bg-purple-500'
    }
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] font-semibold gap-1',
    md: 'px-2.5 py-1 text-xs font-semibold gap-1.5',
    lg: 'px-3 py-1.5 text-xs font-bold gap-2'
  };

  const current = variants[variant];

  return (
    <span
      className={`inline-flex items-center rounded-full tracking-wide transition-colors ${current.wrapper} ${sizes[size]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dot}`}
        />
      )}
      {children}
    </span>
  );
};
