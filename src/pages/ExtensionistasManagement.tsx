import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Users, MapPin, BarChart3, Search, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ExtensionistStats {
  totalExtensionistas: number;
  totalProducers: number;
  totalParcelas: number;
  totalArea: number;
}

interface ExtensionistData {
  id: string;
  full_name: string | null;
  username: string | null;
  created_at: string;
  producers_count: number;
  parcelas_count: number;
  total_area: number;
  last_activity: string;
}

export default function ExtensionistasManagement() {
  const [stats, setStats] = useState<ExtensionistStats>({
    totalExtensionistas: 0,
    totalProducers: 0,
    totalParcelas: 0,
    totalArea: 0,
  });
  const [extensionistas, setExtensionistas] = useState<ExtensionistData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Use the database function to get extensionistas with statistics
      const { data: extensionistasData, error } = await (supabase as any).rpc('get_extensionistas_with_stats');
      
      if (error) {
        console.error('Error fetching extensionistas data:', error);
        setExtensionistas([]);
        setStats({ totalExtensionistas: 0, totalProducers: 0, totalParcelas: 0, totalArea: 0 });
        return;
      }

      // Transform the data to match our interface
      const extensionistasWithMetrics: ExtensionistData[] = (extensionistasData || []).map((ext: any) => ({
        id: ext.id,
        full_name: ext.full_name,
        username: ext.username,
        created_at: ext.created_at,
        producers_count: Number(ext.producers_count),
        parcelas_count: Number(ext.parcelas_count),
        total_area: Math.round(Number(ext.total_area_m2) / 10000 * 100) / 100, // Convert to hectares
        last_activity: ext.updated_at || ext.created_at,
      }));

      // Calculate totals
      const totalProducers = extensionistasWithMetrics.reduce((sum, ext) => sum + ext.producers_count, 0);
      const totalParcelas = extensionistasWithMetrics.reduce((sum, ext) => sum + ext.parcelas_count, 0);
      const totalArea = extensionistasWithMetrics.reduce((sum, ext) => sum + ext.total_area, 0);

      setExtensionistas(extensionistasWithMetrics);
      setStats({
        totalExtensionistas: extensionistasWithMetrics.length,
        totalProducers,
        totalParcelas,
        totalArea: Math.round(totalArea * 100) / 100,
      });
      
      console.log('Fetched extensionistas with complete metrics:', extensionistasWithMetrics.length);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExtensionistas = extensionistas.filter(ext => {
    const matchesSearch = ext.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ext.username?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT');
  };

  const getActivityStatus = (lastActivity: string) => {
    const daysSince = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSince <= 7) return { label: "Ativo", variant: "default" as const };
    if (daysSince <= 30) return { label: "Moderado", variant: "secondary" as const };
    return { label: "Inativo", variant: "destructive" as const };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Extensionistas</h1>
            <p className="text-gray-600 mt-2">
              Acompanhe o desempenho e atividade dos extensionistas
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Extensionistas</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalExtensionistas}</div>
                <p className="text-xs text-muted-foreground">Extensionistas ativos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produtores Registados</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducers}</div>
                <p className="text-xs text-muted-foreground">Total no sistema</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Parcelas Mapeadas</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalParcelas}</div>
                <p className="text-xs text-muted-foreground">Áreas demarcadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Área Total</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalArea}</div>
                <p className="text-xs text-muted-foreground">Hectares mapeados</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Filtros e Pesquisa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Pesquisar por nome ou username..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extensionistas Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Extensionistas</CardTitle>
              <CardDescription>
                {filteredExtensionistas.length} extensionista(s) encontrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead className="text-center">Produtores</TableHead>
                    <TableHead className="text-center">Parcelas</TableHead>
                    <TableHead className="text-center">Área Total (ha)</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Última Atividade</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExtensionistas.map((extensionista) => {
                    const activityStatus = getActivityStatus(extensionista.last_activity);
                    
                    return (
                      <TableRow key={extensionista.id}>
                        <TableCell className="font-medium">
                          {extensionista.full_name || "Nome não definido"}
                        </TableCell>
                        <TableCell>
                          {extensionista.username || "N/A"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{extensionista.producers_count}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{extensionista.parcelas_count}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{extensionista.total_area}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={activityStatus.variant}>
                            {activityStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm text-gray-600">
                          {formatDate(extensionista.last_activity)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/extensionista/${extensionista.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {filteredExtensionistas.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum extensionista encontrado com os critérios selecionados.
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
}