// src/hooks/use-hlds-path.ts
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

export async function selectFolderAndSave() {
  const selected = await open({
    directory: true,
    multiple: false,
    title: "Selecione a pasta do HLDS",
  });

  if (typeof selected === "string") {
    const path = selected;
    const isValid = path.includes("hlds") || path.includes("valve"); // opcional, heurística simples

    if (!isValid) {
      alert("A pasta selecionada parece não ser uma pasta válida do HLDS.");
      return;
    }

    await invoke("save_hlds_path", { path });
    return path;
  }

  return null;
}
