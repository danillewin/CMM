import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import DOMPurify from 'dompurify'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function linkifyText(text: string): string {
  // First escape HTML to prevent XSS
  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };
  
  const escapedText = escapeHtml(text);
  const urlRegex = /(https?:\/\/[^\s&<>"']+)/g;
  
  // Create linkified HTML with escaped URLs
  const linkifiedHtml = escapedText.replace(urlRegex, (url) => {
    // Double-decode the URL since it was escaped, but validate it first
    const decodedUrl = url
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");
    
    // Validate the URL format
    try {
      new URL(decodedUrl);
      return `<a href="${encodeURI(decodedUrl)}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">${url}</a>`;
    } catch {
      // If URL is invalid, return it as escaped text
      return url;
    }
  });
  
  // Sanitize the final HTML to remove any malicious content
  return DOMPurify.sanitize(linkifiedHtml, {
    ALLOWED_TAGS: ['a'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false
  });
}