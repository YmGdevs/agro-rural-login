import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Play, Square, RotateCcw, Save, Loader2, ArrowLeft } from "lucide-react";
import { Loader } from "@googlemaps/js-api-loader";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";

interface GpsPoint {
  id: string;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: Date;
}

interface Producer {
  id: string;
  nome_completo: string;
}

type DemarcationMode = "manual" | "walking";

const DemarcateArea: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<DemarcationMode>("manual");
  const [points, setPoints] = useState<GpsPoint[]>([]);
  const [isWalking, setIsWalking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [selectedProducer, setSelectedProducer] = useState<string>("");
  const [parcelaName, setParcelaName] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    initializeGoogleMaps();
    loadProducers();
    
    // Auto-select producer if passed in URL
    const producerIdFromUrl = searchParams.get('producerId');
    if (producerIdFromUrl) {
      setSelectedProducer(producerIdFromUrl);
    }
  }, [searchParams]);

  const loadProducers = async () => {
    try {
      const { data, error } = await supabase
        .from('producers')
        .select('id, nome_completo')
        .order('nome_completo');
      
      if (error) throw error;
      setProducers(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtores:', error);
      toast.error('Erro ao carregar lista de produtores');
    }
  };

  // Calculate area using shoelace formula
  const calculateArea = (coordinates: GpsPoint[]) => {
    if (coordinates.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < coordinates.length; i++) {
      const j = (i + 1) % coordinates.length;
      area += coordinates[i].lat * coordinates[j].lng;
      area -= coordinates[j].lat * coordinates[i].lng;
    }
    
    area = Math.abs(area) / 2;
    // Convert to square meters (approximate)
    return area * 111320 * 111320 * Math.cos((coordinates[0].lat * Math.PI) / 180);
  };

  const calculatePerimeter = (coordinates: GpsPoint[]) => {
    if (coordinates.length < 2) return 0;
    
    let perimeter = 0;
    for (let i = 0; i < coordinates.length; i++) {
      const j = (i + 1) % coordinates.length;
      const R = 6371000; // Earth radius in meters
      const dLat = (coordinates[j].lat - coordinates[i].lat) * Math.PI / 180;
      const dLon = (coordinates[j].lng - coordinates[i].lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(coordinates[i].lat * Math.PI / 180) * Math.cos(coordinates[j].lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      perimeter += R * c;
    }
    return perimeter;
  };

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalização não suportada"));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });
  };

  const addPoint = async (lat?: number, lng?: number): Promise<void> => {
    try {
      let position;
      if (lat && lng) {
        position = { coords: { latitude: lat, longitude: lng, accuracy: 5 } };
      } else {
        position = await getCurrentPosition();
      }

      const newPoint: GpsPoint = {
        id: Date.now().toString(),
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy || 0,
        timestamp: new Date()
      };

      setPoints(prev => [...prev, newPoint]);
      updateMapDisplay();
      toast.success(`Ponto ${points.length + 1} adicionado`);
    } catch (error) {
      toast.error("Erro ao capturar localização");
      console.error(error);
    }
  };

  const toggleWalkingMode = (): void => {
    if (isWalking) {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setIsWalking(false);
      toast.info("Modo caminhada parado");
    } else {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const newPoint: GpsPoint = {
            id: Date.now().toString(),
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy || 0,
            timestamp: new Date()
          };
          setPoints(prev => [...prev, newPoint]);
          updateMapDisplay();
        },
        (error) => console.error(error),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
      setWatchId(id);
      setIsWalking(true);
      toast.success("Modo caminhada iniciado");
    }
  };

  const removeLastPoint = (): void => {
    if (points.length > 0) {
      setPoints(prev => prev.slice(0, -1));
      updateMapDisplay();
      toast.info("Último ponto removido");
    }
  };

  const clearAllPoints = (): void => {
    setPoints([]);
    updateMapDisplay();
    toast.info("Todos os pontos limpos");
  };

  const saveDemarcation = async () => {
    if (!selectedProducer) {
      toast.error("Selecione um produtor antes de salvar");
      return;
    }

    if (!parcelaName.trim()) {
      toast.error("Digite um nome para a parcela");
      return;
    }

    if (points.length < 3) {
      toast.error("É necessário pelo menos 3 pontos para definir uma área");
      return;
    }

    setIsSaving(true);
    try {
      const area = calculateArea(points);
      const perimeter = calculatePerimeter(points);
      
      const { error } = await supabase
        .from('parcelas')
        .insert({
          nome: parcelaName,
          produtor_id: selectedProducer,
          coordenadas: JSON.stringify(points),
          area_metros_quadrados: area,
          perimetro_metros: perimeter
        });

      if (error) throw error;

      toast.success("Parcela salva com sucesso!");
      
      // Navigate back to producer profile if coming from there
      const producerIdFromUrl = searchParams.get('producerId');
      if (producerIdFromUrl) {
        navigate(`/producer/${producerIdFromUrl}/parcelas`);
        return;
      }
      
      // Reset form if not coming from producer profile
      setPoints([]);
      setParcelaName("");
      setSelectedProducer("");
      updateMapDisplay();
      
    } catch (error) {
      console.error('Erro ao salvar parcela:', error);
      toast.error('Erro ao salvar parcela');
    } finally {
      setIsSaving(false);
    }
  };

  const initializeGoogleMaps = async (): Promise<void> => {
    try {
      const position = await getCurrentPosition();
      const center = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      // For demonstration, we'll use a simple map without Google Maps API
      // In production, you would use the Google Maps API
      setIsLoading(false);
      toast.success("Localização obtida com sucesso");
    } catch (error) {
      console.error("Erro ao obter localização:", error);
      setIsLoading(false);
      toast.error("Erro ao obter localização GPS");
    }
  };

  const updateMapDisplay = (): void => {
    // This would update the map markers and polygons
    // Implementation depends on your map library
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  const area = calculateArea(points);
  const perimeter = calculatePerimeter(points);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Demarcar Parcela</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Configuração da Parcela</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Producer Selection */}
            <div className="space-y-2">
              <Label htmlFor="producer">Selecionar Produtor</Label>
              <Select value={selectedProducer} onValueChange={setSelectedProducer}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um produtor" />
                </SelectTrigger>
                <SelectContent>
                  {producers.map((producer) => (
                    <SelectItem key={producer.id} value={producer.id}>
                      {producer.nome_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {searchParams.get('producerId') && (
                <p className="text-sm text-muted-foreground">
                  Produtor pré-selecionado do perfil
                </p>
              )}
            </div>

            {/* Plot Name */}
            <div className="space-y-2">
              <Label htmlFor="parcela-name">Nome da Parcela</Label>
              <Input
                id="parcela-name"
                value={parcelaName}
                onChange={(e) => setParcelaName(e.target.value)}
                placeholder="Digite o nome da parcela"
              />
            </div>

            {/* Mode Selection */}
            <div className="flex gap-2">
              <Button
                variant={mode === "manual" ? "default" : "outline"}
                onClick={() => setMode("manual")}
                className="flex-1"
                disabled={!selectedProducer}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Manual
              </Button>
              <Button
                variant={mode === "walking" ? "default" : "outline"}
                onClick={() => setMode("walking")}
                className="flex-1"
                disabled={!selectedProducer}
              >
                <Play className="mr-2 h-4 w-4" />
                Caminhada
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{points.length}</div>
                <div className="text-sm text-muted-foreground">Pontos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {(area / 10000).toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Hectares</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {(perimeter / 1000).toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Km</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={mode === "manual" ? () => addPoint() : toggleWalkingMode}
                disabled={!selectedProducer}
                className="flex-1"
              >
                {mode === "manual" ? (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Adicionar Ponto
                  </>
                ) : isWalking ? (
                  <>
                    <Square className="mr-2 h-4 w-4" />
                    Parar
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Iniciar
                  </>
                )}
              </Button>
              
              <Button variant="outline" onClick={removeLastPoint} disabled={points.length === 0}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Desfazer
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={clearAllPoints} disabled={points.length === 0}>
                Limpar Tudo
              </Button>
              <Button 
                onClick={saveDemarcation} 
                disabled={points.length < 3 || !selectedProducer || !parcelaName.trim() || isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar Parcela
              </Button>
            </div>

            {/* Points List */}
            {points.length > 0 && (
              <div className="space-y-2">
                <Label>Pontos Capturados</Label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {points.map((point, index) => (
                    <div key={point.id} className="flex justify-between items-center text-sm bg-muted p-2 rounded">
                      <span>Ponto {index + 1}</span>
                      <Badge variant="secondary">
                        {point.accuracy.toFixed(1)}m
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Instruções:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Selecione primeiro um produtor e dê um nome à parcela</li>
                <li>• Use modo Manual para adicionar pontos manualmente</li>
                <li>• Use modo Caminhada para capturar pontos automaticamente</li>
                <li>• São necessários pelo menos 3 pontos para formar uma área</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DemarcateArea;