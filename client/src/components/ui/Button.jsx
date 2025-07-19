import React from 'react';

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  children,
  ...props
}) {
  const base = 'font-heading rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary';
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    secondary: 'bg-secondary text-white hover:bg-secondary-dark',
    outline: 'bg-transparent border border-primary text-primary hover:bg-primary hover:text-white',
  };
  const sizes = {
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  const disabledStyle = 'bg-secondary-light text-secondary-dark cursor-not-allowed opacity-60';

  return (
    <button
      className={[
        base,
        variants[variant],
        sizes[size],
        disabled ? disabledStyle : '',
        className
      ].join(' ')}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
} 