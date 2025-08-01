import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Users, UserCheck, MapPin, BarChart3 } from "lucide-react";

interface DashboardStats {
  totalExtensionistas: number;
  totalProducers: number;
  totalParcelas: number;
  recentActivity: number;
}

export default function BackofficeDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalExtensionistas: 0,
    totalProducers: 0,
    totalParcelas: 0,
    recentActivity: 0,
  });
  const [loading, setLoading] = useState(true);

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