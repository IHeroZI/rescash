"use client";

interface ErrorLabelProps {
  message?: string;
  className?: string;
}

export default function ErrorLabel({ message, className = "" }: ErrorLabelProps) {
  if (!message) return null;

  return (
    <p className={`text-sm text-red-600 mt-1 ${className}`}>
      {message}
    </p>
  );
}
