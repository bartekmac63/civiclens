import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

export interface SearchResult {
  id: string | number;
  label: string;
  sublabel?: string;
}

export interface SearchBarProps {
  /** Called with the query, debounced (default 300ms). */
  onQueryChange: (query: string) => void;
  results?: SearchResult[];
  onSelect?: (result: SearchResult) => void;
  onSeeAll?: () => void;
  placeholder?: string;
  maxResults?: number;
  debounceMs?: number;
}

/**
 * §2.8 — full-width search with a results dropdown. Debounced; clearable;
 * keyboard-navigable via the combobox aria-activedescendant pattern (focus
 * stays in the input, Esc closes). Meaning never rests on colour.
 */
export function SearchBar({
  onQueryChange,
  results = [],
  onSelect,
  onSeeAll,
  placeholder = 'Search MPs and bills',
  maxResults = 8,
  debounceMs = 300,
}: SearchBarProps) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const optionId = (i: number) => `${listId}-opt-${i}`;

  useEffect(() => {
    const timer = setTimeout(() => onQueryChange(value), debounceMs);
    return () => clearTimeout(timer);
  }, [value, debounceMs, onQueryChange]);

  const visible = results.slice(0, maxResults);
  const showList = open && value.trim() !== '' && visible.length > 0;
  const showSeeAll = Boolean(onSeeAll) && results.length > maxResults;

  function select(result: SearchResult) {
    onSelect?.(result);
    setValue(result.label);
    setOpen(false);
    setActiveIndex(-1);
  }

  function clear() {
    setValue('');
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, visible.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0 && visible[activeIndex]) {
      e.preventDefault();
      select(visible[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="relative w-full" onBlur={(e) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
    }}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
        <SearchIcon />
      </span>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
        aria-label={placeholder}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="h-10 w-full rounded-md border border-border bg-bg-primary pl-9 pr-9 text-base text-text-primary placeholder:text-text-tertiary focus:border-text-primary focus:shadow-sm focus:outline-none"
      />
      {value !== '' && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={clear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-text-tertiary hover:text-text-primary"
        >
          <ClearIcon />
        </button>
      )}

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-border bg-bg-elevated shadow-md"
        >
          {visible.map((result, i) => (
            <li
              key={result.id}
              id={optionId(i)}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(result)}
              className={cn(
                'cursor-pointer px-3 py-2 text-base',
                i === activeIndex ? 'bg-accent-subtle' : 'hover:bg-bg-secondary',
              )}
            >
              <span className="block truncate text-text-primary">{result.label}</span>
              {result.sublabel && (
                <span className="block truncate text-sm text-text-secondary">
                  {result.sublabel}
                </span>
              )}
            </li>
          ))}
          {showSeeAll && (
            <li role="option" aria-selected={false}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSeeAll?.()}
                className="w-full px-3 py-2 text-left text-sm text-accent hover:bg-bg-secondary"
              >
                See all results
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m11 11 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="m3.5 3.5 7 7m0-7-7 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default SearchBar;
