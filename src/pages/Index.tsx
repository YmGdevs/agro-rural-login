import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

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
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(/lovable-uploads/2d8c6398-3bb5-46f5-9611-6de474cbb744.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="max-w-2xl mx-auto text-center relative z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-8 shadow-xl">
          <h1 className="text-4xl font-bold text-green-800 mb-4">
            MilAgre
          </h1>
          <h2 className="text-xl text-gray-600 mb-6">
            Sistema de Gestão Agrícola
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            Bem-vindo ao sistema integrado de gestão agrícola. 
            Gerencie produtores, demarque áreas e acompanhe o desenvolvimento rural.
          </p>
          <Button 
            onClick={() => navigate("/auth")} 
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 text-lg"
          >
            Aceder ao Sistema
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
