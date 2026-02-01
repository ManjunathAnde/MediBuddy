import React, { useState } from 'react';
import { Eye, EyeOff, LucideIcon } from 'lucide-react';

interface AccessibleInputProps {
  id: string;
  label: string;
  type: 'text' | 'email' | 'password';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  icon?: LucideIcon;
  error?: string;
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  icon: Icon,
  error
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col mb-6 w-full">
      <label 
        htmlFor={id} 
        className="text-xl font-semibold text-warmGray mb-3 ml-1 block"
      >
        {label}
      </label>
      
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
          {Icon && <Icon size={28} />}
        </div>
        
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            w-full h-[64px] 
            ${Icon ? 'pl-14' : 'pl-4'} 
            ${isPassword ? 'pr-14' : 'pr-4'}
            text-xl bg-white 
            border-2 rounded-lg
            focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500
            transition-all duration-200
            ${error ? 'border-alertRed' : 'border-gray-300'}
            text-warmGray
          `}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-0 top-0 h-full px-4 text-gray-600 hover:text-gray-900 focus:outline-none focus:bg-gray-100 rounded-r-lg"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={28} /> : <Eye size={28} />}
          </button>
        )}
      </div>
      
      {error && (
        <p className="text-alertRed text-lg mt-2 font-medium flex items-center">
          <span className="sr-only">Error:</span>
          {error}
        </p>
      )}
    </div>
  );
};