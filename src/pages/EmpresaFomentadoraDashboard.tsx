import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CheckCircle, XCircle, Clock, Users, DollarSign, BarChart3, Eye } from "lucide-react";

interface LoanRequest {
  id: string;
  producer_id: string;
  extensionista_id: string;
  loan_type: 'money' | 'item';
  amount: number | null;
  item_description: string | null;
  description: string | null;
  justification: string;
  community_consent: boolean;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  review_comments: string | null;
  producer: {
    nome_completo: string;
    nuit: string;
    idade: number;
    genero: string;
  };
  extensionista: {
    full_name: string;
    region: string | null;
  };
}

interface RegionalCapacity {
  region: string;
  total_area_m2: number;
  total_producers: number;
  total_parcelas: number;
  average_loan_amount: number;
  success_rate: number;
}

interface DashboardStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export default function EmpresaFomentadoraDashboard() {
  const { hasLoanReviewAccess, role } = useRole();
  const { toast } = useToast();
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LoanRequest[]>([]);
  const [regionalCapacity, setRegionalCapacity] = useState<RegionalCapacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LoanRequest | null>(null);
  const [reviewComments, setReviewComments] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [stats, setStats] = useState<DashboardStats>({ pending: 0, approved: 0, rejected: 0, total: 0 });

  useEffect(() => {
    if (hasLoanReviewAccess) {
      fetchLoanRequests();
      fetchRegionalCapacity();
    }
  }, [hasLoanReviewAccess]);

  useEffect(() => {
    filterRequests();
  }, [loanRequests, statusFilter, regionFilter]);

