import * as React from "react";
import { Maximize2 } from "lucide-react";
import { Textarea, TextareaProps } from "./textarea";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { cn } from "@/lib/utils";

export interface FullscreenTextareaProps extends TextareaProps {
  label?: string;
}

const FullscreenTextarea = React.forwardRef<HTMLTextAreaElement, FullscreenTextareaProps>(
  ({ className, label, ...props }, ref) => {
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const [value, setValue] = React.useState(props.value || props.defaultValue || "");

    React.useEffect(() => {
      if (props.value !== undefined) {
        setValue(props.value);
      }
    }, [props.value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
      props.onChange?.(e);
    };

    const handleFullscreenChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: e.target.value },
      } as React.ChangeEvent<HTMLTextAreaElement>;
      props.onChange?.(syntheticEvent);
    };

    return (
      <>
        <div className="relative w-full">
          <Textarea
            ref={ref}
            className={cn("pr-10", className)}
            value={value}
            onChange={handleChange}
            {...props}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-8 w-8"
            onClick={() => setIsFullscreen(true)}
            data-testid="button-fullscreen-textarea"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
          <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{label || "Edit Text"}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              <Textarea
                value={value}
                onChange={handleFullscreenChange}
                className="flex-1 text-lg resize-none"
                placeholder={props.placeholder}
                autoFocus
                data-testid="textarea-fullscreen-edit"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  data-testid="button-close-fullscreen"
                >
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }
);

FullscreenTextarea.displayName = "FullscreenTextarea";

export { FullscreenTextarea };
