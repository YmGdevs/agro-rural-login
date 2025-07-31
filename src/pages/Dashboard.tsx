import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  MapPin, 
  CheckCircle, 
  UserPlus, 
  Map, 
  PlayCircle, 
  BookOpen, 
  BarChart3, 
  RefreshCw,
  Home,
  User,
  Calendar,
  Filter,
  Search
} from "lucide-react";

const Dashboard = () => {
  const userName = "João Silva"; // Mock user name

  const summaryData = [
    { title: "Produtores", value: "127", icon: Users },
    { title: "Parcelas", value: "89", icon: MapPin },
    { title: "Visitas", value: "45", icon: CheckCircle },
  ];

  const actionButtons = [
    { title: "Registar Produtor", icon: UserPlus, description: "Novo cadastro" },
    { title: "Mapear Parcela", icon: Map, description: "Localização GPS" },
    { title: "Iniciar Visita", icon: PlayCircle, description: "Acompanhamento" },
    { title: "Ver Recursos", icon: BookOpen, description: "Materiais" },
    { title: "Relatórios", icon: BarChart3, description: "Estatísticas" },
    { title: "Sincronizar", icon: RefreshCw, description: "Dados offline" },
  ];

  const navigationItems = [
    { title: "Início", icon: Home, active: true },
    { title: "Produtores", icon: Users, active: false },
    { title: "Visitas", icon: Calendar, active: false },
    { title: "Recursos", icon: BookOpen, active: false },
    { title: "Perfil", icon: User, active: false },
  ];

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex space-x-3">
            <Button variant="ghost" size="icon" className="rounded-full bg-gray-100">
              <Filter className="h-5 w-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full bg-gray-100">
              <Search className="h-5 w-5 text-gray-600" />
            </Button>
          </div>
        </div>
        
        <div className="text-center mb-4">
          <p className="text-gray-600">Olá, {userName}</p>
        </div>
      </div>

      <div className="px-6 pb-24">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {summaryData.map((item, index) => (
            <Card key={index} className="bg-white rounded-2xl shadow-sm border-0">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <item.icon className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{item.value}</p>
                <p className="text-xs text-gray-500">{item.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-4">
          {actionButtons.map((button, index) => (
            <Card key={index} className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden">
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
        <Card className="bg-white rounded-2xl shadow-sm border-0 mt-6">
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

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100">
        <div className="grid grid-cols-5 py-2">
          {navigationItems.map((item, index) => (
            <button
              key={index}
              className={`flex flex-col items-center py-3 px-1 ${
                item.active 
                  ? 'text-green-600' 
                  : 'text-gray-400'
              }`}
            >
              <item.icon className={`h-5 w-5 mb-1 ${item.active ? 'text-green-600' : 'text-gray-400'}`} />
              <span className="text-xs font-medium">{item.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;