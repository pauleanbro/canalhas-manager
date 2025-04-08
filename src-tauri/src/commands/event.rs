use chrono::Local;
use serde_json::json;

#[derive(Debug, Clone)]
pub enum WebhookEvent {
    ServerStarted,
    ServerStopped,
    ErrorOccurred,
    MapAdded(String),
    MapDeleted(String),
    MapChanged(String),
    KnifeKill {
        killer_id: String,
        killer_name: String,
        victim_id: String,
        victim_name: String,
        killer_score: u32,
        victim_score: u32,
    },
    Custom {
        title: String,
        message: String,
    },
}

impl WebhookEvent {
    pub fn name(&self) -> &'static str {
        match self {
            Self::ServerStarted => "server_started",
            Self::ServerStopped => "server_stopped",
            Self::ErrorOccurred => "error_occurred",
            Self::MapAdded(_) => "map_added",
            Self::MapDeleted(_) => "map_deleted",
            Self::MapChanged(_) => "map_changed",
            Self::KnifeKill { .. } => "knife_kill",
            Self::Custom { .. } => "custom_event",
        }
    }

    pub fn title(&self) -> String {
        match self {
            Self::ServerStarted => "Servidor Iniciado".into(),
            Self::ServerStopped => "Servidor Parado".into(),
            Self::ErrorOccurred => "Erro no Servidor".into(),
            Self::MapAdded(name) => format!("Mapa Adicionado: {}", name),
            Self::MapDeleted(name) => format!("Mapa Removido: {}", name),
            Self::MapChanged(name) => format!("Mapa Alterado: {}", name),
            Self::KnifeKill {
                killer_name,
                victim_name,
                ..
            } => format!("🔪 Morte Vergonhosa: {} x {}", killer_name, victim_name),
            Self::Custom { title, .. } => title.clone(),
        }
    }

    pub fn description(&self) -> String {
        let timestamp = Local::now().format("%d/%m/%Y %H:%M:%S");
        match self {
            Self::ServerStarted => "Servidor iniciado com sucesso.".into(),
            Self::ServerStopped => "Servidor desligado com sucesso.".into(),
            Self::ErrorOccurred => "Um erro crítico ocorreu no servidor.".into(),
            Self::MapAdded(name) => format!("O mapa `{}` foi adicionado com sucesso.", name),
            Self::MapDeleted(name) => format!("O mapa `{}` foi removido do servidor.", name),
            Self::MapChanged(name) => format!("O mapa atual foi alterado para `{}`.", name),
            Self::KnifeKill {
                killer_name,
                victim_name,
                ..
            } => format!(
                "**{}** matou **{}** usando uma faca!",
                killer_name, victim_name
            ),
            Self::Custom { message, .. } => message.clone(),
        }
    }

    pub fn fields(&self) -> Option<Vec<serde_json::Value>> {
        match self {
            Self::KnifeKill {
                killer_name,
                victim_name,
                killer_score,
                victim_score,
                ..
            } => Some(vec![json!({
                "name": "⚔️ Placar do duelo",
                "value": format!(
                    "**{}** ({}) x ({}) **{}**",
                    killer_name, killer_score, victim_score, victim_name
                ),
                "inline": false
            })]),
            _ => None,
        }
    }
}
