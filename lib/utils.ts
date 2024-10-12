import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export enum GAME_END_TYPE {
  "RESIGN",
  "DRAW",
  "STALEMATE",
  "CHECKMATE",
  "AUTO_DRAW"
}

export enum GAME_STATE {
  "INPROGRESS", 
  "HALTED", 
  "OVER",
  "NOTSTARTED"
}