use chrono::Local;

#[derive(Debug, Clone)]
pub enum WebhookEvent {
    ServerStarted,
    ServerStopped,
    ErrorOccurred,
    MapAdded(String),
    MapDeleted(String),
    MapChanged(String),
    Custom { title: String, message: String },
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
            Self::Custom { title, .. } => title.clone(),
        }
    }

    pub fn description(&self) -> String {
        let timestamp = Local::now().format("%d/%m/%Y %H:%M:%S");
        match self {
            Self::ServerStarted => format!("Servidor iniciado com sucesso\n🕒 {}", timestamp),
            Self::ServerStopped => format!("Servidor desligado com sucesso\n🕒 {}", timestamp),
            Self::ErrorOccurred => format!("Um erro crítico ocorreu no servidor\n🕒 {}", timestamp),
            Self::MapAdded(_) | Self::MapDeleted(_) | Self::MapChanged(_) | Self::Custom { .. } => {
                format!("🕒 {}", timestamp)
            }
        }
    }
}
