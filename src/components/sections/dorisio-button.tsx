/**
 * Dorisio Button Component
 * Opens tip modal dialog
 */

'use client';

import { useState } from 'react';
import DorisioModal from './dorisio-modal';

interface DorisioButtonProps {
  creatorId: string;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function DorisioButton({
  creatorId,
  variant = 'default',
  size = 'md',
  className = '',
}: DorisioButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-primary text-primary hover:bg-primary/5',
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`rounded font-semibold transition ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      >
        💰 Send a Tip
      </button>

      <DorisioModal
        creatorId={creatorId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
