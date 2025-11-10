import React from "react";
import { cn } from "@/lib/utils";

const Spinner = ({ size = "default", variant = "primary", className, ...props }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8", 
    lg: "h-12 w-12",
  };

  const variantClasses = {
    primary: "text-sky-600",
    secondary: "text-blue-500",
    white: "text-white",
    muted: "text-gray-400",
  };

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        sizeClasses[size],
        className
      )}
      {...props}
    >

      <div className={cn("relative", sizeClasses[size])}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "absolute rounded-full",
              sizeClasses[size === "sm" ? "sm" : size === "lg" ? "lg" : "default"],
              variantClasses[variant]
            )}
            style={{
              width: size === "sm" ? "4px" : size === "lg" ? "8px" : "6px",
              height: size === "sm" ? "4px" : size === "lg" ? "8px" : "6px",
              animation: `modernSpinner 1.4s ease-in-out infinite both`,
              animationDelay: `${i * 0.16}s`,
              transform: `rotate(${i * 120}deg) translate(${
                size === "sm" ? "12px" : size === "lg" ? "20px" : "16px"
              }, 0)`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes modernSpinner {
          0%,
          80%,
          100% {
            transform: scale(0);
            opacity: 0.3;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

// Alternative pulse rings animation
const PulseSpinner = ({ size = "default", variant = "primary", className, ...props }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const variantClasses = {
    primary: "border-sky-600/30",
    secondary: "border-blue-500/30", 
    white: "border-white/30",
    muted: "border-gray-400/30",
  };

  const innerVariantClasses = {
    primary: "bg-sky-600",
    secondary: "bg-blue-500",
    white: "bg-white", 
    muted: "bg-gray-400",
  };

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        sizeClasses[size],
        className
      )}
      {...props}
    >

      <div
        className={cn(
          "absolute rounded-full border-2 animate-ping",
          sizeClasses[size],
          variantClasses[variant]
        )}
      />

      <div
        className={cn(
          "rounded-full",
          innerVariantClasses[variant]
        )}
        style={{
          width: size === "sm" ? "6px" : size === "lg" ? "12px" : "8px",
          height: size === "sm" ? "6px" : size === "lg" ? "12px" : "8px",
        }}
      />
    </div>
  );
};

// Wave bars animation
const WaveSpinner = ({ size = "default", variant = "primary", className, ...props }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const variantClasses = {
    primary: "bg-sky-600",
    secondary: "bg-blue-500",
    white: "bg-white",
    muted: "bg-gray-400",
  };

  const barWidth = size === "sm" ? "2px" : size === "lg" ? "4px" : "3px";
  const barCount = 4;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center gap-1",
        className
      )}
      {...props}
    >
      {[...Array(barCount)].map((_, i) => (
        <div
          key={i}
          className={cn("rounded-sm", variantClasses[variant])}
          style={{
            width: barWidth,
            height: size === "sm" ? "16px" : size === "lg" ? "48px" : "32px",
            animation: `waveSpinner 1.2s ease-in-out infinite`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
      
      <style jsx>{`
        @keyframes waveSpinner {
          0%,
          40%,
          100% {
            transform: scaleY(0.4);
            opacity: 0.5;
          }
          20% {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

// Export all variants
Spinner.Pulse = PulseSpinner;
Spinner.Wave = WaveSpinner;

export { Spinner, PulseSpinner, WaveSpinner };
export default Spinner;
