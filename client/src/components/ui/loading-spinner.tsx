import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  /**
   * Size of the spinner in pixels
   * @default 32
   */
  size?: number;
  
  /**
   * Optional CSS class name
   */
  className?: string;
  
  /**
   * Text to display below the spinner
   */
  text?: string;
  
  /**
   * Whether to center the spinner in a full-height container
   * @default false
   */
  fullHeight?: boolean;
}

/**
 * A consistent loading spinner component that can be used across the application
 */
export function LoadingSpinner({
  size = 32,
  className,
  text,
  fullHeight = false,
}: LoadingSpinnerProps) {
  const containerClasses = cn(
    "flex flex-col items-center justify-center",
    fullHeight && "min-h-[400px] w-full",
    className
  );
  
  return (
    <div className={containerClasses}>
      <Loader2 
        className="animate-spin text-primary"
        style={{ width: size, height: size }}
      />
      {text && (
        <p className="mt-2 text-sm text-gray-500">{text}</p>
      )}
    </div>
  );
}

/**
 * A full-page loading spinner with a semi-transparent backdrop
 */
export function PageLoader({ text }: { text?: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
      <LoadingSpinner size={48} text={text} />
    </div>
  );
}

/**
 * A section loader for use inside cards or content areas
 */
export function SectionLoader({ text }: { text?: string }) {
  return (
    <div className="w-full py-12">
      <LoadingSpinner fullHeight text={text} />
    </div>
  );
}