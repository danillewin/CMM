import * as React from "react";
import { Maximize2 } from "lucide-react";
import { Input, InputProps } from "./input";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { cn } from "@/lib/utils";

export interface FullscreenInputProps extends InputProps {
  label?: string;
}

const FullscreenInput = React.forwardRef<HTMLInputElement, FullscreenInputProps>(
  ({ className, label, value: controlledValue, onChange, onBlur, defaultValue, ...props }, ref) => {
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const [value, setValue] = React.useState(controlledValue || defaultValue || "");

    React.useEffect(() => {
      if (controlledValue !== undefined) {
        setValue(controlledValue);
      }
    }, [controlledValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      onChange?.(e);
    };

    const handleFullscreenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      onChange?.(e);
    };

    const handleDialogClose = (open: boolean) => {
      setIsFullscreen(open);
      if (!open && onBlur) {
        const syntheticEvent = {
          target: { value, name: props.name },
          currentTarget: { value, name: props.name },
        } as React.FocusEvent<HTMLInputElement>;
        onBlur(syntheticEvent);
      }
    };

    return (
      <>
        <div className="relative w-full">
          <Input
            ref={ref}
            className={cn("pr-10", className)}
            value={value}
            onChange={handleChange}
            onBlur={onBlur}
            defaultValue={defaultValue}
            {...props}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setIsFullscreen(true)}
            data-testid="button-fullscreen-input"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        <Dialog open={isFullscreen} onOpenChange={handleDialogClose}>
          <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{label || "Edit Text"}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              <Input
                value={value}
                onChange={handleFullscreenChange}
                onBlur={onBlur}
                className="text-lg"
                autoFocus
                data-testid="input-fullscreen-edit"
                {...props}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => handleDialogClose(false)}
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

FullscreenInput.displayName = "FullscreenInput";

export { FullscreenInput };
