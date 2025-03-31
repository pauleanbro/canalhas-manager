use std::fs;
use std::path::Path;

use crate::commands::event::WebhookEvent;
use crate::commands::hlds::get_hlds_path;
use crate::commands::webhook::emit_event;

#[tauri::command]
pub fn list_maps() -> Result<Vec<String>, String> {
    let path = get_hlds_path()?.ok_or("HLDS path não configurado.")?;
    let maps_path = Path::new(&path).join("cstrike/maps");

    if !maps_path.exists() {
        return Err("Pasta de mapas não encontrada.".to_string());
    }

    let mut maps = vec![];
    for entry in fs::read_dir(&maps_path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if let Some(ext) = path.extension() {
            if ext == "bsp" {
                if let Some(name) = path.file_stem() {
                    maps.push(name.to_string_lossy().into_owned());
                }
            }
        }
    }

    Ok(maps)
}

#[tauri::command]
pub fn delete_map_files(map_name: String) -> Result<(), String> {
    let path = get_hlds_path()?.ok_or("HLDS path não configurado.")?;
    let maps_path = Path::new(&path).join("cstrike/maps");
    let mut deleted = false;

    for entry in fs::read_dir(&maps_path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let file_path = entry.path();

        if let Some(file_name) = file_path.file_name().and_then(|n| n.to_str()) {
            if file_name.starts_with(&map_name) {
                fs::remove_file(&file_path)
                    .map_err(|e| format!("Erro ao remover {}: {}", file_name, e))?;
                deleted = true;
            }
        }
    }

    if deleted {
        tauri::async_runtime::spawn(async move {
            emit_event(WebhookEvent::MapDeleted(map_name)).await;
        });
    }

    Ok(())
}

#[tauri::command]
pub fn notify_map_added(map_name: String) -> Result<(), String> {
    tauri::async_runtime::spawn(async move {
        emit_event(WebhookEvent::MapAdded(map_name)).await;
    });
    Ok(())
}
