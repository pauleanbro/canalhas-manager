import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { useEffect, useRef, useState } from "react";
import { Titlebar } from "@/components/Titlebar";
import { open } from "@tauri-apps/plugin-dialog";
import { Sidebar } from "@/components/sidebar";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import WebhooksPage from "@/pages/webhooks";
import SettingsPage from "@/pages/settings";
import Console from "@/pages/console";
import MapsPage from "@/pages/maps";
import { Send } from "lucide-react";
import { Toaster } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { cn } from "./lib/utils";

function App() {
  const [command, setCommand] = useState("");
  const [consoleLines, setConsoleLines] = useState<string[]>([]);
  const [hldsPath, setHldsPath] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let lastLine = "";
    const unlisten = listen<string>("hlds-log", (event) => {
      if (event.payload !== lastLine) {
        setConsoleLines((prev) => [...prev, event.payload]);
        lastLine = event.payload;
      }
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  useEffect(() => {
    const checkPath = async () => {
      const saved = await invoke<string | null>("get_hlds_path");
      if (saved) setHldsPath(saved);
    };
    checkPath();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [consoleLines]);

  const handleSelectFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Selecione a pasta do HLDS",
    });
    if (typeof selected === "string") {
      await invoke("save_hlds_path", { path: selected });
      setHldsPath(selected);
    }
  };

  const sendCommand = async () => {
    if (!command.trim()) return;
    const timestamp = new Date().toLocaleTimeString();
    setConsoleLines((lines) => [...lines, `[${timestamp}] > ${command}`]);
    try {
      await invoke("send_command_to_hlds", { command });
    } catch (err) {
      console.error("Erro ao enviar comando:", err);
    }
    setCommand("");
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Toaster position="top-right" richColors />
      <Router>
        <div className="h-screen flex overflow-hidden">
          <Sidebar />

          <div className="flex-1 flex flex-col h-screen overflow-hidden">
            <Titlebar />
            <div
              className="w-full flex bg-background text-foreground"
              style={{ height: "calc(100vh - 40px)" }}
            >
              <Dialog open={!hldsPath}>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>
                      Selecione a pasta do servidor HLDS
                    </DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    É necessário selecionar a pasta do servidor para continuar
                    usando o aplicativo.
                  </p>
                  <Button className="w-full mt-4" onClick={handleSelectFolder}>
                    Selecionar pasta
                  </Button>
                </DialogContent>
              </Dialog>

              <div className="flex w-1/2 flex-col border-r border-border h-full">
                <div
                  className="flex-1 overflow-y-auto px-4 py-2 font-mono text-sm"
                  ref={scrollRef}
                >
                  {consoleLines.map((line, idx) => {
                    const isError =
                      line.toLowerCase().includes("error") ||
                      line.includes("FATAL");
                    const isWarning = line.toLowerCase().includes("warn");
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "text-muted-foreground",
                          isError && "text-red-500",
                          isWarning && "text-yellow-500"
                        )}
                      >
                        {line}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2 border-t border-border bg-background/95 px-4 py-3">
                  <Input
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendCommand()}
                    placeholder="Digite um comando..."
                    className="text-sm"
                  />
                  <Button onClick={sendCommand}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="w-1/2 space-y-4 p-4 overflow-auto h-full">
                <Routes>
                  <Route path="/" element={<Console />} />
                  <Route path="/maps" element={<MapsPage />} />
                  <Route path="/webhooks" element={<WebhooksPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </div>
            </div>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
