import { useEffect, useState, useRef } from "react";
import { UseFormReturn, FieldValues } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

export type AutosaveOptions = {
  /**
   * How long to wait after changes before triggering autosave (in ms)
   * @default 2000
   */
  debounceMs?: number;
  
  /**
   * Whether to show toast notifications when autosave occurs
   * @default true
   */
  showToasts?: boolean;
  
  /**
   * Whether to enable autosave
   * @default true
   */
  enabled?: boolean;
};

/**
 * A hook to handle autosaving form data
 * 
 * @param form The react-hook-form form instance
 * @param onSave Function to call with form data when autosave is triggered
 * @param options Configuration options for autosave
 */
export function useAutosave<T extends FieldValues>(
  form: UseFormReturn<T>,
  onSave: (data: T) => void,
  options: AutosaveOptions = {}
) {
  const { debounceMs = 2000, showToasts = true, enabled = true } = options;
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const isFirstRender = useRef(true);
  const { toast } = useToast();
  
  // Track when form values change and debounce the save call
  useEffect(() => {
    if (!enabled) return;
    
    // Skip the first render to avoid saving on initial form load
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Start a new debounce timer whenever form values change
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = window.setTimeout(() => {
      // Only autosave if the form is valid
      if (form.formState.isValid) {
        setIsSaving(true);
        
        const data = form.getValues();
        onSave(data);
        
        // Show a toast notification if enabled
        if (showToasts) {
          toast({
            title: "Autosaved",
            description: "Your changes have been automatically saved",
            duration: 2000,
          });
        }
        
        setLastSaved(new Date());
        setIsSaving(false);
      }
    }, debounceMs);
    
    // Cleanup the timeout when the component unmounts
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [form.watch(), form, onSave, debounceMs, showToasts, enabled, toast]);
  
  return {
    isSaving,
    lastSaved,
    
    /**
     * Force an immediate save regardless of the debounce timer
     */
    forceSave: () => {
      if (!enabled) return;
      
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (form.formState.isValid) {
        setIsSaving(true);
        const data = form.getValues();
        onSave(data);
        setLastSaved(new Date());
        setIsSaving(false);
      }
    }
  };
}