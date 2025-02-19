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
    <div className="flex items-center gap-2">
      <Input
        ref={inputRef}
        value={editedValue}
        onChange={(e) => setEditedValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-8"
      />
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => onSave(editedValue)}
        >
          <CheckIcon className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={onCancel}
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
