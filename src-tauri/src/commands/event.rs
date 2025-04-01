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
        match self {
            Self::ServerStarted => "Servidor iniciado com sucesso.".into(),
            Self::ServerStopped => "Servidor desligado com sucesso.".into(),
            Self::ErrorOccurred => "Um erro crítico ocorreu no servidor.".into(),
            Self::MapAdded(name) => format!("O mapa `{}` foi adicionado com sucesso.", name),
            Self::MapDeleted(name) => format!("O mapa `{}` foi removido do servidor.", name),
            Self::MapChanged(name) => format!("O mapa atual foi alterado para `{}`.", name),
            Self::Custom { message, .. } => message.clone(),
        }
    }
}
