import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string;
}

interface MultiSelectTagProps {
  label?: string;
  placeholder?: string;
  options?: Option[];
  value: string[];
  onChange: (selected: string[]) => void;
  className?: string;
  error?: string;
  allowCustomTags?: boolean; // Allow users to add custom tags with #
}

export const MultiSelectTag: React.FC<MultiSelectTagProps> = ({
  label,
  placeholder = "Chọn...",
  options = [],
  value,
  onChange,
  className,
  error,
  allowCustomTags = true,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSelect = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const handleAddCustomTag = (tag: string) => {
    const cleanTag = tag.trim().replace(/^#+/, ''); // Remove leading hashtags
    if (cleanTag && !value.includes(cleanTag)) {
      onChange([...value, cleanTag]);
    }
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (allowCustomTags && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      if (inputValue.trim()) {
        handleAddCustomTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last tag on backspace when input is empty
      onChange(value.slice(0, -1));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Auto add hashtag if user types without it
    if (allowCustomTags && val && !val.startsWith('#') && inputValue === '') {
      setInputValue('#' + val);
    } else {
      setInputValue(val);
    }
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      {label && (
        <label className="text-base font-medium text-foreground">{label}</label>
      )}
      <div className="relative">
        <div
          className={cn(
            "flex flex-wrap items-center gap-2 border bg-white rounded-full px-4 py-2 min-h-11",
            isOpen ? 'border-primary border-2' : error ? 'border-destructive' : 'border-input'
          )}
        >
          {value.map((val) => {
            const option = options.find((o) => o.value === val);
            const displayText = option?.label || `#${val}`;
            return (
              <span
                key={val}
                className="flex items-center gap-1 bg-primary/10 text-primary text-sm px-3 py-1 rounded-full"
              >
                {displayText}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(value.filter((v) => v !== val));
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            );
          })}
          {allowCustomTags && (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsOpen(true)}
              onBlur={() => {
                setTimeout(() => setIsOpen(false), 200);
                if (inputValue.trim()) {
                  handleAddCustomTag(inputValue);
                }
              }}
              placeholder={value.length === 0 ? placeholder : ""}
              className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
            />
          )}
          {!allowCustomTags && value.length === 0 && (
            <span className="text-muted-foreground text-sm">{placeholder}</span>
          )}
        </div>

        {isOpen && options.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  "px-4 py-2 text-sm cursor-pointer hover:bg-muted",
                  value.includes(opt.value) && "bg-muted text-primary font-medium"
                )}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};