  const fetchLoanRequests = async () => {
    try {
      console.log('Fetching loan requests...');
      console.log('Current user role:', role);
      console.log('Has loan review access:', hasLoanReviewAccess);
      
      const { data, error } = await supabase
        .from('loan_requests')
        .select(`
          *,
          producer:producers(nome_completo, nuit, idade, genero),
          extensionista:profiles!loan_requests_extensionista_id_fkey(full_name, region)
        `)
        .order('created_at', { ascending: false });

      console.log('Supabase response:', { data, error });

      if (error) throw error;

      console.log('Fetched loan requests:', data?.length || 0);
      setLoanRequests((data as any) || []);
      calculateStats((data as any) || []);
    } catch (error) {
      console.error('Error fetching loan requests:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pedidos de empréstimo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRegionalCapacity = async () => {
    try {
      const { data, error } = await supabase
        .from('regional_capacity')
        .select('*')
        .order('total_area_m2', { ascending: false });

      if (error) throw error;
      setRegionalCapacity(data || []);
    } catch (error) {
      console.error('Error fetching regional capacity:', error);
    }
  };

  const calculateStats = (requests: LoanRequest[]) => {
    const stats = requests.reduce((acc, req) => {
      acc.total++;
      acc[req.status]++;
      return acc;
    }, { pending: 0, approved: 0, rejected: 0, total: 0 });
    setStats(stats);
  };

  const filterRequests = () => {
    let filtered = loanRequests;

    if (statusFilter !== "all") {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    if (regionFilter !== "all") {
      filtered = filtered.filter(req => req.extensionista.region === regionFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleReviewRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('loan_requests')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.from('profiles').select('id').eq('user_id', (await supabase.auth.getUser()).data.user?.id).single()).data?.id,
          review_comments: reviewComments || null
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: status === 'approved' ? "Pedido Aprovado" : "Pedido Rejeitado",
        description: `O pedido foi ${status === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso.`,
      });

      setSelectedRequest(null);
      setReviewComments("");
      fetchLoanRequests();
    } catch (error) {
      console.error('Error reviewing request:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar a revisão do pedido",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(amount);
  };

  const formatArea = (area: number) => {
    if (area >= 10000) {
      return `${(area / 10000).toFixed(1)} hectares`;
    }
    return `${area.toLocaleString()} m²`;
  };

  const uniqueRegions = Array.from(new Set(loanRequests.map(req => req.extensionista.region).filter(Boolean)));

  if (!hasLoanReviewAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Você não tem permissão para acessar esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1">
          <header className="border-b">
            <div className="flex h-16 items-center px-4">
              <SidebarTrigger />
              <div className="ml-4">
                <h1 className="text-2xl font-bold">Dashboard - Empresa Fomentadora</h1>
              </div>
            </div>
          </header>
          
          <main className="p-6 space-y-6">
            <div>
              <p className="text-muted-foreground">Gerencie pedidos de empréstimo e analise capacidade regional</p>
            </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Pedidos de Empréstimo</TabsTrigger>
          <TabsTrigger value="capacity">Capacidade Regional</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="rejected">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label htmlFor="region-filter">Região</Label>
                  <Select value={regionFilter} onValueChange={setRegionFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por região" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {uniqueRegions.map(region => (
                        <SelectItem key={region} value={region || ""}>{region || "Sem região"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loan Requests List */}
          <div className="grid gap-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{request.producer.nome_completo}</CardTitle>
                      <CardDescription>
                        Extensionista: {request.extensionista.full_name} • 
                        Região: {request.extensionista.region || "Não especificada"}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(request.status)}
                        {request.status === 'pending' ? 'Pendente' : 
                         request.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo</p>
                      <p className="font-medium">{request.loan_type === 'money' ? 'Dinheiro' : 'Item'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valor/Item</p>
                      <p className="font-medium">
                        {request.loan_type === 'money' 
                          ? formatCurrency(request.amount)
                          : request.item_description || 'N/A'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data do Pedido</p>
                      <p className="font-medium">{new Date(request.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">NUIT</p>
                      <p className="font-medium">{request.producer.nuit}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Justificativa</p>
                      <p className="text-sm">{request.justification}</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          onClick={() => setSelectedRequest(request)}
                          className="ml-4"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detalhes do Pedido de Empréstimo</DialogTitle>
                          <DialogDescription>
                            Revise os detalhes e tome uma decisão sobre o pedido
                          </DialogDescription>
                        </DialogHeader>
                        {selectedRequest && (
                          <div className="space-y-6">
                            {/* Producer Details */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2">Informações do Produtor</h4>
                                <div className="space-y-2 text-sm">
                                  <p><strong>Nome:</strong> {selectedRequest.producer.nome_completo}</p>
                                  <p><strong>NUIT:</strong> {selectedRequest.producer.nuit}</p>
                                  <p><strong>Idade:</strong> {selectedRequest.producer.idade} anos</p>
                                  <p><strong>Gênero:</strong> {selectedRequest.producer.genero}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Informações do Empréstimo</h4>
                                <div className="space-y-2 text-sm">
                                  <p><strong>Tipo:</strong> {selectedRequest.loan_type === 'money' ? 'Dinheiro' : 'Item'}</p>
                                  <p><strong>Valor:</strong> {
                                    selectedRequest.loan_type === 'money' 
                                      ? formatCurrency(selectedRequest.amount)
                                      : selectedRequest.item_description
                                  }</p>
                                  <p><strong>Consenso Comunitário:</strong> {selectedRequest.community_consent ? 'Sim' : 'Não'}</p>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2">Justificativa</h4>
                              <p className="text-sm bg-muted p-3 rounded">{selectedRequest.justification}</p>
                            </div>

                            {selectedRequest.description && (
                              <div>
                                <h4 className="font-semibold mb-2">Descrição Adicional</h4>
                                <p className="text-sm bg-muted p-3 rounded">{selectedRequest.description}</p>
                              </div>
                            )}

                            {selectedRequest.status === 'pending' && (
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="review-comments">Comentários da Revisão</Label>
                                  <Textarea
                                    id="review-comments"
                                    value={reviewComments}
                                    onChange={(e) => setReviewComments(e.target.value)}
                                    placeholder="Adicione comentários sobre sua decisão (opcional)"
                                    rows={3}
                                  />
                                </div>
                                <div className="flex gap-3">
                                  <Button
                                    onClick={() => handleReviewRequest(selectedRequest.id, 'approved')}
                                    className="flex-1"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Aprovar
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleReviewRequest(selectedRequest.id, 'rejected')}
                                    className="flex-1"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Rejeitar
                                  </Button>
                                </div>
                              </div>
                            )}

                            {selectedRequest.status !== 'pending' && (
                              <div className="bg-muted p-4 rounded">
                                <h4 className="font-semibold mb-2">Status da Revisão</h4>
                                <p className="text-sm">
                                  <strong>Status:</strong> {selectedRequest.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                                </p>
                                {selectedRequest.reviewed_at && (
                                  <p className="text-sm">
                                    <strong>Data da Revisão:</strong> {new Date(selectedRequest.reviewed_at).toLocaleString('pt-BR')}
                                  </p>
                                )}
                                {selectedRequest.review_comments && (
                                  <p className="text-sm mt-2">
                                    <strong>Comentários:</strong> {selectedRequest.review_comments}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRequests.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Nenhum pedido encontrado com os filtros aplicados.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="capacity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Capacidade Regional</CardTitle>
              <CardDescription>
                Análise da capacidade produtiva por região
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {regionalCapacity.map((region) => (
                  <Card key={region.region} className="border-l-4 border-l-primary">
                    <CardHeader>
                      <CardTitle className="text-lg">{region.region}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Produtores</p>
                          </div>
                          <p className="text-xl font-bold">{region.total_producers}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Parcelas</p>
                          </div>
                          <p className="text-xl font-bold">{region.total_parcelas}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Área Total</p>
                          </div>
                          <p className="text-xl font-bold">{formatArea(region.total_area_m2)}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                          </div>
                          <p className="text-xl font-bold">{region.success_rate}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {regionalCapacity.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">Nenhum dado de capacidade regional disponível.</p>
                </div>
              )}
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