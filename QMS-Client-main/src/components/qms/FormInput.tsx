import React from "react";

interface FormInputProps {
  label: string;
  placeholder?: string;
  type?: "text" | "number" | "date" | "password";
  textarea?: boolean;
  options?: string[];
  value?: string;
  onChange?: (val: string) => void;
  span?: 2;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  placeholder,
  type = "text",
  textarea,
  options,
  value,
  onChange,
  span,
}) => {
  const fieldClass =
    "w-full bg-asvo-surface border border-asvo-border rounded-lg px-3 py-2 text-asvo-text text-[13px] outline-none focus:ring-1 focus:ring-asvo-accent transition-shadow";

  return (
    <div style={span === 2 ? { gridColumn: "span 2" } : undefined}>
      <label className="block text-[11px] text-asvo-text-dim font-semibold tracking-wide uppercase mb-1.5">
        {label}
      </label>

      {options ? (
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={fieldClass}
        >
          <option value="">{placeholder || "Выберите..."}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : textarea ? (
        <textarea
          rows={3}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={`${fieldClass} resize-y`}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={fieldClass}
        />
      )}
    </div>
  );
};

export default FormInput;
