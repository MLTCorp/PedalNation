import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type {
  WithElementRef,
  WithoutChildrenOrChild,
  WithoutChild,
  WithoutChildren
} from 'bits-ui';

/**
 * Utility for merging Tailwind CSS class names.
 * Combines clsx and tailwind-merge for conflict-free class composition.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type { WithElementRef, WithoutChildrenOrChild, WithoutChild, WithoutChildren };
