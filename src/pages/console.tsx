"use client";

import { useEffect, useState } from "react";
import { Cpu, MemoryStick, DownloadCloud, Info } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  BarChart,
  Bar,
  Legend,
} from "recharts";

import { useSystemStats } from "@/hooks/use-system-stats";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Console() {
  const {
    cpu,
    ram,
    net_down,
    net_up,
    system_name,
    kernel_version,
    os_version,
    host_name,
  } = useSystemStats();

  const [statsHistory, setStatsHistory] = useState<
    {
      time: string;
      cpu: number;
      ram: number;
      net_up: number;
      net_down: number;
    }[]
  >([]);

  useEffect(() => {
    const now = new Date().toLocaleTimeString();
    setStatsHistory((prev) => [
      ...prev.slice(-19),
      { time: now, cpu, ram, net_up, net_down },
    ]);
  }, [cpu, ram, net_down, net_up]);

  return (
    <ScrollArea className="h-full w-full px-4 pb-4 pt-2">
      <div className="max-w-6xl mx-auto space-y-4">
        <Card className="text-sm">
          <CardContent className="p-4 space-y-1">
            <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
              <Info className="h-4 w-4" /> Informações do sistema
            </div>
            <div className="text-muted-foreground">
              <p>
                <strong>Sistema:</strong> {system_name ?? "-"}
              </p>
              <p>
                <strong>Hostname:</strong> {host_name ?? "-"}
              </p>
              <p>
                <strong>Kernel:</strong> {kernel_version ?? "-"}
              </p>
              <p>
                <strong>Distribuição:</strong> {os_version ?? "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
                <Cpu className="h-4 w-4" /> Uso de CPU (%)
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={statsHistory}>
                  <defs>
                    <linearGradient id="cpuColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb7f0c" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#fb7f0c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                  />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    stroke="#fb7f0c"
                    fill="url(#cpuColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
                <MemoryStick className="h-4 w-4" /> Uso de RAM (%)
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={statsHistory}>
                  <defs>
                    <linearGradient id="ramColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb7f0c" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#fb7f0c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                  />
                  <Area
                    type="monotone"
                    dataKey="ram"
                    stroke="#fb7f0c"
                    fill="url(#ramColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardContent className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
                <DownloadCloud className="h-4 w-4" /> Rede (bytes/s)
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={statsHistory} barCategoryGap={8}>
                  <XAxis dataKey="time" hide />
                  <Tooltip />
                  <Legend />
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                  <Bar dataKey="net_down" fill="#38bdf8" name="Download" />
                  <Bar dataKey="net_up" fill="#34d399" name="Upload" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}
