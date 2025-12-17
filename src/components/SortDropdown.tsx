"use client"
import { useState } from 'react'

type Option = { value: string; label: string }

type Props = {
  name: string
  initialValue: string
  options: Option[]
  label?: string
}

export default function SortDropdown({ name, initialValue, options, label = 'Sort By' }: Props) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(initialValue)
  const current = options.find(o => o.value === value) || options[0]
  return (
    <div className="relative">
      {label ? <label className="block text-[color:var(--color-brown)] font-semibold mb-3">{label}</label> : null}
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full h-11 rounded-xl border-2 px-3 text-left text-[color:var(--color-brown)] border-[color:var(--color-brown)] hover:border-[color:var(--color-primary)] transition-colors flex items-center justify-between"
      >
        <span>{current.label}</span>
        <svg
          className={`h-4 w-4 text-[color:var(--color-brown)] transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <ul
        role="listbox"
        className={`absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg transition-all ${open ? 'opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-95'}`}
      >
        {options.map(opt => (
          <li key={opt.value}>
            <button
              type="button"
              role="option"
              aria-selected={value === opt.value}
              onClick={() => {
                setValue(opt.value)
                setOpen(false)
              }}
              className={`block w-full px-3 py-2 text-left transition-colors ${value === opt.value ? 'bg-blue-50 text-[color:var(--color-primary)]' : 'text-[color:var(--color-brown)] hover:bg-[color:var(--color-mustard)]/15'}`}
            >
              {opt.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}


