import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, Users, MapPin } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-4xl font-bold text-green-800 mb-4">
              MilAgre
            </CardTitle>
            <CardDescription className="text-xl text-gray-600">
              Sistema de Gestão Agrícola
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg text-gray-700 leading-relaxed">
              Bem-vindo ao sistema integrado de gestão agrícola. 
              Gerencie produtores, demarque áreas e acompanhe o desenvolvimento rural.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
                <Users className="h-12 w-12 text-green-600 mb-3" />
                <h3 className="font-semibold text-green-800">Gestão de Produtores</h3>
                <p className="text-sm text-gray-600 text-center mt-2">
                  Registe e acompanhe produtores rurais
                </p>
              </div>
              
              <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
                <MapPin className="h-12 w-12 text-blue-600 mb-3" />
                <h3 className="font-semibold text-blue-800">Demarcação de Áreas</h3>
                <p className="text-sm text-gray-600 text-center mt-2">
                  Delimite e gira áreas agrícolas
                </p>
              </div>
              
              <div className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg">
                <LogIn className="h-12 w-12 text-yellow-600 mb-3" />
                <h3 className="font-semibold text-yellow-800">Acesso Seguro</h3>
                <p className="text-sm text-gray-600 text-center mt-2">
                  Sistema protegido por autenticação
                </p>
              </div>
            </div>
            
            <div className="mt-8">
              <Button 
                onClick={() => navigate("/auth")} 
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 text-lg"
              >
                Aceder ao Sistema
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
