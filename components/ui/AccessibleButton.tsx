import React from 'react';

interface AccessibleButtonProps {
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
  disabled?: boolean;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  onClick,
  type = 'button',
  children,
  variant = 'primary',
  fullWidth = false,
  disabled = false
}) => {
  const baseStyles = "h-[64px] text-xl font-bold rounded-lg transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-gentleGreen text-white hover:bg-[#43A047] focus:ring-green-200 shadow-md active:transform active:scale-[0.98]",
    secondary: "bg-white border-2 border-gentleGreen text-gentleGreen hover:bg-green-50 focus:ring-green-100",
    ghost: "bg-transparent text-warmGray hover:bg-gray-100 focus:ring-gray-200 underline decoration-2 underline-offset-4"
  };

  const widthClass = fullWidth ? "w-full" : "px-8";
  const disabledClass = disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${disabledClass}`}
    >
      {children}
    </button>
  );
};