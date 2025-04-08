use chrono::Utc;
use once_cell::sync::Lazy;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::{
    fs::{self, File},
    io::{Read, Write},
    path::PathBuf,
    sync::Mutex,
};

use crate::commands::event::WebhookEvent;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Webhook {
    pub url: String,
    pub events: Vec<String>,
}

pub static WEBHOOKS_PATH: Lazy<PathBuf> = Lazy::new(|| {
    let mut path = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push("canalhas-manager/webhooks.json");
    path
});

pub static CLIENT: Lazy<Client> = Lazy::new(Client::new);
pub static WEBHOOK_MUTEX: Lazy<Mutex<()>> = Lazy::new(|| Mutex::new(()));

#[tauri::command]
pub fn add_webhook(url: String, events: Vec<String>) -> Result<(), String> {
    let _lock = WEBHOOK_MUTEX.lock().unwrap();
    let mut hooks = read_webhooks();
    hooks.push(Webhook { url, events });
    write_webhooks(&hooks)
}

#[tauri::command]
pub fn remove_webhook(url: String) -> Result<(), String> {
    let _lock = WEBHOOK_MUTEX.lock().unwrap();
    let hooks: Vec<Webhook> = read_webhooks()
        .into_iter()
        .filter(|w| w.url != url)
        .collect();
    write_webhooks(&hooks)
}

#[tauri::command]
pub fn list_webhooks() -> Vec<Webhook> {
    read_webhooks()
}

pub async fn emit_event(event: WebhookEvent) {
    let hooks = read_webhooks();
    let event_name = event.name().to_string();

    let matching_hooks: Vec<_> = hooks
        .into_iter()
        .filter(|h| h.events.contains(&event_name))
        .collect();

    println!(
        "📡 Emitindo evento '{}' para {} webhook(s)",
        event_name,
        matching_hooks.len()
    );

    let color = match &event {
        WebhookEvent::ServerStarted => 0x57F287,
        WebhookEvent::ServerStopped => 0xED4245,
        WebhookEvent::ErrorOccurred => 0xFF0000,
        WebhookEvent::MapAdded(_) => 0x00B0F4,
        WebhookEvent::MapDeleted(_) => 0xFAA61A,
        WebhookEvent::MapChanged(_) => 0x5865F2,
        WebhookEvent::KnifeKill { .. } => 0x9b59b6,
        WebhookEvent::Custom { .. } => 0xfb7f0c,
    };

    let mut embed = serde_json::json!({
        "title": event.title(),
        "description": event.description(),
        "color": color,
        "author": {
            "name": "Canalhas Manager",
            "icon_url": "https://i.imgur.com/fKL31aD.jpg"
        },
        "footer": {
            "text": "Canalhas Manager",
            "icon_url": "https://i.imgur.com/fKL31aD.jpg"
        },
        "timestamp": Utc::now().to_rfc3339()
    });

    if let Some(fields) = event.fields() {
        embed["fields"] = serde_json::Value::Array(fields);
    }

    let payload = serde_json::json!({
        "username": "Canalhas Manager",
        "embeds": [embed]
    });

    for webhook in matching_hooks {
        println!("🔗 Enviando para {}", webhook.url);

        let response = CLIENT.post(&webhook.url).json(&payload).send().await;

        match response {
            Ok(res) => {
                if res.status().is_success() {
                    println!("✅ Webhook enviado com sucesso.");
                } else {
                    println!("⚠️ Webhook falhou: status HTTP {}", res.status());
                }
            }
            Err(err) => {
                println!("❌ Erro ao enviar webhook: {}", err);
            }
        }
    }
}

fn read_webhooks() -> Vec<Webhook> {
    if !WEBHOOKS_PATH.exists() {
        return vec![];
    }

    let mut contents = String::new();
    if File::open(&*WEBHOOKS_PATH)
        .and_then(|mut f| f.read_to_string(&mut contents))
        .is_err()
    {
        return vec![];
    }

    serde_json::from_str(&contents).unwrap_or_else(|_| vec![])
}

fn write_webhooks(hooks: &[Webhook]) -> Result<(), String> {
    let json = serde_json::to_string_pretty(hooks).map_err(|e| e.to_string())?;

    if let Some(parent) = WEBHOOKS_PATH.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    File::create(&*WEBHOOKS_PATH)
        .and_then(|mut f| f.write_all(json.as_bytes()))
        .map_err(|e| e.to_string())
}
