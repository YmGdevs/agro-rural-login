import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/useRole";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, QrCode, Search, ScanLine, Camera } from "lucide-react";
import QRCode from "qrcode";
import { useQRScanner } from "@/hooks/useQRScanner";

interface VoucherWithDetails {
  id: string;
  voucher_code: string;
  created_at: string;
  redeemed_at: string | null;
  redeemed_by: string | null;
  loan_request: {
    id: string;
    amount: number;
    loan_type: string;
    producer: {
      nome_completo: string;
      nuit: string;
    };
    extensionista: {
      full_name: string;
    };
  };
}

export default function AgrodellerDashboard() {
  const { isAgrodealer, loading: roleLoading } = useRole();
  const { toast } = useToast();
  const { startScan, isScanning, isNativePlatform } = useQRScanner();
  const [vouchers, setVouchers] = useState<VoucherWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherWithDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchVouchers = async () => {
    try {
      // First get vouchers with loan requests
      const { data: vouchersData, error: vouchersError } = await supabase
        .from('vouchers')
        .select(`
          id,
          voucher_code,
          created_at,
          redeemed_at,
          redeemed_by,
          loan_request_id
        `)
        .order('created_at', { ascending: false });

      if (vouchersError) throw vouchersError;

      // Then get loan requests with related data
      const loanRequestIds = vouchersData?.map(v => v.loan_request_id) || [];
      
      const { data: loanRequestsData, error: loanRequestsError } = await supabase
        .from('loan_requests')
        .select(`
          id,
          amount,
          loan_type,
          status,
          producer_id,
          extensionista_id
        `)
        .in('id', loanRequestIds)
        .eq('status', 'approved');

      if (loanRequestsError) throw loanRequestsError;

      // Get producers data
      const producerIds = loanRequestsData?.map(lr => lr.producer_id) || [];
      const { data: producersData, error: producersError } = await supabase
        .from('producers')
        .select('id, nome_completo, nuit')
        .in('id', producerIds);

      if (producersError) throw producersError;

      // Get extensionistas data
      const extensionistaIds = loanRequestsData?.map(lr => lr.extensionista_id) || [];
      const { data: extensionistasData, error: extensionistasError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', extensionistaIds);

      if (extensionistasError) throw extensionistasError;

      // Combine all data
      const transformedData = vouchersData?.map(voucher => {
        const loanRequest = loanRequestsData?.find(lr => lr.id === voucher.loan_request_id);
        const producer = producersData?.find(p => p.id === loanRequest?.producer_id);
        const extensionista = extensionistasData?.find(e => e.id === loanRequest?.extensionista_id);

        return {
          id: voucher.id,
          voucher_code: voucher.voucher_code,
          created_at: voucher.created_at,
          redeemed_at: voucher.redeemed_at,
          redeemed_by: voucher.redeemed_by,
          loan_request: {
            id: loanRequest?.id || '',
            amount: loanRequest?.amount || 0,
            loan_type: loanRequest?.loan_type || '',
            producer: {
              nome_completo: producer?.nome_completo || '',
              nuit: producer?.nuit || '',
            },
            extensionista: {
              full_name: extensionista?.full_name || '',
            }
          }
        };
      }).filter(voucher => voucher.loan_request.id) || []; // Filter out vouchers without valid loan requests
      
      setVouchers(transformedData);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      toast({
        title: "Erro ao carregar vouchers",
        description: "Não foi possível carregar a lista de vouchers.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (voucherCode: string) => {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(voucherCode, {
        width: 300,
        margin: 2,
      });
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleViewVoucher = async (voucher: VoucherWithDetails) => {
    setSelectedVoucher(voucher);
    await generateQRCode(voucher.voucher_code);
    setDialogOpen(true);
  };

  const handleRedeemVoucher = async (voucherId: string) => {
    try {
      // Get current user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (profileError || !userProfile) {
        toast({
          title: "Erro",
          description: "Não foi possível obter informações do usuário.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('vouchers')
        .update({
          redeemed_at: new Date().toISOString(),
          redeemed_by: userProfile.id,
        })
        .eq('id', voucherId);

      if (error) {
        console.error('Error redeeming voucher:', error);
        toast({
          title: "Erro ao resgatar voucher",
          description: "Não foi possível resgatar o voucher.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Voucher resgatado",
          description: "O voucher foi resgatado com sucesso.",
        });
        fetchVouchers(); // Refresh the list
        setDialogOpen(false);
      }
    } catch (error) {
      console.error('Error redeeming voucher:', error);
      toast({
        title: "Erro ao resgatar voucher",
        description: "Não foi possível resgatar o voucher.",
        variant: "destructive",
      });
    }
  };

  const handleRedeemByCode = async () => {
    if (!voucherCodeInput.trim()) {
      toast({
        title: "Código necessário",
        description: "Por favor, insira o código do voucher.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find voucher by code
      const { data: voucher, error: findError } = await supabase
        .from('vouchers')
        .select('id, redeemed_at')
        .eq('voucher_code', voucherCodeInput.trim())
        .single();

      if (findError || !voucher) {
        toast({
          title: "Voucher não encontrado",
          description: "O código inserido não corresponde a nenhum voucher válido.",
          variant: "destructive",
        });
        return;
      }

      if (voucher.redeemed_at) {
        toast({
          title: "Voucher já resgatado",
          description: "Este voucher já foi resgatado anteriormente.",
          variant: "destructive",
        });
        return;
      }

      await handleRedeemVoucher(voucher.id);
      setVoucherCodeInput("");
      setRedeemDialogOpen(false);
    } catch (error) {
      console.error('Error redeeming voucher by code:', error);
      toast({
        title: "Erro ao resgatar voucher",
        description: "Não foi possível resgatar o voucher.",
        variant: "destructive",
      });
    }
  };

  const handleQRScan = async () => {
    try {
      const scannedCode = await startScan();
      if (scannedCode) {
        // Use the scanned code directly to redeem
        try {
          // Find voucher by code
          const { data: voucher, error: findError } = await supabase
            .from('vouchers')
            .select('id, redeemed_at')
            .eq('voucher_code', scannedCode.trim())
            .single();

          if (findError || !voucher) {
            toast({
              title: "Voucher não encontrado",
              description: "O QR code escaneado não corresponde a nenhum voucher válido.",
              variant: "destructive",
            });
            return;
          }

          if (voucher.redeemed_at) {
            toast({
              title: "Voucher já resgatado",
              description: "Este voucher já foi resgatado anteriormente.",
              variant: "destructive",
            });
            return;
          }

          await handleRedeemVoucher(voucher.id);
        } catch (error) {
          console.error('Error redeeming scanned voucher:', error);
          toast({
            title: "Erro ao resgatar voucher",
            description: "Não foi possível resgatar o voucher escaneado.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error during QR scan:', error);
      toast({
        title: "Erro no scanner",
        description: "Não foi possível escanear o QR code.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!roleLoading && isAgrodealer) {
      fetchVouchers();
    }
  }, [roleLoading, isAgrodealer]);

  const filteredVouchers = vouchers.filter(voucher =>
    voucher.voucher_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voucher.loan_request.producer.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voucher.loan_request.producer.nuit.includes(searchTerm) ||
    voucher.loan_request.extensionista.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unredeemed = filteredVouchers.filter(v => !v.redeemed_at);
  const redeemed = filteredVouchers.filter(v => v.redeemed_at);

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAgrodealer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
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
      <AppSidebar />
      <SidebarInset>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Agrodealer</h1>
              <p className="text-gray-600">Gerencie o resgate de vouchers aprovados</p>
              {!isNativePlatform && (
                <p className="text-amber-600 text-sm mt-1">
                  📱 Scanner QR funciona apenas no app móvel. Use "Código Manual" no navegador.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleQRScan} 
                disabled={isScanning}
                className="flex items-center gap-2"
                variant={isNativePlatform ? "default" : "secondary"}
                title={isNativePlatform ? "Escanear QR Code" : "Scanner disponível apenas no app móvel"}
              >
                <Camera className="h-4 w-4" />
                {isScanning ? "Escaneando..." : isNativePlatform ? "Escanear QR" : "QR (Mobile)"}
              </Button>
              <Button onClick={() => setRedeemDialogOpen(true)} className="flex items-center gap-2">
                <ScanLine className="h-4 w-4" />
                Código Manual
              </Button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Vouchers</CardTitle>
                <QrCode className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{vouchers.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
                <QrCode className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{unredeemed.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resgatados</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{redeemed.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Pesquisar por código, produtor, NUIT ou extensionista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Vouchers List */}
          <div className="space-y-6">
            {/* Unredeemed Vouchers */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-green-600">Vouchers Disponíveis ({unredeemed.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unredeemed.map((voucher) => (
                  <Card key={voucher.id} className="cursor-pointer hover:shadow-lg transition-shadow border-green-200">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">{voucher.voucher_code}</CardTitle>
                      <CardDescription>
                        {voucher.loan_request.producer.nome_completo}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <p><strong>NUIT:</strong> {voucher.loan_request.producer.nuit}</p>
                        <p><strong>Valor:</strong> {voucher.loan_request.amount?.toLocaleString('pt-MZ')} MZN</p>
                        <p><strong>Tipo:</strong> {voucher.loan_request.loan_type}</p>
                        <p><strong>Extensionista:</strong> {voucher.loan_request.extensionista.full_name}</p>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Disponível
                        </Badge>
                      </div>
                      <Button 
                        onClick={() => handleViewVoucher(voucher)}
                        className="w-full mt-4"
                        size="sm"
                      >
                        Ver Detalhes
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Redeemed Vouchers */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-blue-600">Vouchers Resgatados ({redeemed.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {redeemed.map((voucher) => (
                  <Card key={voucher.id} className="border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">{voucher.voucher_code}</CardTitle>
                      <CardDescription>
                        {voucher.loan_request.producer.nome_completo}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <p><strong>NUIT:</strong> {voucher.loan_request.producer.nuit}</p>
                        <p><strong>Valor:</strong> {voucher.loan_request.amount?.toLocaleString('pt-MZ')} MZN</p>
                        <p><strong>Tipo:</strong> {voucher.loan_request.loan_type}</p>
                        <p><strong>Resgatado em:</strong> {new Date(voucher.redeemed_at!).toLocaleString('pt-PT')}</p>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Resgatado
                        </Badge>
                      </div>
                      <Button 
                        onClick={() => handleViewVoucher(voucher)}
                        variant="outline"
                        className="w-full mt-4"
                        size="sm"
                      >
                        Ver Detalhes
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Voucher Details Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Detalhes do Voucher</DialogTitle>
              </DialogHeader>
              {selectedVoucher && (
                <div className="space-y-4">
                  <div className="text-center">
                    {qrCodeUrl && (
                      <img src={qrCodeUrl} alt="QR Code" className="mx-auto mb-4" />
                    )}
                    <h3 className="text-lg font-semibold">{selectedVoucher.voucher_code}</h3>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <p><strong>Produtor:</strong> {selectedVoucher.loan_request.producer.nome_completo}</p>
                    <p><strong>NUIT:</strong> {selectedVoucher.loan_request.producer.nuit}</p>
                    <p><strong>Valor:</strong> {selectedVoucher.loan_request.amount?.toLocaleString('pt-MZ')} MZN</p>
                    <p><strong>Tipo de Empréstimo:</strong> {selectedVoucher.loan_request.loan_type}</p>
                    <p><strong>Extensionista:</strong> {selectedVoucher.loan_request.extensionista.full_name}</p>
                    <p><strong>Criado em:</strong> {new Date(selectedVoucher.created_at).toLocaleString('pt-PT')}</p>
                    {selectedVoucher.redeemed_at && (
                      <p><strong>Resgatado em:</strong> {new Date(selectedVoucher.redeemed_at).toLocaleString('pt-PT')}</p>
                    )}
                  </div>

                  {!selectedVoucher.redeemed_at && (
                    <Button 
                      onClick={() => handleRedeemVoucher(selectedVoucher.id)}
                      className="w-full"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Marcar como Resgatado
                    </Button>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Redeem by Code Dialog */}
          <Dialog open={redeemDialogOpen} onOpenChange={setRedeemDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Resgatar Voucher por Código</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="voucher-code">Código do Voucher</Label>
                  <Input
                    id="voucher-code"
                    placeholder="Ex: VCH-20240101-001"
                    value={voucherCodeInput}
                    onChange={(e) => setVoucherCodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRedeemByCode()}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleRedeemByCode} className="flex-1">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Resgatar
                  </Button>
                  <Button variant="outline" onClick={() => setRedeemDialogOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}