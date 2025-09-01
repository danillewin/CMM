import { format } from "date-fns";

/**
 * Format date to dd/mm/yy format
 */
export function formatDateShort(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yy');
}

/**
 * Format date to dd/mm/yyyy format
 */
export function formatDateFull(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy');
}