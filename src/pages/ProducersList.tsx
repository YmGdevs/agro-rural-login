import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type Producer = {
  id: string;
  nome_completo: string;
  genero: string;
  idade: number;
  nuit: string;
  created_at: string;
};

const ProducersList = () => {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [filteredProducers, setFilteredProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchProducers();
  }, []);

  useEffect(() => {
    const filtered = producers.filter(producer =>
      producer.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producer.nuit.includes(searchTerm)
    );
    setFilteredProducers(filtered);
  }, [searchTerm, producers]);

  const fetchProducers = async () => {
    try {
      if (!user) {
        toast.error("Utilizador não autenticado");
        return;
      }

      // Get the current user's profile to get their profile ID  
      const profileResponse = await supabase
        .from('profiles')
        .select('id, role')
        .eq('user_id', user.id)
        .single();

      if (profileResponse.error || !profileResponse.data) {
        toast.error("Erro ao identificar o perfil do utilizador");
        return;
      }

      const profile = profileResponse.data;

      // Create query with type assertion to avoid TS inference issues
      let producersResponse;
      
      if (profile.role === 'extensionista') {
        producersResponse = await (supabase as any)
          .from('producers')
          .select('*')
          .eq('extensionista_id', profile.id)
          .order('created_at', { ascending: false });
      } else {
        producersResponse = await (supabase as any)
          .from('producers')
          .select('*')
          .order('created_at', { ascending: false });
      }

      if (producersResponse.error) {
        console.error('Error fetching producers:', producersResponse.error);
        toast.error("Erro ao carregar a lista de produtores");
        return;
      }

      setProducers(producersResponse.data || []);
    } catch (error) {
      console.error('Error in fetchProducers:', error);
      toast.error("Erro ao carregar a lista de produtores");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
        <h1 className="text-xl font-bold text-foreground">Lista de Produtores</h1>
      </div>

      <Card className="max-w-4xl mx-auto shadow-2xl border-2 border-border/50">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-forest-green rounded-full flex items-center justify-center shadow-lg mb-4">
            <Users className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-lg font-bold text-foreground">
            Produtores Rurais Registados
          </CardTitle>
          
          {/* Search */}
          <div className="relative max-w-md mx-auto mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome ou NUIT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando produtores...</p>
            </div>
          ) : filteredProducers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhum produtor encontrado" : "Nenhum produtor registado ainda"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => navigate("/register-producer")}
                  className="mt-4"
                >
                  Registar Primeiro Produtor
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>Género</TableHead>
                    <TableHead>Idade</TableHead>
                    <TableHead>NUIT</TableHead>
                    <TableHead>Data de Registo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducers.map((producer) => (
                    <TableRow 
                      key={producer.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/producer/${producer.id}/parcelas`)}
                    >
                      <TableCell className="font-medium">
                        {producer.nome_completo}
                      </TableCell>
                      <TableCell className="capitalize">
                        {producer.genero}
                      </TableCell>
                      <TableCell>{producer.idade} anos</TableCell>
                      <TableCell className="font-mono">
                        {producer.nuit}
                      </TableCell>
                      <TableCell>
                        {formatDate(producer.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {filteredProducers.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Total: {filteredProducers.length} produtor{filteredProducers.length !== 1 ? 'es' : ''} encontrado{filteredProducers.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProducersList;