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
      isPro ? "before:absolute before:inset-0 before:-m-0.5 before:rounded-full before:border-2 before:border-amber-400 before:animate-pro-pulse" : "",
      className
    )}>
      <Avatar 
        className={cn(
          "h-8 w-8 hover:opacity-80 transition-opacity", 
          isPro ? "ring-2 ring-amber-400 shadow-md shadow-amber-200/50" : ""
        )}
        onClick={onClick}
      >
        <AvatarFallback className={cn(
          "bg-primary text-white bg-gradient-to-br from-blue-600 to-blue-700",
          isPro ? "ring-1 ring-amber-300" : ""
        )}>
          {initials}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}