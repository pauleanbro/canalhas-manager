"use client";

import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Save, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminEntry {
  name?: string;
  auth: string;
  password: string;
  access: string;
  flags: string;
}

export default function AdminManager() {
  const [admins, setAdmins] = useState<AdminEntry[]>([]);
  const [editing, setEditing] = useState<Record<string, AdminEntry>>({});
  const [newAdmin, setNewAdmin] = useState<AdminEntry>({
    name: "",
    auth: "",
    password: "",
    access: "",
    flags: "",
  });
  const [search, setSearch] = useState("");
  const [filterFlag, setFilterFlag] = useState("");

  const loadAdmins = async () => {
    const data = await invoke<AdminEntry[]>("list_admins");
    setAdmins(data);
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const saveEdit = async (auth: string) => {
    const updated = editing[auth];
    await invoke("update_admin", { updated });
    setEditing((prev) => {
      const copy = { ...prev };
      delete copy[auth];
      return copy;
    });
    loadAdmins();
  };

  const deleteAdmin = async (auth: string) => {
    await invoke("remove_admin", { auth });
    loadAdmins();
  };

  const addAdmin = async () => {
    if (!newAdmin.auth || !newAdmin.access) return;
    await invoke("add_admin", { entry: newAdmin });
    setNewAdmin({ name: "", auth: "", password: "", access: "", flags: "" });
    loadAdmins();
  };

  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      admin.auth.toLowerCase().includes(search.toLowerCase()) ||
      admin.name?.toLowerCase().includes(search.toLowerCase());
    const matchesFlag = filterFlag ? admin.flags.includes(filterFlag) : true;
    return matchesSearch && matchesFlag;
  });

  const renderBadge = (access: string) => {
    if (access.includes("a")) return <Badge variant="secondary">Imune</Badge>;
    if (access.includes("d")) return <Badge variant="secondary">Ban</Badge>;
    if (access.includes("l")) return <Badge variant="secondary">RCON</Badge>;
    return <Badge variant="outline">User</Badge>;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Novo Admin</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="mb-2">Nome (opcional)</Label>
            <Input
              value={newAdmin.name || ""}
              onChange={(e) =>
                setNewAdmin({ ...newAdmin, name: e.target.value })
              }
            />
          </div>
          <div>
            <Label className="mb-2">SteamID ou VALVEID</Label>
            <Input
              value={newAdmin.auth}
              onChange={(e) =>
                setNewAdmin({ ...newAdmin, auth: e.target.value })
              }
            />
          </div>
          <div>
            <Label className="mb-2">Senha</Label>
            <Input
              value={newAdmin.password}
              onChange={(e) =>
                setNewAdmin({ ...newAdmin, password: e.target.value })
              }
            />
          </div>
          <div>
            <Label className="mb-2">Acesso (flags)</Label>
            <Input
              value={newAdmin.access}
              onChange={(e) =>
                setNewAdmin({ ...newAdmin, access: e.target.value })
              }
            />
          </div>
          <div>
            <Label className="mb-2">Tipo (flags)</Label>
            <Input
              value={newAdmin.flags}
              onChange={(e) =>
                setNewAdmin({ ...newAdmin, flags: e.target.value })
              }
            />
          </div>
          <div className="flex items-end">
            <Button onClick={addAdmin} className="w-full">
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Input
          placeholder="Buscar por nome ou SteamID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-md"
        />
        <Input
          placeholder="Filtrar por flag (ex: a, l, z...)"
          value={filterFlag}
          onChange={(e) => setFilterFlag(e.target.value)}
          className="w-full sm:max-w-xs"
        />
      </div>

      <div className="grid gap-4">
        {filteredAdmins.map((admin) => {
          const isEditing = !!editing[admin.auth];
          const entry = editing[admin.auth] || admin;
          const initials =
            admin.name?.trim().substring(0, 2).toUpperCase() || "N/A";

          return (
            <Card key={admin.auth} className="w-full">
              <CardHeader className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                <div className="flex items-center gap-4">
                  <div className="bg-muted w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold">
                    {initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">
                      {admin.name || "Sem nome"}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {admin.auth}
                    </div>
                    <div className="mt-1">{renderBadge(admin.access)}</div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        setEditing({ ...editing, [admin.auth]: admin })
                      }
                    >
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => deleteAdmin(admin.auth)}
                      className="text-red-500"
                    >
                      Remover
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              {isEditing && (
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2">Nome</Label>
                    <Input
                      value={entry.name || ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          [admin.auth]: { ...entry, name: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="mb-2">Senha</Label>
                    <Input
                      value={entry.password}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          [admin.auth]: { ...entry, password: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="mb-2">Acesso</Label>
                    <Input
                      value={entry.access}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          [admin.auth]: { ...entry, access: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="mb-2">Flags</Label>
                    <Input
                      value={entry.flags}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          [admin.auth]: { ...entry, flags: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button onClick={() => saveEdit(admin.auth)}>Salvar</Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
