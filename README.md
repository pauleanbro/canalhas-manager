# Canalhas Manager 💀🧠

> A modern and cross-platform control panel for HLDS/ReHLDS servers.

Canalhas Manager is a graphical control panel focused on **home dedicated Counter-Strike 1.6 servers**, with full support for the **CS Revo Linux base** (tested base). Developed with Tauri, React, and Rust, the project offers an intuitive interface and practical tools for those who want to manage their server easily.

![screenshot](https://i.imgur.com/rJ8QAzt.png)

---

### 🚀 Features

- ✅ Start/stop HLDS server with a single click
- 🔍 Real-time log monitoring (HLDS console output)
- 📅 Map management: list, delete, add
- 📡 Webhook support for events like:
  - `server_started`
  - `server_stopped`
  - `map_added`
  - `map_deleted`
  - `error_occurred`
- 🔧 Responsive interface with **React**, **TailwindCSS**, and **Tauri**
- 🌍 Native build for **Windows**, **Linux**, and (soon) macOS

---

### 🚀 Installation (Developers)

> Requirements: [Rust](https://www.rust-lang.org/), [Node.js](https://nodejs.org/), [Tauri CLI](https://tauri.app/)

```bash
git clone https://github.com/seu-usuario/canalhas-manager.git
cd canalhas-manager
pnpm install  # or npm / yarn
tauri dev
```

To generate the build:

```bash
tauri build
```

---

### 🌐 Webhooks

Configure webhooks to be notified in real-time via Discord, Slack, etc.

**Example Discord payload:**

```json
{
  "username": "Canalhas Manager",
  "embeds": [
    {
      "title": "Servidor Iniciado!",
      "description": "Servidor iniciado com sucesso\n🕒 31/03/2025 02:22:04",
      "color": 16426444
    }
  ]
}
```

---

### 🎓 Community and Contribution

This project was created to help the HLDS server community.

Contributions are very welcome! Feel free to open an **issue**, send a **pull request**, or suggest ideas.

---

### 🔒 License

[MIT](./LICENSE)

---

**Made with ❤️ by Canalhas.**
