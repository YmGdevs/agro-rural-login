import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users, 
  UserPlus, 
  Map, 
  CreditCard, 
  BookOpen, 
  BarChart3
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  console.log("Dashboard component rendering, user:", user);

  const actionButtons = [
    { title: "Registar Produtor", icon: UserPlus, description: "Novo cadastro" },
    { title: "Ver Produtores", icon: Users, description: "Lista completa" },
    { title: "Mapear Parcela", icon: Map, description: "Localização GPS" },
    { title: "Pedir Empréstimo", icon: CreditCard, description: "Solicitar crédito" },
    { title: "Ver Recursos", icon: BookOpen, description: "Materiais" },
    { title: "Relatórios", icon: BarChart3, description: "Estatísticas" },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-green-50">
        <AppSidebar />
        
        <main className="flex-1">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-100">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4" />
              <div className="flex-1 text-center">
                <p className="text-xl font-medium text-gray-900">Olá, {user?.email}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Weather Card */}
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg border-0 mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">🌤️</div>
                    <div>
                      <p className="text-white/80 text-sm">Thursday</p>
                      <p className="text-3xl font-light">24°C</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-white/80 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span>💨</span>
                      <span>53 km/h</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>🌡️</span>
                      <span>15° / 24°</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>💧</span>
                      <span>45%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {actionButtons.map((button, index) => (
                <Card 
                  key={index} 
                  className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    if (button.title === "Registar Produtor") {
                      navigate("/register-producer");
                    } else if (button.title === "Ver Produtores") {
                      navigate("/producers");
                    } else if (button.title === "Mapear Parcela") {
                      navigate("/demarcate-area");
                    } else if (button.title === "Pedir Empréstimo") {
                      navigate("/loan-request");
                    }
                  }}
                >
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                      <button.icon className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                      {button.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {button.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Status Card */}
            <Card className="bg-white rounded-2xl shadow-sm border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Estado da Sincronização</h3>
                    <p className="text-sm text-gray-500">Última sincronização: há 2 horas</p>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;