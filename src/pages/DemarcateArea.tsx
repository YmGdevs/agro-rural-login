import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { MapPin, RotateCcw, Save, Loader2, ArrowLeft, Clock, Target } from "lucide-react";
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

const DemarcateArea: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [points, setPoints] = useState<GpsPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [producerName, setProducerName] = useState<string>("");
  const [selectedProducer, setSelectedProducer] = useState<string>("");
  const [parcelaName, setParcelaName] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [currentGpsAccuracy, setCurrentGpsAccuracy] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"unknown" | "available" | "unavailable">("unknown");

  useEffect(() => {
    console.log("DemarcateArea: useEffect triggered");
    
    const initialize = async () => {
      try {
        await loadProducer();
        
        // Auto-select producer if passed in URL
        const producerIdFromUrl = searchParams.get('producerId');
        if (producerIdFromUrl) {
          setSelectedProducer(producerIdFromUrl);
        }
        
        // Check GPS availability
        await checkGpsAvailability();
        
        setIsLoading(false);
        console.log("DemarcateArea: Initialization completed successfully");
      } catch (error) {
        console.error("Error during initialization:", error);
        setIsLoading(false);
        toast.error("Erro ao carregar página");
      }
    };
    
    initialize();
  }, [searchParams]);

  const checkGpsAvailability = async () => {
    if (!navigator.geolocation) {
      setGpsStatus("unavailable");
      return;
    }

    try {
      const position = await getCurrentPosition();
      setCurrentGpsAccuracy(position.coords.accuracy);
      setGpsStatus("available");
      toast.success("GPS disponível e funcionando");
    } catch (error) {
      setGpsStatus("unavailable");
      toast.error("GPS não disponível ou permissão negada");
    }
  };

  const loadProducer = async (): Promise<void> => {
    console.log("DemarcateArea: Loading producer");
    const producerIdFromUrl = searchParams.get('producerId');
    if (!producerIdFromUrl) {
      throw new Error("Producer ID not found in URL");
    }

    try {
      const { data, error } = await supabase
        .from('producers')
        .select('id, nome_completo')
        .eq('id', producerIdFromUrl)
        .single();
      
      if (error) throw error;
      if (data) {
        setProducerName(data.nome_completo);
        setSelectedProducer(data.id);
      }
      console.log("DemarcateArea: Producer loaded successfully", data?.nome_completo);
    } catch (error) {
      console.error('Erro ao carregar produtor:', error);
      toast.error('Erro ao carregar dados do produtor');
      throw error;
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

  const addPoint = async (): Promise<void> => {
    try {
      const position = await getCurrentPosition();

      const newPoint: GpsPoint = {
        id: Date.now().toString(),
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy || 0,
        timestamp: new Date()
      };

      setPoints(prev => [...prev, newPoint]);
      setCurrentGpsAccuracy(position.coords.accuracy);
      toast.success(`Ponto ${points.length + 1} adicionado`);
    } catch (error) {
      toast.error("Erro ao capturar localização");
      console.error(error);
    }
  };


  const removeLastPoint = (): void => {
    if (points.length > 0) {
      const newPoints = points.slice(0, -1);
      setPoints(newPoints);
      toast.info("Último ponto removido");
    }
  };

  const clearAllPoints = (): void => {
    setPoints([]);
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
      
    } catch (error) {
      console.error('Erro ao salvar parcela:', error);
      toast.error('Erro ao salvar parcela');
    } finally {
      setIsSaving(false);
    }
  };


  const exportToGPX = () => {
    if (points.length === 0) {
      toast.error("Nenhum ponto para exportar");
      return;
    }

    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Demarcação de Áreas">
  <trk>
    <name>${parcelaName || 'Parcela'}</name>
    <trkseg>
      ${points.map(point => `
      <trkpt lat="${point.lat}" lon="${point.lng}">
        <time>${point.timestamp.toISOString()}</time>
      </trkpt>`).join('')}
    </trkseg>
  </trk>
</gpx>`;

    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${parcelaName || 'parcela'}_track.gpx`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Arquivo GPX exportado");
  };

  const exportToKML = () => {
    if (points.length === 0) {
      toast.error("Nenhum ponto para exportar");
      return;
    }

    const coordinates = points.map(point => `${point.lng},${point.lat},0`).join(' ');
    
    const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${parcelaName || 'Parcela'}</name>
    <Placemark>
      <name>Área Demarcada</name>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${coordinates} ${points[0].lng},${points[0].lat},0</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`;

    const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${parcelaName || 'parcela'}_area.kml`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Arquivo KML exportado");
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
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
                className="mr-3"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle>Configuração da Parcela</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Producer Label */}
              <div className="space-y-2">
                <Label>Produtor</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <span className="font-medium">{producerName || "Carregando..."}</span>
                </div>
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


              {/* Stats - Only show when points are captured */}
              {points.length > 0 && (
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
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={addPoint}
                  disabled={!selectedProducer || gpsStatus !== "available"}
                  className="flex-1"
                  size="lg"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Capturar Ponto
                </Button>
                
                <Button variant="outline" onClick={removeLastPoint} disabled={points.length === 0} size="lg">
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


            </CardContent>
          </Card>

          {/* Coordinates Panel - Only show when points are captured */}
          {points.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Coordenadas GPS Capturadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {points.map((point, index) => (
                      <div key={point.id} className="bg-muted p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">Ponto {index + 1}</span>
                          <Badge variant="secondary">
                            <Target className="h-3 w-3 mr-1" />
                            {point.accuracy.toFixed(1)}m
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Latitude:</span>
                            <span className="font-mono">{point.lat.toFixed(8)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Longitude:</span>
                            <span className="font-mono">{point.lng.toFixed(8)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Horário:</span>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {point.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {points.length >= 3 && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">Área Calculada</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-green-600">Área:</span>
                          <span className="font-medium ml-2">{(area / 10000).toFixed(4)} ha</span>
                        </div>
                        <div>
                          <span className="text-green-600">Perímetro:</span>
                          <span className="font-medium ml-2">{(perimeter / 1000).toFixed(3)} km</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemarcateArea;