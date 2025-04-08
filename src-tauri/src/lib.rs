mod commands;

use std::path::PathBuf;

use commands::{
    greet::greet,
    hlds::{
        get_hlds_path, get_server_config, is_hlds_running, save_hlds_path, save_server_config,
        send_command_to_hlds, start_hlds_server, stop_hlds_server, HldsState,
    },
    knife_scheduler::start_knife_scheduler,
    maps::{delete_map_files, list_maps},
    system::get_system_stats,
    users::{add_admin, list_admins, remove_admin, update_admin, HldsPaths},
    webhook::{add_webhook, list_webhooks, remove_webhook},
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    start_knife_scheduler();

    tauri::Builder::default()
        .manage(HldsState {
            process: std::sync::Arc::new(std::sync::Mutex::new(None)),
        })
        .manage(HldsPaths {
            hlds_path: get_hlds_path()
                .unwrap_or(None)
                .map(PathBuf::from)
                .unwrap_or_else(|| PathBuf::from(".")),
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_system_stats,
            get_hlds_path,
            save_hlds_path,
            start_hlds_server,
            stop_hlds_server,
            save_server_config,
            get_server_config,
            send_command_to_hlds,
            is_hlds_running,
            list_maps,
            delete_map_files,
            add_webhook,
            remove_webhook,
            list_webhooks,
            list_admins,
            add_admin,
            update_admin,
            remove_admin,
        ])
        .plugin(tauri_plugin_app::init())
        .plugin(tauri_plugin_dialog::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
