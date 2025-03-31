import { getName, getTauriVersion, getVersion } from "@tauri-apps/plugin-app";
import { Icons } from "@/components/icons";
import { useState } from "react";

import { DialogContent, DialogDescription, DialogHeader } from "./ui/dialog";

export function AboutDialog() {
  const [updateText, setUpdateText] = useState("");
  const [version, setVersion] = useState("");
  const [name, setName] = useState("");
  const [tauriVersion, setTauriVersion] = useState("");

  getVersion().then((x) => setVersion(x));
  getName().then((x) => setName(x));
  getTauriVersion().then((x) => setTauriVersion(x));

  return (
    <DialogContent className="overflow-clip pb-2">
      <DialogHeader className="flex items-center text-center">
        <div className="rounded-full bg-background p-[6px] text-slate-600 drop-shadow-none transition duration-1000 hover:text-slate-800 hover:drop-shadow-[0_0px_10px_rgba(0,10,50,0.50)] dark:hover:text-slate-400 ">
          <Icons.logo className="h-12 w-12" />
        </div>
        <DialogDescription className=" text-foreground">
          App description.
        </DialogDescription>

        <span className="text-xs text-gray-400">{updateText}</span>
        <DialogDescription className="flex flex-row"></DialogDescription>
      </DialogHeader>

      <span className="font-mono text-xs font-medium text-gray-400">
        Tauri version: {tauriVersion}
      </span>
    </DialogContent>
  );
}
