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

/**
 * Format date for input field in dd/mm/yy format
 */
export function formatDateForInput(date: Date | string): string {
  try {
    if (!date) return "";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "";
    return format(dateObj, 'dd/MM/yy');
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
}

/**
 * Parse date from dd/mm/yy format string
 */
export function parseDateFromInput(dateString: string): Date | null {
  try {
    if (!dateString) return null;
    
    // Try to parse dd/mm/yy format
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      let year = parseInt(parts[2], 10);
      
      // Convert 2-digit year to 4-digit year
      if (year < 50) {
        year += 2000;
      } else if (year < 100) {
        year += 1900;
      }
      
      const date = new Date(year, month, day);
      return isNaN(date.getTime()) ? null : date;
    }
    
    return null;
  } catch (error) {
    console.error("Error parsing date:", error);
    return null;
  }
}