import React from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "@/types";
import { cn } from "@/lib/utils";

interface ProAvatarProps {
  initials: string;
  isPro: boolean;
  className?: string;
  onClick?: () => void;
}

export default function ProAvatar({ initials, isPro, className, onClick }: ProAvatarProps) {
  return (
    <div className={cn(
      "relative inline-flex rounded-full", 
      isPro ? "before:absolute before:inset-0 before:-m-0.5 before:rounded-full before:border-2 before:border-amber-400 before:animate-pulse" : "",
      className
    )}>
      <Avatar 
        className={cn("h-8 w-8 hover:opacity-80 transition-opacity", isPro ? "ring-2 ring-amber-400" : "")}
        onClick={onClick}
      >
        <AvatarFallback className={cn(
          "bg-primary text-white",
          isPro ? "bg-gradient-to-r from-amber-500 to-yellow-400" : ""
        )}>
          {initials}
        </AvatarFallback>
      </Avatar>

      {isPro && (
        <span className="absolute -top-3 left-[50%] transform -translate-x-1/2 rotate-[-5deg]">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none"
            stroke="currentColor" 
            strokeWidth="2"
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="text-primary h-5 w-5"
          >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
          </svg>
        </span>
      )}
    </div>
  );
}