use once_cell::sync::Lazy;
use serde::Serialize;
use std::collections::HashMap;
use std::sync::Mutex;
use sysinfo::{CpuRefreshKind, MemoryRefreshKind, Networks, RefreshKind, System};

#[derive(Serialize)]
pub struct SystemStats {
    pub cpu: f32,
    pub ram: f32,
    pub net_down: u64,
    pub net_up: u64,
    pub system_name: Option<String>,
    pub kernel_version: Option<String>,
    pub os_version: Option<String>,
    pub host_name: Option<String>,
}

static SYSTEM: Lazy<Mutex<System>> = Lazy::new(|| {
    Mutex::new(System::new_with_specifics(
        RefreshKind::new()
            .with_cpu(CpuRefreshKind::everything())
            .with_memory(MemoryRefreshKind::new()),
    ))
});

static PREV_NETWORK_STATS: Lazy<Mutex<HashMap<String, (u64, u64)>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

#[tauri::command]
pub fn get_system_stats() -> SystemStats {
    let mut system = SYSTEM.lock().unwrap();
    system.refresh_cpu();
    system.refresh_memory();

    let networks = Networks::new_with_refreshed_list();
    let mut prev_stats = PREV_NETWORK_STATS.lock().unwrap();

    let mut net_down = 0;
    let mut net_up = 0;

    for (iface, data) in networks.iter() {
        let current_down = data.received();
        let current_up = data.transmitted();

        if let Some((prev_down, prev_up)) = prev_stats.get(iface) {
            net_down += current_down.saturating_sub(*prev_down);
            net_up += current_up.saturating_sub(*prev_up);
        }

        prev_stats.insert(iface.clone(), (current_down, current_up));
    }

    let cpu_usage = system.global_cpu_info().cpu_usage();
    let ram_usage = (system.used_memory() as f32 / system.total_memory() as f32) * 100.0;

    SystemStats {
        cpu: cpu_usage,
        ram: ram_usage,
        net_down,
        net_up,
        system_name: System::name(),
        kernel_version: System::kernel_version(),
        os_version: System::os_version(),
        host_name: System::host_name(),
    }
}
