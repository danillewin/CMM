import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { CheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditableCellProps {
  value: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}

export function EditableCell({ value, onSave, onCancel }: EditableCellProps) {
  const [editedValue, setEditedValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSave(editedValue);
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full max-w-[300px]">
      <Input
        ref={inputRef}
        value={editedValue}
        onChange={(e) => setEditedValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-9 w-full min-w-[120px]"
      />
      <div className="flex gap-1 w-full sm:w-auto">
        <Button
          size="sm"
          variant="secondary"
          className="flex-1 sm:flex-initial h-9 px-3"
          onClick={() => onSave(editedValue)}
        >
          <CheckIcon className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">Save</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="flex-1 sm:flex-initial h-9 px-3"
          onClick={onCancel}
        >
          <XIcon className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">Cancel</span>
        </Button>
      </div>
    </div>
  );
}