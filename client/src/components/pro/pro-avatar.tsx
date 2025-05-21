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
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-white ring-1 ring-white">
          PRO
        </span>
      )}
    </div>
  );
}