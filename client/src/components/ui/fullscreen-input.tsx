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
  ({ className, label, ...props }, ref) => {
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const [value, setValue] = React.useState(props.value || props.defaultValue || "");

    React.useEffect(() => {
      if (props.value !== undefined) {
        setValue(props.value);
      }
    }, [props.value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      props.onChange?.(e);
    };

    const handleFullscreenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: e.target.value },
      } as React.ChangeEvent<HTMLInputElement>;
      props.onChange?.(syntheticEvent);
    };

    return (
      <>
        <div className="relative w-full">
          <Input
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
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setIsFullscreen(true)}
            data-testid="button-fullscreen-input"
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
              <Input
                value={value}
                onChange={handleFullscreenChange}
                className="text-lg"
                placeholder={props.placeholder}
                autoFocus
                data-testid="input-fullscreen-edit"
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

FullscreenInput.displayName = "FullscreenInput";

export { FullscreenInput };
