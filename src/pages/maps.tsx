import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Star, StarOff, Trash2, Play } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { invoke } from "@tauri-apps/api/core";
import { Input } from "@/components/ui/input";

interface MapEntry {
  name: string;
  isFavorite: boolean;
}

export default function MapManager() {
  const [maps, setMaps] = useState<MapEntry[]>([]);
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const mapsPerPage = 12;

  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem("favoriteMaps") || "[]");
    setFavorites(favs);
  }, []);

  useEffect(() => {
    invoke<string[]>("list_maps").then((data) => {
      const loadedMaps = data.map((name) => ({
        name,
        isFavorite: favorites.includes(name),
      }));
      setMaps(loadedMaps);
    });
  }, [favorites]);

  const filteredMaps = useMemo(() => {
    return maps
      .filter((map) => map.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite));
  }, [maps, search]);

  const totalPages = Math.ceil(filteredMaps.length / mapsPerPage);
  const paginatedMaps = filteredMaps.slice(
    (currentPage - 1) * mapsPerPage,
    currentPage * mapsPerPage
  );

  const toggleFavorite = (name: string) => {
    const updated = favorites.includes(name)
      ? favorites.filter((m) => m !== name)
      : [...favorites, name];
    setFavorites(updated);
    localStorage.setItem("favoriteMaps", JSON.stringify(updated));
  };

  const deleteMap = async () => {
    if (!selectedMap) return;
    await invoke("delete_map_files", { mapName: selectedMap });
    setMaps((prev) => prev.filter((m) => m.name !== selectedMap));
    setSelectedMap(null);
  };

  const openMap = (name: string) => {
    invoke("send_command_to_hlds", { command: `changelevel ${name}` });
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4 h-full overflow-hidden flex flex-col">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">Gerenciador de Mapas</h1>
          <Input
            placeholder="Buscar mapas..."
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
            className="w-64"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {paginatedMaps.map((map) => (
            <Card
              key={map.name}
              className="group transition-all flex flex-col h-full justify-between"
            >
              <CardContent className="p-3">
                <p className="font-medium text-sm text-muted-foreground truncate max-w-full">
                  {map.name}
                </p>
              </CardContent>
              <CardFooter className="flex justify-center items-center gap-2 mt-auto border-t">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleFavorite(map.name)}
                >
                  {map.isFavorite ? (
                    <Star className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openMap(map.name)}
                >
                  <Play className="h-4 w-4 text-green-500" />
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedMap(map.name)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <p className="text-sm">
                        Tem certeza que deseja deletar o mapa
                        <strong> {map.name}</strong>?
                      </p>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="secondary"
                        onClick={() => setSelectedMap(null)}
                      >
                        Cancelar
                      </Button>
                      <Button variant="destructive" onClick={deleteMap}>
                        Deletar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="flex justify-between items-center pt-2">
          <p className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </p>
          <div className="space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
