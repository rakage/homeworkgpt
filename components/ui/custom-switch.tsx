"use client";

import React from "react";

interface CustomSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
}

export function CustomSwitch({ checked, onCheckedChange, id, disabled = false }: CustomSwitchProps) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={`relative inline-flex items-center h-8 w-16 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
        checked 
          ? 'bg-primary shadow-lg' 
          : 'bg-gray-200 hover:bg-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {/* OFF Label */}
      <span 
        className={`absolute left-1 text-xs font-semibold transition-opacity duration-200 ${
          checked ? 'opacity-30 text-white/50' : 'opacity-100 text-gray-600'
        }`}
      >
        OFF
      </span>
      
      {/* ON Label */}
      <span 
        className={`absolute right-1 text-xs font-semibold transition-opacity duration-200 ${
          checked ? 'opacity-100 text-white/90' : 'opacity-30 text-gray-400'
        }`}
      >
        ON
      </span>
      
      {/* Toggle Circle */}
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
          checked ? 'translate-x-8' : 'translate-x-1'
        }`}
      />
    </button>
  );
}