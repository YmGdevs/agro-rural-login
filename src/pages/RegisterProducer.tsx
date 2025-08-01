import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, User, FileText, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const RegisterProducer = () => {
  const [formData, setFormData] = useState({
    nomeCompleto: "",
    genero: "",
    idade: "",
    nuit: "",
    documento: null as File | null
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        documento: file
      }));
      toast.success("Documento carregado com sucesso!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nomeCompleto || !formData.genero || !formData.idade || !formData.nuit) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (!formData.documento) {
      toast.error("Por favor, adicione a foto do documento");
      return;
    }

    try {
      // Get the current user's profile to get their profile ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (profileError || !profile) {
        toast.error("Erro ao identificar o extensionista. Tente novamente.");
        return;
      }

      // Insert producer data into database with extensionista_id
      const { error } = await supabase
        .from('producers')
        .insert({
          nome_completo: formData.nomeCompleto,
          genero: formData.genero,
          idade: parseInt(formData.idade),
          nuit: formData.nuit,
          documento_url: formData.documento.name, // For now, just store filename
          extensionista_id: profile.id
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.error("Este NUIT já está registado no sistema");
        } else {
          toast.error("Erro ao registar o produtor. Tente novamente.");
        }
        return;
      }

      toast.success("Produtor rural registado com sucesso!", {
        description: `${formData.nomeCompleto} foi adicionado ao sistema`,
      });

      // Reset form
      setFormData({
        nomeCompleto: "",
        genero: "",
        idade: "",
        nuit: "",
        documento: null
      });
    } catch (error) {
      toast.error("Erro ao registar o produtor. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/30 to-secondary p-4">
      {/* Header */}
      <div className="flex items-center mb-6 pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="mr-3 p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Registar Produtor Rural</h1>
      </div>

      <Card className="max-w-md mx-auto shadow-2xl border-2 border-border/50">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-forest-green rounded-full flex items-center justify-center shadow-lg mb-4">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-lg font-bold text-foreground">
            Novo Produtor Rural
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nome Completo */}
            <div className="space-y-2">
              <Label htmlFor="nomeCompleto" className="text-foreground font-medium text-sm">
                Nome Completo *
              </Label>
              <Input
                id="nomeCompleto"
                type="text"
                placeholder="Digite o nome completo"
                value={formData.nomeCompleto}
                onChange={(e) => handleInputChange("nomeCompleto", e.target.value)}
                className="h-11 bg-input border-border focus:border-primary transition-colors"
              />
            </div>

            {/* Género */}
            <div className="space-y-2">
              <Label htmlFor="genero" className="text-foreground font-medium text-sm">
                Género *
              </Label>
              <Select
                value={formData.genero}
                onValueChange={(value) => handleInputChange("genero", value)}
              >
                <SelectTrigger className="h-11 bg-input border-border focus:border-primary">
                  <SelectValue placeholder="Seleccione o género" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Idade */}
            <div className="space-y-2">
              <Label htmlFor="idade" className="text-foreground font-medium text-sm">
                Idade *
              </Label>
              <Input
                id="idade"
                type="number"
                placeholder="Digite a idade"
                value={formData.idade}
                onChange={(e) => handleInputChange("idade", e.target.value)}
                className="h-11 bg-input border-border focus:border-primary transition-colors"
                min="18"
                max="100"
              />
            </div>

            {/* NUIT */}
            <div className="space-y-2">
              <Label htmlFor="nuit" className="text-foreground font-medium text-sm">
                NUIT *
              </Label>
              <Input
                id="nuit"
                type="text"
                placeholder="Digite o número do NUIT"
                value={formData.nuit}
                onChange={(e) => handleInputChange("nuit", e.target.value)}
                className="h-11 bg-input border-border focus:border-primary transition-colors"
                maxLength={9}
              />
            </div>

            {/* Foto do Documento */}
            <div className="space-y-2">
              <Label htmlFor="documento" className="text-foreground font-medium text-sm">
                Foto do Documento *
              </Label>
              <div className="relative">
                <input
                  id="documento"
                  type="file"
                  accept="image/*"
                  onChange={handleDocumentUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="h-24 bg-input border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary transition-colors">
                  <Camera className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground text-center px-2">
                    {formData.documento ? formData.documento.name : "Toque para adicionar foto"}
                  </span>
                </div>
              </div>
            </div>

            {/* Botão Registar */}
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-primary to-forest-green hover:from-primary/90 hover:to-forest-green/90 text-primary-foreground font-semibold text-base shadow-lg transition-all duration-200 hover:shadow-xl mt-6"
            >
              <FileText className="mr-2 h-4 w-4" />
              Registar Produtor
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterProducer;