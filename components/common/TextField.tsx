import { type FC } from "react";

interface TextFieldProps {
  type: "text" | "password" | "email" | "tel";
  placeholder: string;
  icon: React.ReactNode;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const TextField: FC<TextFieldProps> = ({
  type,
  placeholder,
  icon,
  value,
  onChange,
}) => {
  return (
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl  bg-gray-100 py-3 pl-12 pr-4 text-gray-700 focus:outline-none"
      />
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
        {icon}
      </span>
    </div>
  );
};

export default TextField;