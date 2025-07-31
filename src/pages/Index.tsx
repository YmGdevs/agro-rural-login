import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sprout, User, Lock } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Por favor, preencha todos os campos", {
        description: "Nome de utilizador e senha são obrigatórios",
      });
      return;
    }
    
    toast.success("Login realizado com sucesso!", {
      description: "Bem-vindo ao sistema de extensionistas agrícolas",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/30 to-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 border-border/50">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-forest-green rounded-full flex items-center justify-center shadow-lg">
            <Sprout className="w-10 h-10 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">IAOM</CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Sistema de Extensionistas Agrícolas
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground font-medium">
                Nome de Utilizador
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Digite seu nome de utilizador"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12 bg-input border-border focus:border-primary transition-colors"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-input border-border focus:border-primary transition-colors"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-primary to-forest-green hover:from-primary/90 hover:to-forest-green/90 text-primary-foreground font-semibold text-lg shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
