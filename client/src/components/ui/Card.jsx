import React from 'react';

export default function Card({ className = '', children, ...props }) {
  return (
    <div className={`bg-surface rounded-xl shadow-card p-6 ${className}`} {...props}>
      {children}
    </div>
  );
} 