import { linkifyText } from "@/lib/utils";

interface LinkifiedTextProps {
  text: string;
  className?: string;
}

export function LinkifiedText({ text, className }: LinkifiedTextProps) {
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ 
        __html: text ? linkifyText(text) : ''
      }} 
    />
  );
}