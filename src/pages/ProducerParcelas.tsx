import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Parcela {
  id: string;
  nome: string;
  area_metros_quadrados: number;
  perimetro_metros: number;
  created_at: string;
}

interface Producer {
  id: string;
  nome_completo: string;
  genero: string;
  idade: number;
  nuit: string;
  created_at: string;
}

const ProducerParcelas: React.FC = () => {
  const { producerId } = useParams<{ producerId: string }>();
  const navigate = useNavigate();
  const [producer, setProducer] = useState<Producer | null>(null);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (producerId) {
      loadProducerData();
    }
  }, [producerId]);

  const loadProducerData = async () => {
    try {
      setIsLoading(true);

      // Load producer info
      const { data: producerData, error: producerError } = await supabase
        .from('producers')
        .select('id, nome_completo, genero, idade, nuit, created_at')
        .eq('id', producerId)
        .single();

      if (producerError) throw producerError;
      setProducer(producerData);

      // Load producer's parcelas
      const { data: parcelasData, error: parcelasError } = await supabase
        .from('parcelas')
        .select('id, nome, area_metros_quadrados, perimetro_metros, created_at')
        .eq('produtor_id', producerId)
        .order('created_at', { ascending: false });

      if (parcelasError) throw parcelasError;
      setParcelas(parcelasData || []);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar parcelas do produtor');
    } finally {
      setIsLoading(false);
    }
  };

  const formatArea = (area: number) => {
    if (area >= 10000) {
      return `${(area / 10000).toFixed(2)} ha`;
    }
    return `${area.toFixed(0)} m²`;
  };

  const formatDistance = (distance: number) => {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(2)} km`;
    }
    return `${distance.toFixed(0)} m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!producer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Produtor não encontrado</p>
          <Button onClick={() => navigate("/producers")}>
            Voltar à Lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/producers")}
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Perfil do Produtor</h1>
          </div>
        </div>

        {/* Producer Profile */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{producer.nome_completo}</span>
              <Button onClick={() => navigate("/demarcate-area")}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Parcela
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Género</p>
                <p className="font-medium capitalize">{producer.genero}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Idade</p>
                <p className="font-medium">{producer.idade} anos</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">NUIT</p>
                <p className="font-mono font-medium">{producer.nuit}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Registo</p>
                <p className="font-medium">{formatDate(producer.created_at)}</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">Parcelas Registadas</p>
              <p className="text-lg font-semibold">{parcelas.length} parcela{parcelas.length !== 1 ? 's' : ''}</p>
            </div>
          </CardContent>
        </Card>

        {/* Parcelas List */}
        {parcelas.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma parcela encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Este produtor ainda não tem parcelas demarcadas.
              </p>
              <Button onClick={() => navigate("/demarcate-area")}>
                <Plus className="mr-2 h-4 w-4" />
                Demarcar Primeira Parcela
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {parcelas.map((parcela) => (
              <Card key={parcela.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{parcela.nome}</span>
                    <Badge variant="secondary">
                      {new Date(parcela.created_at).toLocaleDateString('pt-BR')}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Área</p>
                      <p className="text-lg font-semibold">
                        {formatArea(parcela.area_metros_quadrados)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Perímetro</p>
                      <p className="text-lg font-semibold">
                        {formatDistance(parcela.perimetro_metros)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProducerParcelas;