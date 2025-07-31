import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, CreditCard } from "lucide-react";

interface Producer {
  id: string;
  nome_completo: string;
  nuit: string;
}

const LoanRequest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedProducer, setSelectedProducer] = useState("");
  const [communityConsent, setCommunityConsent] = useState(false);
  const [loanType, setLoanType] = useState("money");
  const [loanValue, setLoanValue] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [justification, setJustification] = useState("");

  useEffect(() => {
    fetchProducers();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProducer) {
      toast({
        title: "Erro",
        description: "Selecione um produtor",
        variant: "destructive",
      });
      return;
    }

    if (!communityConsent) {
      toast({
        title: "Erro",
        description: "É necessário confirmar o consentimento da comunidade",
        variant: "destructive",
      });
      return;
    }

    if (!loanValue || (loanType === "item" && !itemDescription) || !justification) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    
    // Here you would typically save to database
    // For now, just show success message
    
    setTimeout(() => {
      toast({
        title: "Sucesso",
        description: "Pedido de empréstimo submetido com sucesso",
      });
      navigate("/dashboard");
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 p-6">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Pedir Empréstimo</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      <div className="px-6 pb-24">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção do Produtor */}
          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Selecionar Produtor</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedProducer} onValueChange={setSelectedProducer}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um produtor" />
                </SelectTrigger>
                <SelectContent>
                  {producers.map((producer) => (
                    <SelectItem key={producer.id} value={producer.id}>
                      {producer.nome_completo} - NUIT: {producer.nuit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Consentimento da Comunidade */}
          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consent"
                  checked={communityConsent}
                  onCheckedChange={(checked) => setCommunityConsent(checked === true)}
                />
                <Label htmlFor="consent" className="text-sm leading-relaxed">
                  Confirmo que há consentimento da comunidade para este pedido de empréstimo
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Tipo e Valor do Empréstimo */}
          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Detalhes do Empréstimo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-3 block">Tipo de Empréstimo</Label>
                <RadioGroup value={loanType} onValueChange={setLoanType}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="money" id="money" />
                    <Label htmlFor="money">Dinheiro</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="item" id="item" />
                    <Label htmlFor="item">Item/Produto</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="value" className="text-sm font-medium">
                  {loanType === "money" ? "Valor (MZN)" : "Valor Estimado (MZN)"}
                </Label>
                <Input
                  id="value"
                  type="number"
                  placeholder="0.00"
                  value={loanValue}
                  onChange={(e) => setLoanValue(e.target.value)}
                  className="mt-1"
                />
              </div>

              {loanType === "item" && (
                <div>
                  <Label htmlFor="item-description" className="text-sm font-medium">
                    Descrição do Item
                  </Label>
                  <Input
                    id="item-description"
                    placeholder="Ex: Sementes de milho, ferramentas agrícolas..."
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Justificação */}
          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Justificação</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Explique o motivo do empréstimo e como será utilizado..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Botão de Submissão */}
          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-2xl"
            disabled={submitting}
          >
            <CreditCard className="h-5 w-5 mr-2" />
            {submitting ? "Submetendo..." : "Submeter Pedido"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoanRequest;