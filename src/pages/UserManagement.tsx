import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, UserPlus } from "lucide-react";
import type { AppRole } from "@/hooks/useRole";

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  role: AppRole;
  region: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  created_at: string;
}

interface CreateUserForm {
  email: string;
  password: string;
  username: string;
  full_name: string;
  role: AppRole;
  region: string;
  contact_phone: string;
  contact_email: string;
}

export default function UserManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  const [createForm, setCreateForm] = useState<CreateUserForm>({
    email: '',
    password: '',
    username: '',
    full_name: '',
    role: 'extensionista',
    region: '',
    contact_phone: '',
    contact_email: '',
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Type assertion since the database has new columns but types haven't been regenerated
      setProfiles((data || []).map((profile: any) => ({
        id: profile.id,
        user_id: profile.user_id,
        username: profile.username,
        full_name: profile.full_name,
        role: profile.role as AppRole,
        region: profile.region || null,
        contact_phone: profile.contact_phone || null,
        contact_email: profile.contact_email || null,
        created_at: profile.created_at,
      })) as Profile[]);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar utilizadores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!createForm.email || !createForm.password || !createForm.full_name) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setCreateLoading(true);
    try {
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: createForm.email,
        password: createForm.password,
        options: {
          data: {
            username: createForm.username,
            full_name: createForm.full_name,
            role: createForm.role,
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update the profile with additional data
        const updateData: any = {
          region: createForm.region || null,
          contact_phone: createForm.contact_phone || null,
          contact_email: createForm.contact_email || null,
        };
        
        const { error: profileError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('user_id', authData.user.id);

        if (profileError) throw profileError;

        toast({
          title: "Sucesso",
          description: "Utilizador criado com sucesso",
        });

        setShowCreateDialog(false);
        setCreateForm({
          email: '',
          password: '',
          username: '',
          full_name: '',
          role: 'extensionista',
          region: '',
          contact_phone: '',
          contact_email: '',
        });
        
        fetchProfiles();
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar utilizador",
        variant: "destructive",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'backoffice':
        return 'secondary';
      case 'extensionista':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'backoffice':
        return 'Backoffice';
      case 'extensionista':
        return 'Extensionista';
      default:
        return role;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1">
          <header className="border-b">
            <div className="flex h-16 items-center justify-between px-4">
              <div className="flex items-center">
                <SidebarTrigger />
                <div className="ml-4">
                  <h1 className="text-xl font-semibold">Gestão de Utilizadores</h1>
                  <p className="text-sm text-muted-foreground">
                    Criar e gerir utilizadores do sistema
                  </p>
                </div>
              </div>
              
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Utilizador
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Utilizador</DialogTitle>
                    <DialogDescription>
                      Preencha os dados para criar um novo utilizador no sistema.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="password" className="text-right">
                        Password *
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="full_name" className="text-right">
                        Nome Completo *
                      </Label>
                      <Input
                        id="full_name"
                        value={createForm.full_name}
                        onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="username" className="text-right">
                        Username
                      </Label>
                      <Input
                        id="username"
                        value={createForm.username}
                        onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role" className="text-right">
                        Função *
                      </Label>
                      <Select
                        value={createForm.role}
                        onValueChange={(value: AppRole) => setCreateForm({ ...createForm, role: value })}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="extensionista">Extensionista</SelectItem>
                          <SelectItem value="backoffice">Backoffice</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="region" className="text-right">
                        Região
                      </Label>
                      <Input
                        id="region"
                        value={createForm.region}
                        onChange={(e) => setCreateForm({ ...createForm, region: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="contact_phone" className="text-right">
                        Telefone
                      </Label>
                      <Input
                        id="contact_phone"
                        value={createForm.contact_phone}
                        onChange={(e) => setCreateForm({ ...createForm, contact_phone: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="contact_email" className="text-right">
                        Email Contacto
                      </Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={createForm.contact_email}
                        onChange={(e) => setCreateForm({ ...createForm, contact_email: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={createUser} disabled={createLoading}>
                      {createLoading ? "Criando..." : "Criar Utilizador"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          <main className="flex-1 space-y-4 p-8 pt-6">
            <Card>
              <CardHeader>
                <CardTitle>Utilizadores do Sistema</CardTitle>
                <CardDescription>
                  Lista de todos os utilizadores registados no sistema IAOM
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome Completo</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead>Região</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Data de Criação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profiles.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">
                            {profile.full_name || profile.username || 'N/A'}
                          </TableCell>
                          <TableCell>{profile.contact_email || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(profile.role)}>
                              {getRoleLabel(profile.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>{profile.region || 'N/A'}</TableCell>
                          <TableCell>{profile.contact_phone || 'N/A'}</TableCell>
                          <TableCell>
                            {new Date(profile.created_at).toLocaleDateString('pt-PT')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}