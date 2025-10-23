"use client";

import { useState, type FC } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

interface PasswordTextFieldProps {
  placeholder: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PasswordTextField: FC<PasswordTextFieldProps> = ({
  placeholder,
  value,
  onChange,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl bg-gray-100 py-3 pl-12 pr-12 text-gray-700 focus:outline-none"
      />
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
        <Lock size={20} />
      </span>
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
      >
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  );
};

export default PasswordTextField;