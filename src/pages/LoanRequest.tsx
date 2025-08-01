import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, CreditCard, User, Shield, DollarSign, FileText, Plus, Clock, CheckCircle, XCircle, QrCode } from "lucide-react";
import QRCode from "qrcode";

interface Producer {
  id: string;
  nome_completo: string;
  nuit: string;
}

interface LoanRequest {
  id: string;
  producer_id: string;
  loan_type: string;
  amount: number | null;
  item_description: string | null;
  description: string | null;
  justification: string;
  status: string;
  created_at: string;
  producer: {
    nome_completo: string;
    nuit: string;
  } | null;
  voucher: {
    voucher_code: string;
    created_at: string;
  } | null;
}

const LoanRequest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useRole();
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  
  const [selectedProducer, setSelectedProducer] = useState("");
  const [communityConsent, setCommunityConsent] = useState(false);
  const [loanType, setLoanType] = useState("money");
  const [loanValue, setLoanValue] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [justification, setJustification] = useState("");
  const [selectedVoucherRequest, setSelectedVoucherRequest] = useState<LoanRequest | null>(null);
  const [voucherQR, setVoucherQR] = useState<string>("");
  const [isVoucherDialogOpen, setIsVoucherDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscription for loan_requests
    const channel = supabase
      .channel('loan_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'loan_requests'
        },
        (payload) => {
          console.log('Real-time update:', payload);
          // Refresh loan requests when any change occurs
          fetchLoanRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([fetchProducers(), fetchLoanRequests()]);
    } catch (error) {
      // Error handling is done in individual functions
    } finally {
      setLoading(false);
    }
  };

  const fetchProducers = async () => {
    try {
      const { data, error } = await supabase
        .from('producers')
        .select('id, nome_completo, nuit')
        .order('nome_completo');

      if (error) throw error;
      setProducers(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar produtores",
        variant: "destructive",
      });
    }
  };

  const fetchLoanRequests = async () => {
    try {
      // Get current user's profile to get extensionista_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const { data, error } = await supabase
        .from('loan_requests')
        .select(`
          id,
          producer_id,
          loan_type,
          amount,
          item_description,
          description,
          justification,
          status,
          created_at,
          producer:producers(nome_completo, nuit),
          voucher:vouchers(voucher_code, created_at)
        `)
        .eq('extensionista_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLoanRequests((data as any) || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar pedidos de empréstimo",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset field errors
    const errors: Record<string, boolean> = {};
    
    // Check required fields and mark errors
    if (!selectedProducer) {
      errors.selectedProducer = true;
    }
    
    if (!communityConsent) {
      errors.communityConsent = true;
    }
    
    if (!loanValue) {
      errors.loanValue = true;
    }
    
    if (loanType === "item" && !itemDescription) {
      errors.itemDescription = true;
    }
    
    if (!justification) {
      errors.justification = true;
    }
    
    // If there are errors, set them and show toast
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios destacados",
        variant: "destructive",
      });
      return;
    }
    
    // Clear errors if validation passes
    setFieldErrors({});

    setSubmitting(true);
    
    try {
      // Get current user's profile to get extensionista_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      // Create loan request
      const { error } = await supabase
        .from('loan_requests')
        .insert({
          producer_id: selectedProducer,
          extensionista_id: profile.id,
          loan_type: loanType,
          amount: loanType === 'money' ? parseFloat(loanValue) : null,
          item_description: loanType === 'item' ? itemDescription : null,
          description: loanValue,
          justification,
          community_consent: communityConsent,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Pedido de empréstimo submetido com sucesso",
      });
      
      // Reset form and return to list view
      setSelectedProducer("");
      setCommunityConsent(false);
      setLoanType("money");
      setLoanValue("");
      setItemDescription("");
      setJustification("");
      setShowForm(false);
      
      // Refresh loan requests
      fetchLoanRequests();
    } catch (error) {
      console.error('Error submitting loan request:', error);
      toast({
        title: "Erro",
        description: "Erro ao submeter pedido de empréstimo",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const generateVoucherQR = async (voucherCode: string) => {
    try {
      const qrDataURL = await QRCode.toDataURL(voucherCode);
      setVoucherQR(qrDataURL);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleApprovedLoanClick = (request: LoanRequest) => {
    if (request.status === 'approved' && request.voucher) {
      setSelectedVoucherRequest(request);
      setIsVoucherDialogOpen(true);
      generateVoucherQR(request.voucher.voucher_code);
    }
  };

  const selectedProducerData = producers.find(p => p.id === selectedProducer);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <div className="animate-spin h-6 w-6 border-3 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-center mt-3 text-gray-600 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm sticky top-0 z-50 border-b border-white/20">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="rounded-full hover:bg-purple-100 h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4 text-gray-700" />
            </Button>
            <h1 className="text-lg font-bold text-gray-900">Pedidos de Empréstimo</h1>
            <div className="w-9" />
          </div>
        </div>
      </div>

      <div className="px-4 py-4 pb-20">
        {!showForm ? (
          // Lista de empréstimos existentes
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Meus Pedidos</h2>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Pedido
              </Button>
            </div>

            {loanRequests.length === 0 ? (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50 text-center">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum pedido encontrado</h3>
                <p className="text-gray-500 mb-4">Você ainda não submeteu nenhum pedido de empréstimo.</p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Pedido
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {loanRequests.map((request) => (
                  <Card 
                    key={request.id} 
                    className={`bg-white/70 backdrop-blur-sm border border-white/50 ${
                      request.status === 'approved' && request.voucher 
                        ? 'cursor-pointer hover:shadow-lg hover:border-green-300 transition-all' 
                        : ''
                    }`}
                    onClick={() => handleApprovedLoanClick(request)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base text-gray-900">
                              {request.producer?.nome_completo || "Produtor não especificado"}
                            </h3>
                            {request.status === 'approved' && request.voucher && (
                              <QrCode className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500">NUIT: {request.producer?.nuit || "N/A"}</p>
                          {request.voucher && request.status === 'approved' && (
                            <div className="mt-2">
                              <span className="text-xs text-gray-500 block">Código do Voucher:</span>
                              <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-mono font-medium inline-block">
                                {request.voucher.voucher_code}
                              </div>
                            </div>
                          )}
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <div>
                          <span className="text-xs text-gray-500">Tipo: </span>
                          <span className="text-sm font-medium">{request.loan_type === 'money' ? 'Dinheiro' : 'Item'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Valor: </span>
                          <span className="text-sm font-medium">
                            {request.amount ? `${request.amount.toLocaleString()} MZN` : 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      {request.item_description && (
                        <div className="mb-2">
                          <span className="text-xs text-gray-500">Item: </span>
                          <span className="text-sm">{request.item_description}</span>
                        </div>
                      )}
                      
                      <div className="mb-2">
                        <p className="text-sm text-gray-700 line-clamp-2">{request.justification}</p>
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        {new Date(request.created_at).toLocaleDateString('pt-PT')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Formulário de novo pedido
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setShowForm(false)}
                className="text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar à Lista
              </Button>
              <h2 className="text-xl font-bold text-gray-900">Novo Pedido</h2>
              <div className="w-20" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Beneficiário e Consentimento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Seleção do Produtor */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mr-3">
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Beneficiário</h3>
                      <p className="text-xs text-gray-500">Selecione o produtor</p>
                    </div>
                  </div>
                  
                  <Select 
                    value={selectedProducer} 
                    onValueChange={(value) => {
                      setSelectedProducer(value);
                      if (fieldErrors.selectedProducer) {
                        setFieldErrors(prev => ({ ...prev, selectedProducer: false }));
                      }
                    }}
                  >
                    <SelectTrigger className={`bg-gray-50 border-0 rounded-xl h-12 ${
                      fieldErrors.selectedProducer ? 'ring-2 ring-red-500 bg-red-50' : ''
                    }`}>
                      <SelectValue placeholder="Escolha um produtor" />
                    </SelectTrigger>
                    <SelectContent>
                      {producers.map((producer) => (
                        <SelectItem key={producer.id} value={producer.id}>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{producer.nome_completo}</span>
                            <span className="text-xs text-gray-500">NUIT: {producer.nuit}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedProducerData && (
                    <div className="mt-3 p-3 bg-purple-50 rounded-xl">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{selectedProducerData.nome_completo}</p>
                          <p className="text-xs text-gray-600">NUIT: {selectedProducerData.nuit}</p>
                        </div>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Consentimento */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Consentimento</h3>
                      <p className="text-xs text-gray-500">Aprovação da comunidade</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-start space-x-3 p-3 rounded-xl ${
                    fieldErrors.communityConsent ? 'bg-red-50 ring-2 ring-red-500' : 'bg-blue-50'
                  }`}>
                    <Checkbox
                      id="consent"
                      checked={communityConsent}
                      onCheckedChange={(checked) => {
                        setCommunityConsent(checked === true);
                        if (fieldErrors.communityConsent) {
                          setFieldErrors(prev => ({ ...prev, communityConsent: false }));
                        }
                      }}
                      className="mt-0.5"
                    />
                    <Label htmlFor="consent" className="text-xs leading-relaxed text-gray-700">
                      Confirmo que há consentimento da comunidade para este pedido de empréstimo
                    </Label>
                  </div>
                </div>
              </div>

              {/* Detalhes do Empréstimo */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-3">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Detalhes</h3>
                    <p className="text-xs text-gray-500">Tipo e valor do empréstimo</p>
                  </div>
                </div>

                {/* Tipo de Empréstimo */}
                <div className="mb-4">
                  <Label className="text-xs font-medium mb-2 block">Tipo de Empréstimo</Label>
                  <RadioGroup value={loanType} onValueChange={setLoanType} className="space-y-2">
                    <div className={`flex items-center space-x-2 p-3 rounded-xl border-2 transition-all ${
                      loanType === "money" ? "border-purple-200 bg-purple-50" : "border-gray-200 bg-gray-50"
                    }`}>
                      <RadioGroupItem value="money" id="money" />
                      <Label htmlFor="money" className="font-medium text-sm">Dinheiro</Label>
                    </div>
                    <div className={`flex items-center space-x-2 p-3 rounded-xl border-2 transition-all ${
                      loanType === "item" ? "border-purple-200 bg-purple-50" : "border-gray-200 bg-gray-50"
                    }`}>
                      <RadioGroupItem value="item" id="item" />
                      <Label htmlFor="item" className="font-medium text-sm">Item/Produto</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Valor */}
                <div className="mb-3">
                  <Label htmlFor="value" className="text-xs font-medium block mb-1">
                    {loanType === "money" ? "Valor (MZN)" : "Valor Estimado (MZN)"}
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    placeholder="0.00"
                    value={loanValue}
                    onChange={(e) => {
                      setLoanValue(e.target.value);
                      if (fieldErrors.loanValue) {
                        setFieldErrors(prev => ({ ...prev, loanValue: false }));
                      }
                    }}
                    className={`bg-gray-50 border-0 rounded-xl h-12 text-base font-semibold ${
                      fieldErrors.loanValue ? 'ring-2 ring-red-500 bg-red-50' : ''
                    }`}
                  />
                </div>

                {/* Descrição do Item */}
                {loanType === "item" && (
                  <div>
                    <Label htmlFor="item-description" className="text-xs font-medium block mb-1">
                      Descrição do Item
                    </Label>
                    <Input
                      id="item-description"
                      placeholder="Ex: Sementes de milho, ferramentas agrícolas..."
                      value={itemDescription}
                      onChange={(e) => {
                        setItemDescription(e.target.value);
                        if (fieldErrors.itemDescription) {
                          setFieldErrors(prev => ({ ...prev, itemDescription: false }));
                        }
                      }}
                      className={`bg-gray-50 border-0 rounded-xl h-12 ${
                        fieldErrors.itemDescription ? 'ring-2 ring-red-500 bg-red-50' : ''
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Justificação */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mr-3">
                    <FileText className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Justificação</h3>
                    <p className="text-xs text-gray-500">Motivo do empréstimo</p>
                  </div>
                </div>
                
                <Textarea
                  placeholder="Explique o motivo do empréstimo e como será utilizado..."
                  value={justification}
                  onChange={(e) => {
                    setJustification(e.target.value);
                    if (fieldErrors.justification) {
                      setFieldErrors(prev => ({ ...prev, justification: false }));
                    }
                  }}
                  className={`bg-gray-50 border-0 rounded-xl min-h-[100px] resize-none text-sm ${
                    fieldErrors.justification ? 'ring-2 ring-red-500 bg-red-50' : ''
                  }`}
                />
              </div>

              {/* Botão de Submissão */}
              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-2xl text-base font-semibold shadow-xl transform transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Submetendo...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Submeter Pedido a Revisão
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Dialog for voucher QR code */}
      <Dialog open={isVoucherDialogOpen} onOpenChange={setIsVoucherDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Voucher do Empréstimo</DialogTitle>
            <DialogDescription>
              QR Code para o voucher aprovado
            </DialogDescription>
          </DialogHeader>
          {selectedVoucherRequest && (
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {selectedVoucherRequest.producer?.nome_completo}
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  NUIT: {selectedVoucherRequest.producer?.nuit}
                </p>
              </div>
              
              {selectedVoucherRequest.voucher && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="text-center">
                    <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg font-mono text-lg font-medium inline-block mb-4">
                      {selectedVoucherRequest.voucher.voucher_code}
                    </div>
                    
                    {voucherQR && (
                      <div>
                        <p className="text-sm font-medium text-green-800 mb-3">QR Code do Voucher:</p>
                        <div className="inline-block p-3 bg-white rounded-lg border-2 border-green-200">
                          <img src={voucherQR} alt="QR Code do Voucher" className="w-48 h-48" />
                        </div>
                        <p className="text-xs text-green-600 mt-3">
                          Gerado em: {new Date(selectedVoucherRequest.voucher.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoanRequest;