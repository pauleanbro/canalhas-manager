import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

type Stats = {
  cpu: number;
  ram: number;
  net_down: number;
  net_up: number;
  system_name?: string;
  kernel_version?: string;
  os_version?: string;
  host_name?: string;
};

export function useSystemStats(): Stats {
  const [stats, setStats] = useState<Stats>({
    cpu: 0,
    ram: 0,
    net_down: 0,
    net_up: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      invoke<Stats>("get_system_stats").then(setStats).catch(console.error);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}
