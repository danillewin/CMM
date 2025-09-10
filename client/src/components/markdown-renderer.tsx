import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string | null | undefined;
  className?: string;
  maxLength?: number;
}

export function MarkdownRenderer({ content, className = "", maxLength }: MarkdownRendererProps) {
  if (!content) {
    return <span className="text-gray-400">—</span>;
  }

  // Truncate content if maxLength is specified
  const displayContent = maxLength && content.length > maxLength 
    ? content.substring(0, maxLength) + "..." 
    : content;

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        disallowedElements={['script', 'iframe', 'object', 'embed', 'form', 'input', 'button']}
        unwrapDisallowed={true}
      >
        {displayContent}
      </ReactMarkdown>
    </div>
  );
}