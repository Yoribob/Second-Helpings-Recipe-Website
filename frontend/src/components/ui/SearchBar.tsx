"use client";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchBar({ value, onChange } : SearchBarProps) {
  return (
    <label>
      Search recipes
      <input type="search" 
      value={value} 
      placeholder="Try “pasta”…"
      onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
