"use client";
import React, { useState, useEffect, useRef } from "react";

interface Option {
  label: string;
  value: string;
}

type RawOption = Option | string;

interface SearchableSelectProps {
  options: RawOption[];
  value: string | string[];
  onChange: any;
  onDelete?: (value: string) => void; // Optional delete handler
  placeholder?: string;
  className?: string;
  isMulti?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  onDelete,
  placeholder = "Select...",
  className = "",
  isMulti = false,
}) => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Normalize into Option[]
  const normalized = React.useMemo<Option[]>(() => {
    return options.map(opt =>
      typeof opt === "string" ? { label: opt, value: opt } : opt
    );
  }, [options]);

  // Filtered list
  const filteredOptions = normalized.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  // Outside click closes
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helpers for multi vs single
  const isSelected = (opt: Option) => {
    if (isMulti && Array.isArray(value)) {
      return value.includes(opt.value);
    }
    return !isMulti && value === opt.value;
  };

  const handleOptionClick = (opt: Option) => {
    if (isMulti) {
      const arr = Array.isArray(value) ? [...value] : [];
      const idx = arr.indexOf(opt.value);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(opt.value);
      onChange(arr);
      setSearch("");
      // keep open
    } else {
      onChange(opt.value);
      setSearch("");
      setIsOpen(false);
    }
  };

  // What to show in the input
  const displayValue = () => {
    if (isMulti && Array.isArray(value)) {
      const labels = normalized
        .filter(opt => value.includes(opt.value))
        .map(opt => opt.label);
      return isOpen ? search : labels.join(", ");
    } else {
      if (!isOpen && typeof value === "string" && value) {
        return normalized.find(opt => opt.value === value)?.label || "";
      }
      return search;
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={wrapperRef}>
      <input
        type="text"
        className="w-full border border-gray-300 rounded-lg px-2 py-1 mt-1 text-xs md:text-sm focus:ring focus:ring-deepblue focus:outline-none"
        placeholder={placeholder}
        value={displayValue()}
        onChange={e => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />

      {isOpen && (
        <ul className="absolute z-10 w-full bg-white shadow-md mt-1 max-h-48 overflow-y-auto rounded-md border border-gray-200 text-sm">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(opt => (
              <li
                key={opt.value}
                className={`flex justify-between items-center px-3 py-2 cursor-pointer text-xs md:text-sm
                  ${isSelected(opt) ? "bg-deepblue text-white hover:bg-orange-200 hover:text-deepblue" : "hover:bg-gray-100"}`}
                onClick={() => handleOptionClick(opt)}
              >
                <span className="flex-1">{opt.label}</span>
                {onDelete && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      onDelete(opt.value);
                    }}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-gray-500 text-xs md:text-sm">
              No results found
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchableSelect;
