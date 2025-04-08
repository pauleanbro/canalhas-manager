use chrono::Local;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, fs, path::PathBuf, sync::Mutex};

// 📁 Arquivos
static DAILY_SCORE_FILE: Lazy<PathBuf> = Lazy::new(|| {
    let mut path = dirs::config_dir().unwrap_or_default();
    path.push("canalhas-manager/knife_daily.json");
    path
});

static MONTHLY_SCORE_FILE: Lazy<PathBuf> = Lazy::new(|| {
    let mut path = dirs::config_dir().unwrap_or_default();
    path.push("canalhas-manager/knife_monthly.json");
    path
});

// 🔒 Dados na memória
static DAILY_SCORES: Lazy<Mutex<HashMap<String, PlayerScore>>> = Lazy::new(|| {
    let scores = load_scores(&DAILY_SCORE_FILE).unwrap_or_default();
    Mutex::new(scores)
});

static MONTHLY_SCORES: Lazy<Mutex<HashMap<String, PlayerScore>>> = Lazy::new(|| {
    let scores = load_scores(&MONTHLY_SCORE_FILE).unwrap_or_default();
    Mutex::new(scores)
});

// 📊 Estrutura de dados
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PlayerScore {
    pub name: String,
    pub kills: HashMap<String, u32>,
}

// 📤 Função comum para carregar
fn load_scores(file: &PathBuf) -> Result<HashMap<String, PlayerScore>, String> {
    if !file.exists() {
        return Ok(HashMap::new());
    }

    let content = fs::read_to_string(file).map_err(|e| e.to_string())?;
    let scores = serde_json::from_str(&content).unwrap_or_default();
    Ok(scores)
}

// 💾 Função comum para salvar
fn save_scores(file: &PathBuf, data: &HashMap<String, PlayerScore>) -> Result<(), String> {
    let json = serde_json::to_string_pretty(data).map_err(|e| e.to_string())?;
    if let Some(parent) = file.parent() {
        fs::create_dir_all(parent).ok();
    }
    fs::write(file, json).map_err(|e| e.to_string())
}

// 🔪 Registro de faca: atualiza diário e mensal
pub fn register_knife_kill(
    killer_id: String,
    killer_name: String,
    victim_id: String,
    victim_name: String,
) -> (u32, u32) {
    let (killer_score, victim_score) = update_score(
        &DAILY_SCORE_FILE,
        &DAILY_SCORES,
        &killer_id,
        &killer_name,
        &victim_id,
        &victim_name,
    );

    update_score(
        &MONTHLY_SCORE_FILE,
        &MONTHLY_SCORES,
        &killer_id,
        &killer_name,
        &victim_id,
        &victim_name,
    );

    (killer_score, victim_score)
}

fn update_score(
    file: &PathBuf,
    storage: &Mutex<HashMap<String, PlayerScore>>,
    killer_id: &str,
    killer_name: &str,
    victim_id: &str,
    victim_name: &str,
) -> (u32, u32) {
    let mut scores = storage.lock().unwrap();

    // Garante que ambos existam ANTES de fazer os acessos
    scores.entry(victim_id.to_string()).or_insert(PlayerScore {
        name: victim_name.to_string(),
        kills: HashMap::new(),
    });

    scores.entry(killer_id.to_string()).or_insert(PlayerScore {
        name: killer_name.to_string(),
        kills: HashMap::new(),
    });

    // Agora pode modificar
    if let Some(killer) = scores.get_mut(killer_id) {
        *killer.kills.entry(victim_id.to_string()).or_insert(0) += 1;
    }

    // Leitura final para retorno
    let killer_score = scores
        .get(killer_id)
        .and_then(|p| p.kills.get(victim_id))
        .copied()
        .unwrap_or(0);

    let victim_score = scores
        .get(victim_id)
        .and_then(|p| p.kills.get(killer_id))
        .copied()
        .unwrap_or(0);

    let _ = save_scores(file, &*scores);

    (killer_score, victim_score)
}

// 🕛 Reseta o placar diário (executar à meia-noite)
pub fn reset_daily_scores() -> Result<(), String> {
    let mut scores = DAILY_SCORES.lock().unwrap();
    *scores = HashMap::new();
    save_scores(&DAILY_SCORE_FILE, &*scores)
}

pub fn reset_monthly_scores() -> Result<(), String> {
    let mut scores = MONTHLY_SCORES.lock().unwrap();
    *scores = HashMap::new();
    save_scores(&MONTHLY_SCORE_FILE, &*scores)
}
