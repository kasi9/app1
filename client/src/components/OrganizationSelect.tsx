import React, { useState, useEffect, useRef } from "react";

interface Organization {_id: string, parentId: string, code: string, organizationName: string, address: string};

interface OrganizationSelectProps {
    label?: string;
    organizations: Organization[];
    value?: string; // selected organization id
    onChange: (organization: Organization | null) => void;
    placeholder?: string;
    clearable?: boolean;
}

export const OrganizationSelect: React.FC<OrganizationSelectProps> = ({ label = "", organizations, value, onChange, placeholder = "", clearable = true,}) => {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = organizations.filter(org =>
        org.organizationName.toLowerCase().includes(query.toLowerCase())
    );

    const selectedOrg = organizations.find(org => org._id === value);

    const handleSelect = (org: Organization) => {
        onChange(org);
        setQuery(org.organizationName);
        setOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!open) return;

        if (e.key === "ArrowDown") {
            setHighlightedIndex(prev => (prev + 1) % filtered.length);
        } else if (e.key === "ArrowUp") {
            setHighlightedIndex(prev => prev <= 0 ? filtered.length - 1 : prev - 1);
        } else if (e.key === "Enter" && highlightedIndex >= 0) {
            handleSelect(filtered[highlightedIndex]);
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };

    useEffect(() => {
        if (selectedOrg) {
            setQuery(selectedOrg.organizationName);
        }
    }, [selectedOrg]);

  const handleClear = () => {
    setQuery("");
    onChange(null);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="w-64 relative">
      {label && (<label className="block mb-1 text-sm font-medium text-gray-700">{label}</label>)}
      <input ref={inputRef} type="text" value={query} onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)} onKeyDown={handleKeyDown} placeholder={placeholder}
        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        {clearable && query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((org, index) => (
            <li key={org._id} onMouseDown={() => handleSelect(org)} onMouseEnter={() => setHighlightedIndex(index)}
              className={`px-3 py-2 cursor-pointer ${ highlightedIndex === index ? "bg-blue-100" : "hover:bg-gray-100"}`}>
              {org.organizationName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
