use std::{
    fs::{self, File},
    io::{BufRead, BufReader, Read, Write},
    path::PathBuf,
    process::{Child, Command, Stdio},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    thread::{self, JoinHandle},
};

use chrono::Local;
use serde::{Deserialize, Serialize};

use tauri::Emitter;
use tauri::{AppHandle, Manager, State};

use crate::commands::event::WebhookEvent;
use crate::commands::knife_score::register_knife_kill;
use crate::commands::webhook::emit_event;

pub struct HldsState {
    pub process: Arc<Mutex<Option<(Child, JoinHandle<()>, Arc<AtomicBool>)>>>,
}

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct ServerConfig {
    pub port: String,
    pub map: String,
}

fn free_port(port: &str) {
    #[cfg(unix)]
    {
        let output = Command::new("lsof")
            .arg("-t")
            .arg(format!("-i:{}", port))
            .output();

        if let Ok(output) = output {
            if output.status.success() {
                let pids = String::from_utf8_lossy(&output.stdout);
                for pid in pids.lines() {
                    let _ = Command::new("kill").arg("-9").arg(pid).output();
                    println!("🔪 Porta {} liberada: matou processo {}", port, pid);
                }
            }
        }
    }

    #[cfg(windows)]
    {
        let output = Command::new("netstat").args(["-ano"]).output();

        if let Ok(output) = output {
            let output_str = String::from_utf8_lossy(&output.stdout);
            for line in output_str.lines() {
                if line.contains(&format!(":{}", port)) {
                    if let Some(pid) = line.split_whitespace().last() {
                        let _ = Command::new("taskkill").args(["/F", "/PID", pid]).output();
                        println!("🔪 Porta {} liberada: matou processo {}", port, pid);
                    }
                }
            }
        }
    }
}

#[tauri::command]
pub fn start_hlds_server(app: AppHandle, state: State<HldsState>) -> Result<(), String> {
    let path = get_hlds_path()?.ok_or("HLDS path não configurado.")?;
    let config = get_server_config()?.unwrap_or_default();
    let port = config.port.clone();

    free_port(&port);
    stop_hlds_server(state.clone()).ok();

    let mut process = Command::new(format!("{}/hlds_run", path))
        .current_dir(&path)
        .arg("-console")
        .arg("-game")
        .arg("cstrike")
        .arg("+port")
        .arg(&config.port)
        .arg("+map")
        .arg(&config.map)
        .arg("+maxplayers")
        .arg("32")
        .stdout(Stdio::piped())
        .stdin(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Erro ao iniciar HLDS: {}", e))?;

    let stdout = process.stdout.take().ok_or("stdout não disponível")?;
    let app_clone = app.clone();
    let running_flag = Arc::new(AtomicBool::new(true));
    let running_flag_thread = running_flag.clone();

    let handle = thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines().flatten() {
            if !running_flag_thread.load(Ordering::Relaxed) {
                break;
            }

            let line_lower = line.to_lowercase();

            if line_lower.contains("segmentation fault") || line_lower.contains("couldn't open") {
                tauri::async_runtime::spawn(async {
                    emit_event(WebhookEvent::ErrorOccurred).await;
                });
            }

            if line.starts_with("[CANALHAS-EVENT] knife_kill |") {
                let data = line
                    .trim_start_matches("[CANALHAS-EVENT] knife_kill |")
                    .trim();
                let parts: Vec<&str> = data.split('|').map(str::trim).collect();

                if parts.len() == 4 {
                    let killer_id = parts[0].to_string();
                    let killer_name = parts[1].to_string();
                    let victim_id = parts[2].to_string();
                    let victim_name = parts[3].to_string();

                    tauri::async_runtime::spawn(async move {
                        let (killer_score, victim_score) = register_knife_kill(
                            killer_id.clone(),
                            killer_name.clone(),
                            victim_id.clone(),
                            victim_name.clone(),
                        );

                        emit_event(WebhookEvent::KnifeKill {
                            killer_id,
                            killer_name,
                            victim_id,
                            victim_name,
                            killer_score,
                            victim_score,
                        })
                        .await;
                    });
                }
            }

            let timestamp = Local::now().format("%H:%M:%S");
            let formatted = format!("[{}] {}", timestamp, line);
            let _ = app_clone.emit("hlds-log", &formatted);
        }
    });

    *state.process.lock().unwrap() = Some((process, handle, running_flag));

    tauri::async_runtime::spawn(async {
        emit_event(WebhookEvent::ServerStarted).await;
    });

    Ok(())
}

