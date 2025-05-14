import { CheckCircle, Save } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type AutosaveIndicatorProps = {
  /**
   * Whether the form is currently saving
   */
  isSaving: boolean;
  
  /**
   * Timestamp of when the form was last saved
   */
  lastSaved: Date | null;
  
  /**
   * Additional CSS classes to apply to the indicator
   */
  className?: string;
};

/**
 * A component to display the autosave status
 */
export function AutosaveIndicator({ isSaving, lastSaved, className = "" }: AutosaveIndicatorProps) {
  // Format the last saved timestamp
  const formattedTime = lastSaved 
    ? new Intl.DateTimeFormat('default', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(lastSaved)
    : null;
    
  // If never saved, show nothing
  if (!isSaving && !lastSaved) {
    return null;
  }
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className={`flex items-center text-xs text-muted-foreground gap-1.5 ${className}`}>
            {isSaving ? (
              <>
                <Save className="h-3.5 w-3.5 animate-pulse" />
                <span>Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                <span>Saved at {formattedTime}</span>
              </>
            ) : null}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center">
          {isSaving 
            ? "Your changes are being automatically saved..." 
            : lastSaved 
              ? `Last autosaved at ${formattedTime}` 
              : ""}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}