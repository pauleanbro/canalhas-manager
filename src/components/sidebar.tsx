// components/sidebar.tsx
"use client";

import {
  LayoutDashboard,
  Map as MapIcon,
  Power,
  ServerCog,
  Webhook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "next-themes";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";

export function Sidebar() {
  const [serverRunning, setServerRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const toggleServer = async () => {
    setLoading(true);
    try {
      if (serverRunning) {
        await invoke("stop_hlds_server");
        setServerRunning(false);
      } else {
        await invoke("start_hlds_server");
        setServerRunning(true);
      }
    } catch (err) {
      console.error("Erro ao alternar servidor:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="w-20 bg-muted border-r border-border flex flex-col justify-between items-center py-4">
        <div className="space-y-4 flex flex-col items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={location.pathname === "/" ? "default" : "ghost"}
                size="icon"
                onClick={() => navigate("/")}
              >
                <LayoutDashboard className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Dashboard</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={location.pathname === "/maps" ? "default" : "ghost"}
                size="icon"
                onClick={() => navigate("/maps")}
              >
                <MapIcon className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Gerenciar Mapas</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={
                  location.pathname === "/webhooks" ? "default" : "ghost"
                }
                size="icon"
                onClick={() => navigate("/webhooks")}
              >
                <Webhook className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Webhooks</TooltipContent>
          </Tooltip>
        </div>

        <div className="space-y-4 flex flex-col items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={loading}
                onClick={toggleServer}
              >
                <Power
                  className={cn("w-5 h-5", serverRunning ? "text-red-500" : "")}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {serverRunning ? "Desligar Servidor" : "Ligar Servidor"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={
                  location.pathname === "/settings" ? "default" : "ghost"
                }
                size="icon"
                onClick={() => navigate("/settings")}
              >
                <ServerCog className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Configurações</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
