"use client";

import { LaptopIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import {
  MenubarContent,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarTrigger,
} from "@/components/ui/menubar";

export function MenuModeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <MenubarMenu>
      <MenubarTrigger>Theme</MenubarTrigger>
      <MenubarContent forceMount>
        <MenubarRadioGroup value={theme}>
          <MenubarRadioItem value="light" onClick={() => setTheme("light")}>
            <SunIcon className="mr-2 h-4 w-4" />
            <span>Light</span>
          </MenubarRadioItem>
          <MenubarRadioItem value="dark" onClick={() => setTheme("dark")}>
            <MoonIcon className="mr-2 h-4 w-4" />
            <span>Dark</span>
          </MenubarRadioItem>
          <MenubarRadioItem value="system" onClick={() => setTheme("system")}>
            <LaptopIcon className="mr-2 h-4 w-4" />
            <span>System</span>
          </MenubarRadioItem>
        </MenubarRadioGroup>
      </MenubarContent>
    </MenubarMenu>
  );
}
