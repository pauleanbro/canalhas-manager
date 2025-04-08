use std::fs::{self, File};
use std::io::{BufRead, BufReader, Write};
use std::path::PathBuf;

use chrono::Local;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::commands::event::WebhookEvent;
use crate::commands::webhook::emit_event;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AdminEntry {
    pub name: Option<String>,
    pub auth: String,
    pub password: String,
    pub access: String,
    pub flags: String,
}

pub struct HldsPaths {
    pub hlds_path: PathBuf,
}

#[tauri::command]
pub fn list_admins(state: State<HldsPaths>) -> Result<Vec<AdminEntry>, String> {
    let path = state
        .hlds_path
        .join("cstrike/addons/amxmodx/configs/users.ini");
    let file = File::open(&path).map_err(|e| e.to_string())?;
    let reader = BufReader::new(file);

    let mut entries = vec![];
    let mut current_name: Option<String> = None;

    for line in reader.lines().flatten() {
        let trimmed = line.trim();

        if trimmed.starts_with("#[NOME:") {
            if let Some(name) = trimmed
                .strip_prefix("#[NOME:")
                .and_then(|s| s.strip_suffix("]"))
            {
                current_name = Some(name.trim().to_string());
            }
        } else if trimmed.starts_with('"') {
            let parts: Vec<&str> = trimmed.split_whitespace().collect();
            if parts.len() >= 4 {
                let auth = parts[0].trim_matches('"').to_string();
                let password = parts[1].trim_matches('"').to_string();
                let access = parts[2].trim_matches('"').to_string();
                let flags = parts[3].trim_matches('"').to_string();

                entries.push(AdminEntry {
                    name: current_name.clone(),
                    auth,
                    password,
                    access,
                    flags,
                });

                current_name = None;
            }
        }
    }

    Ok(entries)
}

#[tauri::command]
pub async fn remove_admin(state: State<'_, HldsPaths>, auth: String) -> Result<(), String> {
    let path = state
        .hlds_path
        .join("cstrike/addons/amxmodx/configs/users.ini");
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;

    let mut lines: Vec<&str> = vec![];
    let mut skip_next = false;

    for line in content.lines() {
        if skip_next {
            skip_next = false;
            continue;
        }

        if line.trim().starts_with('"') && line.contains(&auth) {
            if let Some(prev) = lines.last() {
                if prev.trim().starts_with("#[NOME:") {
                    lines.pop();
                }
            }
            continue;
        }

        lines.push(line);
    }

    fs::write(&path, lines.join("\n") + "\n").map_err(|e| e.to_string())?;

    emit_event(WebhookEvent::Custom {
        title: "Administrador Removido".into(),
        message: format!("ID `{}` foi removido da lista de admins", auth),
    })
    .await;

    Ok(())
}

#[tauri::command]
pub async fn update_admin(state: State<'_, HldsPaths>, updated: AdminEntry) -> Result<(), String> {
    let path = state
        .hlds_path
        .join("cstrike/addons/amxmodx/configs/users.ini");
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;

    let mut lines: Vec<&str> = vec![];
    let mut skip_next = false;

    for line in content.lines() {
        if skip_next {
            skip_next = false;
            continue;
        }

        if line.trim().starts_with('"') && line.contains(&updated.auth) {
            if let Some(prev) = lines.last() {
                if prev.trim().starts_with("#[NOME:") {
                    lines.pop();
                }
            }

            if let Some(name) = &updated.name {
                lines.push(Box::leak(format!("#[NOME: {}]", name).into_boxed_str()));
            }

            lines.push(Box::leak(
                format!(
                    "\"{}\" \"{}\" \"{}\" \"{}\"",
                    updated.auth, updated.password, updated.access, updated.flags
                )
                .into_boxed_str(),
            ));

            skip_next = true;
        } else {
            lines.push(line);
        }
    }

    fs::write(&path, lines.join("\n") + "\n").map_err(|e| e.to_string())?;

    emit_event(WebhookEvent::Custom {
        title: "Administrador Atualizado".into(),
        message: format!("ID `{}` teve seus dados atualizados", updated.auth),
    })
    .await;

    Ok(())
}

#[tauri::command]
pub async fn add_admin(state: State<'_, HldsPaths>, entry: AdminEntry) -> Result<(), String> {
    let path = state
        .hlds_path
        .join("cstrike/addons/amxmodx/configs/users.ini");
    let mut file = File::options()
        .append(true)
        .open(&path)
        .map_err(|e| e.to_string())?;

    if let Some(name) = &entry.name {
        writeln!(file, "#[NOME: {}]", name).map_err(|e| e.to_string())?;
    }

    writeln!(
        file,
        "\"{}\" \"{}\" \"{}\" \"{}\"",
        entry.auth, entry.password, entry.access, entry.flags
    )
    .map_err(|e| e.to_string())?;

    emit_event(WebhookEvent::Custom {
        title: "Novo Administrador Adicionado".into(),
        message: format!("ID `{}` foi adicionado como admin", entry.auth),
    })
    .await;

    Ok(())
}
