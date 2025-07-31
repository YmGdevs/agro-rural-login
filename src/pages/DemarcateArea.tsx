import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Play, Square, RotateCcw, Save, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader } from "@googlemaps/js-api-loader";

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
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [selectedProducer, setSelectedProducer] = useState<string>("");
  const [parcelaName, setParcelaName] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polygonRef = useRef<google.maps.Polygon | null>(null);

  useEffect(() => {
    console.log("DemarcateArea: useEffect triggered");
    const initialize = async () => {
      try {
        await Promise.all([
          initializeGoogleMaps(),
          loadProducers()
        ]);
        
        // Auto-select producer if passed in URL
        const producerIdFromUrl = searchParams.get('producerId');
        if (producerIdFromUrl) {
          setSelectedProducer(producerIdFromUrl);
        }
        
        // Set loading to false only after everything is successful
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

  const loadProducers = async (): Promise<void> => {
    console.log("DemarcateArea: Loading producers");
    try {
      const { data, error } = await supabase
        .from('producers')
        .select('id, nome_completo')
        .order('nome_completo');
      
      if (error) throw error;
      setProducers(data || []);
      console.log("DemarcateArea: Producers loaded successfully", data?.length);
    } catch (error) {
      console.error('Erro ao carregar produtores:', error);
      toast.error('Erro ao carregar lista de produtores');
      throw error; // Re-throw to be caught by the Promise.all
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
      updateMapDisplay([...points, newPoint]);
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
          setPoints(prev => {
            const newPoints = [...prev, newPoint];
            updateMapDisplay(newPoints);
            return newPoints;
          });
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
      const newPoints = points.slice(0, -1);
      setPoints(newPoints);
      updateMapDisplay(newPoints);
      toast.info("Último ponto removido");
    }
  };

  const clearAllPoints = (): void => {
    setPoints([]);
    updateMapDisplay([]);
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
      updateMapDisplay([]);
      
    } catch (error) {
      console.error('Erro ao salvar parcela:', error);
      toast.error('Erro ao salvar parcela');
    } finally {
      setIsSaving(false);
    }
  };

  const initializeGoogleMaps = async (): Promise<void> => {
    console.log("DemarcateArea: Initializing Google Maps");
    try {
      if (!mapContainer.current) {
        console.log("DemarcateArea: No map container found");
        throw new Error("Map container not available");
      }

      // Get Google Maps API key from Supabase Edge Function
      const { data: keyData, error: keyError } = await supabase.functions.invoke('get-maps-key');
      if (keyError || !keyData?.apiKey) {
        throw new Error('Failed to get Google Maps API key');
      }

      // Initialize Google Maps Loader
      const loader = new Loader({
        apiKey: keyData.apiKey,
        version: "weekly",
        libraries: ["places"]
      });

      await loader.load();
      console.log("DemarcateArea: Google Maps loaded");

      // Get user's current location
      console.log("DemarcateArea: Getting user location");
      const position = await getCurrentPosition();
      const center = { lat: position.coords.latitude, lng: position.coords.longitude };
      console.log("DemarcateArea: User location obtained", center);

      // Initialize map
      const mapInstance = new google.maps.Map(mapContainer.current, {
        center: center,
        zoom: 18,
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true
      });

      // Add click handler for manual point addition
      mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (mode === 'manual' && selectedProducer && e.latLng) {
          addPoint(e.latLng.lat(), e.latLng.lng());
        }
      });

      setMap(mapInstance);
      console.log("DemarcateArea: Google Maps initialized successfully");
      toast.success("Mapa carregado com sucesso");
    } catch (error) {
      console.error("DemarcateArea: Error initializing Google Maps:", error);
      toast.error("Erro ao carregar mapa");
      throw error; // Re-throw to be caught by the Promise.all
    }
  };

  const updateMapDisplay = (currentPoints: GpsPoint[] = points): void => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Remove existing polygon
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }

    // Add markers for each point
    currentPoints.forEach((point, index) => {
      const marker = new google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map: map,
        title: `Ponto ${index + 1}`,
        label: {
          text: (index + 1).toString(),
          color: 'white',
          fontWeight: 'bold'
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#10b981',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
          scale: 10
        }
      });

      markersRef.current.push(marker);
    });

    // Create polygon if we have at least 3 points
    if (currentPoints.length >= 3) {
      const coordinates = currentPoints.map(point => ({ lat: point.lat, lng: point.lng }));

      const polygon = new google.maps.Polygon({
        paths: coordinates,
        strokeColor: '#10b981',
        strokeOpacity: 1.0,
        strokeWeight: 2,
        fillColor: '#10b981',
        fillOpacity: 0.3
      });

      polygon.setMap(map);
      polygonRef.current = polygon;
    }

    // Fit map to points if we have any
    if (currentPoints.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      currentPoints.forEach(point => {
        bounds.extend({ lat: point.lat, lng: point.lng });
      });
      map.fitBounds(bounds);
      
      // Ensure minimum zoom level
      const listener = google.maps.event.addListener(map, "idle", () => {
        if (map.getZoom()! > 20) map.setZoom(20);
        google.maps.event.removeListener(listener);
      });
    }
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

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <Card>
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
                  <li>• Use modo Manual para adicionar pontos clicando no mapa</li>
                  <li>• Use modo Caminhada para capturar pontos automaticamente</li>
                  <li>• São necessários pelo menos 3 pontos para formar uma área</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Map Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Mapa Interativo - Google Maps</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div 
                ref={mapContainer} 
                className="w-full h-[600px] rounded-lg"
                style={{ minHeight: '600px' }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DemarcateArea;