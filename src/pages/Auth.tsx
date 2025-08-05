import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, Lock, UserPlus, Building2 } from "lucide-react";
import { Textarea as TextareaComponent } from "@/components/ui/textarea";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ 
    email: "", 
    password: "", 
    username: "", 
    full_name: "" 
  });

  const [exporterData, setExporterData] = useState({
    email: "",
    password: "",
    company_name: "",
    company_nuit: "",
    contact_phone: "",
    export_products: "",
    company_address: ""
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo de volta.",
        });
        navigate("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username: signupData.username,
            full_name: signupData.full_name,
          }
        }
      });

      if (error) {
        toast({
          title: "Erro no registo",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique o seu email para confirmar a conta.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExporterSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: exporterData.email,
        password: exporterData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username: exporterData.company_name.toLowerCase().replace(/\s+/g, '_'),
            full_name: exporterData.company_name,
            role: 'exportador'
          }
        }
      });

      if (authError) throw authError;

      // Create exporter profile
      if (authData.user) {
        const { error: exporterError } = await supabase
          .from('exporters')
          .insert({
            user_id: authData.user.id,
            company_name: exporterData.company_name,
            company_nuit: exporterData.company_nuit,
            contact_email: exporterData.email,
            contact_phone: exporterData.contact_phone,
            export_products: exporterData.export_products.split(',').map(p => p.trim()),
            company_address: exporterData.company_address
          });

        if (exporterError) throw exporterError;
      }

      toast({
        title: "Registo de exportador enviado!",
        description: "Aguarde a aprovação do administrador para aceder ao sistema.",
      });

      // Reset form
      setExporterData({
        email: "",
        password: "",
        company_name: "",
        company_nuit: "",
        contact_phone: "",
        export_products: "",
        company_address: ""
      });

    } catch (error: any) {
      toast({
        title: "Erro no registo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(/lovable-uploads/847b6793-53df-467c-bf9b-7c5d9020f23f.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <Card className="w-full max-w-md relative z-10 bg-white/70 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/01a960d6-3004-4c5d-a341-f88cb9a5c5d5.png" 
              alt="IAOM - Instituto do Algodão e Oleaginosas de Moçambique" 
              className="h-20 w-auto"
            />
          </div>
          <CardDescription>Sistema de Gestão Agrícola</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Registar</TabsTrigger>
              <TabsTrigger value="exporter">Exportador</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Palavra-passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "A entrar..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-full-name">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-full-name"
                      type="text"
                      placeholder="João Silva"
                      className="pl-10"
                      value={signupData.full_name}
                      onChange={(e) => setSignupData({ ...signupData, full_name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Nome de utilizador</Label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="joao.silva"
                      className="pl-10"
                      value={signupData.username}
                      onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Palavra-passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "A criar conta..." : "Criar Conta"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="exporter">
              <form onSubmit={handleExporterSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="company-name"
                      type="text"
                      placeholder="Empresa Exportadora Lda"
                      className="pl-10"
                      value={exporterData.company_name}
                      onChange={(e) => setExporterData({ ...exporterData, company_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-nuit">NUIT da Empresa</Label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="company-nuit"
                      type="text"
                      placeholder="123456789"
                      className="pl-10"
                      value={exporterData.company_nuit}
                      onChange={(e) => setExporterData({ ...exporterData, company_nuit: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exporter-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="exporter-email"
                      type="email"
                      placeholder="empresa@email.com"
                      className="pl-10"
                      value={exporterData.email}
                      onChange={(e) => setExporterData({ ...exporterData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exporter-password">Palavra-passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="exporter-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={exporterData.password}
                      onChange={(e) => setExporterData({ ...exporterData, password: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Telefone</Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    placeholder="+258 84 123 4567"
                    value={exporterData.contact_phone}
                    onChange={(e) => setExporterData({ ...exporterData, contact_phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="export-products">Produtos para Exportação</Label>
                  <TextareaComponent
                    id="export-products"
                    placeholder="Algodão, Gergelim, Amendoim (separados por vírgula)"
                    value={exporterData.export_products}
                    onChange={(e) => setExporterData({ ...exporterData, export_products: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-address">Endereço da Empresa</Label>
                  <TextareaComponent
                    id="company-address"
                    placeholder="Endereço completo da empresa"
                    value={exporterData.company_address}
                    onChange={(e) => setExporterData({ ...exporterData, company_address: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "A registar..." : "Registar como Exportador"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;