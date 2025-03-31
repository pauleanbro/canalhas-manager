import { Settings, Map, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { invoke } from "@tauri-apps/api/core";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [port, setPort] = useState("27015");
  const [defaultMap, setDefaultMap] = useState("de_dust2");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    invoke("get_server_config")
      .then((data: any) => {
        setPort(data.port);
        setDefaultMap(data.map);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await invoke("save_server_config", {
        config: { port, map: defaultMap },
      });
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full p-8">
      <div className="flex items-center gap-2 text-muted-foreground mb-8">
        <Settings className="w-5 h-5" />
        <h2 className="text-lg font-semibold">
          Configurações de Inicialização
        </h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-6 max-w-md"
      >
        <div className="space-y-1">
          <Label htmlFor="port" className="flex items-center gap-2">
            <Server className="w-4 h-4" /> Porta
          </Label>
          <Input
            id="port"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            placeholder="27015"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="map" className="flex items-center gap-2">
            <Map className="w-4 h-4" /> Mapa Padrão
          </Label>
          <Input
            id="map"
            value={defaultMap}
            onChange={(e) => setDefaultMap(e.target.value)}
            placeholder="de_dust2"
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </form>
    </div>
  );
}
