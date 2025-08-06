import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Users, UserCheck, MapPin, BarChart3, FileText, Eye, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface DashboardStats {
  totalExtensionistas: number;
  totalProducers: number;
  totalParcelas: number;
  recentActivity: number;
}

interface ExportApplication {
  id: string;
  application_type: string;
  destination_country: string;
  status: string;
  submitted_at: string;
  exporter_id: string;
  representative_name?: string;
  phone?: string;
  nuit_holder?: string;
  license_number?: string;
  products: string[];
  crops?: string[];
  districts?: string[];
  commercialization_provinces?: string[];
  quantity_kg?: number;
  estimated_value?: number;
  category?: string;
  exporters?: {
    company_name: string;
    contact_email: string;
  };
}

export default function BackofficeDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalExtensionistas: 0,
    totalProducers: 0,
    totalParcelas: 0,
    recentActivity: 0,
  });
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ExportApplication[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const { toast } = useToast();

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('export_applications')
        .select(`
          *,
          exporters!inner(company_name, contact_email)
        `)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pedidos de exportação",
        variant: "destructive",
      });
    } finally {
      setLoadingApplications(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: 'approved' | 'rejected', comments?: string) => {
    try {
      const { error } = await supabase
        .from('export_applications')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          review_comments: comments,
        })
        .eq('id', applicationId);

      if (error) throw error;

      // If approved, generate certificate
      if (status === 'approved') {
        try {
          const { data, error: certError } = await supabase.functions.invoke('generate-export-certificate', {
            body: { applicationId }
          });

          if (certError) {
            console.error('Error generating certificate:', certError);
            toast({
              title: "Aviso",
              description: "Pedido aprovado, mas erro ao gerar certificado",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sucesso",
              description: `Pedido aprovado e certificado ${data.certificateNumber} gerado com sucesso!`,
            });
          }
        } catch (certError) {
          console.error('Error calling certificate function:', certError);
          toast({
            title: "Aviso",
            description: "Pedido aprovado, mas erro ao gerar certificado",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Sucesso",
          description: "Pedido rejeitado com sucesso",
        });
      }

      fetchApplications();
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do pedido",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch extensionistas count
        const { count: extensionistasCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'extensionista');

        // Fetch producers count
        const { count: producersCount } = await supabase
          .from('producers')
          .select('*', { count: 'exact', head: true });

        // Fetch parcelas count
        const { count: parcelasCount } = await supabase
          .from('parcelas')
          .select('*', { count: 'exact', head: true });

        // Fetch recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { count: recentCount } = await supabase
          .from('producers')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo.toISOString());

        setStats({
          totalExtensionistas: extensionistasCount || 0,
          totalProducers: producersCount || 0,
          totalParcelas: parcelasCount || 0,
          recentActivity: recentCount || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    fetchApplications();
  }, []);

  const StatCard = ({ title, value, icon: Icon, description }: {
    title: string;
    value: number;
    icon: any;
    description: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? "..." : value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1">
          <header className="border-b">
            <div className="flex h-16 items-center px-4">
              <SidebarTrigger />
              <div className="ml-4">
                <h1 className="text-xl font-semibold">Backoffice Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Gestão e supervisão do sistema IAOM
                </p>
              </div>
            </div>
          </header>

          <main className="flex-1 space-y-4 p-8 pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Extensionistas"
                value={stats.totalExtensionistas}
                icon={UserCheck}
                description="Total de extensionistas registados"
              />
              <StatCard
                title="Produtores"
                value={stats.totalProducers}
                icon={Users}
                description="Total de produtores cadastrados"
              />
              <StatCard
                title="Parcelas"
                value={stats.totalParcelas}
                icon={MapPin}
                description="Total de parcelas demarcadas"
              />
              <StatCard
                title="Atividade Recente"
                value={stats.recentActivity}
                icon={BarChart3}
                description="Novos registos (últimos 7 dias)"
              />
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="export-requests">Pedidos de Exportação</TabsTrigger>
                <TabsTrigger value="extensionistas">Extensionistas</TabsTrigger>
                <TabsTrigger value="producers">Produtores</TabsTrigger>
                <TabsTrigger value="parcelas">Parcelas</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo do Sistema</CardTitle>
                    <CardDescription>
                      Estatísticas gerais do sistema IAOM
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-2">
                      <p>• {stats.totalExtensionistas} extensionistas ativos no sistema</p>
                      <p>• {stats.totalProducers} produtores cadastrados</p>
                      <p>• {stats.totalParcelas} parcelas demarcadas</p>
                      <p>• {stats.recentActivity} novos registos esta semana</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="export-requests" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Pedidos de Certificado de Exportação</CardTitle>
                    <CardDescription>
                      Aprovação de pedidos de certificado de exportação
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingApplications ? (
                      <p className="text-sm text-muted-foreground">Carregando pedidos...</p>
                    ) : applications.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum pedido encontrado.</p>
                    ) : (
                      <div className="space-y-4">
                        {applications.map((app) => (
                          <Card key={app.id} className="border-l-4 border-l-primary/20">
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    <span className="font-medium">
                                      {app.exporters?.company_name || 'Empresa não especificada'}
                                    </span>
                                    <Badge variant={
                                      app.status === 'approved' ? 'default' :
                                      app.status === 'rejected' ? 'destructive' : 'secondary'
                                    }>
                                      {app.status === 'pending' ? 'Pendente' :
                                       app.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    <p><strong>Tipo:</strong> {app.application_type}</p>
                                    <p><strong>País de destino:</strong> {app.destination_country}</p>
                                    <p><strong>Produtos:</strong> {app.products?.join(', ')}</p>
                                    {app.quantity_kg && <p><strong>Quantidade:</strong> {app.quantity_kg} kg</p>}
                                    {app.estimated_value && <p><strong>Valor estimado:</strong> ${app.estimated_value}</p>}
                                    <p><strong>Submetido em:</strong> {format(new Date(app.submitted_at), 'dd/MM/yyyy HH:mm')}</p>
                                    {app.representative_name && <p><strong>Representante:</strong> {app.representative_name}</p>}
                                    {app.phone && <p><strong>Telefone:</strong> {app.phone}</p>}
                                  </div>
                                </div>
                                {app.status === 'pending' && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => updateApplicationStatus(app.id, 'approved')}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Aprovar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => updateApplicationStatus(app.id, 'rejected')}
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Rejeitar
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="extensionistas">
                <Card>
                  <CardHeader>
                    <CardTitle>Gestão de Extensionistas</CardTitle>
                    <CardDescription>
                      Lista e gestão dos extensionistas registados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Funcionalidade em desenvolvimento...
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="producers">
                <Card>
                  <CardHeader>
                    <CardTitle>Gestão de Produtores</CardTitle>
                    <CardDescription>
                      Lista e gestão dos produtores cadastrados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Funcionalidade em desenvolvimento...
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="parcelas">
                <Card>
                  <CardHeader>
                    <CardTitle>Gestão de Parcelas</CardTitle>
                    <CardDescription>
                      Lista e gestão das parcelas demarcadas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Funcionalidade em desenvolvimento...
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}