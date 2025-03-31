"use client";

import { useCallback } from "react";
import {
  Minus,
  Square,
  X as CloseIcon,
  Sailboat,
  Sun,
  Moon,
} from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

export function Titlebar() {
  const { setTheme, theme } = useTheme();
  const appWindow = getCurrentWindow();

  const minimize = useCallback(() => appWindow.minimize(), []);
  const maximize = useCallback(() => appWindow.toggleMaximize(), []);
  const close = useCallback(() => appWindow.close(), []);

  return (
    <div className="select-none backdrop-blur-md bg-background/70 border-b border-border">
      <div
        className="relative flex h-10 items-center justify-between px-3"
        data-tauri-drag-region
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>

        {/* Título centralizado */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 text-sm text-muted-foreground pointer-events-none">
          <Sailboat className="h-4 w-4 text-cyan-500" />
          <span className="font-semibold">Canalhas Manager</span>
        </div>

        {/* Botões de controle à direita */}
        <div className="flex items-center gap-1 z-10 ml-auto">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={minimize}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={maximize}
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 hover:bg-red-500 hover:text-white"
            onClick={close}
          >
            <CloseIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
