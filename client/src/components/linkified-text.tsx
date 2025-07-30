import { linkifyText } from "@/lib/utils";

interface LinkifiedTextProps {
  text: string;
  className?: string;
}

export function LinkifiedText({ text, className }: LinkifiedTextProps) {
  // Use the secure linkifyText function which includes HTML sanitization
  const sanitizedHtml = text ? linkifyText(text) : '';
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ 
        __html: sanitizedHtml
      }} 
    />
  );
}