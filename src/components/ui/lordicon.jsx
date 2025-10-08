import React, { useEffect } from "react";
import { cn } from "@/lib/utils";

const Lordicon = ({ 
  size = "default", 
  variant = "primary", 
  className, 
  style = {},
  ...props 
}) => {
  const sizeClasses = {
    sm: "w-8 h-8 sm:w-16 sm:h-16",
    default: "w-16 h-16 sm:w-32 sm:h-32", 
    lg: "w-24 h-24 sm:w-48 sm:h-48 md:w-64 md:h-64",
  };

  const variantColors = {
    primary: "primary:#66a1ee,secondary:#3080e8",
    secondary: "primary:#3b82f6,secondary:#dbeafe",
    white: "primary:#ffffff,secondary:#f8fafc",
    muted: "primary:#64748b,secondary:#e2e8f0",
  };

  useEffect(() => {
    // Load the Lordicon script if not already loaded
    if (!document.querySelector('script[src="https://cdn.lordicon.com/lordicon.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://cdn.lordicon.com/lordicon.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center mx-auto",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <lord-icon
        src="https://cdn.lordicon.com/vmzmljdv.json"
        trigger="loop"
        stroke="bold"
        colors={variantColors[variant]}
        style={{
          width: size === "sm" ? "32px" : size === "lg" ? "96px" : "64px",
          height: size === "sm" ? "32px" : size === "lg" ? "96px" : "64px",
          ...style
        }}
      />
    </div>
  );
};

export { Lordicon };
export default Lordicon;