#[tauri::command]
pub fn stop_hlds_server(state: State<HldsState>) -> Result<(), String> {
    if let Some((mut process, handle, flag)) = state.process.lock().unwrap().take() {
        flag.store(false, Ordering::Relaxed);
        let _ = process
            .kill()
            .map_err(|e| format!("Erro ao matar processo: {}", e))?;
        let _ = process
            .wait()
            .map_err(|e| format!("Erro ao aguardar encerramento: {}", e))?;

        thread::spawn(move || {
            let _ = handle.join();
        });

        tauri::async_runtime::spawn(async {
            emit_event(WebhookEvent::ServerStopped).await;
        });
    }

    Ok(())
}

#[tauri::command]
pub fn send_command_to_hlds(command: String, state: State<HldsState>) -> Result<(), String> {
    if let Some((proc, _, _)) = &mut *state.process.lock().unwrap() {
        if let Some(stdin) = &mut proc.stdin {
            stdin
                .write_all(format!("{}\n", command).as_bytes())
                .map_err(|e| format!("Erro ao enviar comando: {}", e))?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn save_hlds_path(path: String) -> Result<(), String> {
    let config_path = get_config_path().map_err(|e| e.to_string())?;
    let json = serde_json::json!({ "hlds_path": path });
    fs::write(config_path, json.to_string()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_hlds_path() -> Result<Option<String>, String> {
    let config = read_or_create_config()?;
    Ok(config
        .get("hlds_path")
        .and_then(|v| v.as_str())
        .map(String::from))
}

#[tauri::command]
pub fn save_server_config(config: ServerConfig) -> Result<(), String> {
    let config_path = get_config_path().map_err(|e| e.to_string())?;
    let mut contents = String::new();
    let _ = File::open(&config_path).and_then(|mut f| f.read_to_string(&mut contents));

    let mut json = if contents.is_empty() {
        serde_json::json!({})
    } else {
        serde_json::from_str::<serde_json::Value>(&contents)
            .unwrap_or_else(|_| serde_json::json!({}))
    };

    json["server_config"] = serde_json::json!({
        "port": config.port,
        "map": config.map
    });

    fs::write(config_path, json.to_string()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_server_config() -> Result<Option<ServerConfig>, String> {
    let config = read_or_create_config()?;
    if let Some(cfg) = config.get("server_config") {
        let parsed: ServerConfig =
            serde_json::from_value(cfg.clone()).map_err(|e| e.to_string())?;
        Ok(Some(parsed))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn is_hlds_running(state: State<HldsState>) -> bool {
    if let Some((ref mut process, _, _)) = *state.process.lock().unwrap() {
        if let Ok(Some(_)) = process.try_wait() {
            false
        } else {
            true
        }
    } else {
        false
    }
}

fn read_or_create_config() -> Result<serde_json::Value, String> {
    let config_path = get_config_path().map_err(|e| e.to_string())?;
    if config_path.exists() {
        let mut contents = String::new();
        File::open(&config_path)
            .map_err(|e| e.to_string())?
            .read_to_string(&mut contents)
            .map_err(|e| e.to_string())?;
        serde_json::from_str(&contents).map_err(|e| e.to_string())
    } else {
        Ok(serde_json::json!({}))
    }
}

fn get_config_path() -> Result<PathBuf, std::io::Error> {
    let mut path = dirs::config_dir().ok_or(std::io::ErrorKind::NotFound)?;
    path.push("canalhas-manager");
    fs::create_dir_all(&path)?;
    Ok(path.join("hlds_config.json"))
}
