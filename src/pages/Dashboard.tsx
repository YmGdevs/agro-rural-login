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
  Calendar
} from "lucide-react";

const Dashboard = () => {
  const userName = "João Silva"; // Mock user name

  const summaryData = [
    { title: "Produtores Registados", value: "127", icon: Users },
    { title: "Parcelas Mapeadas", value: "89", icon: MapPin },
    { title: "Visitas Concluídas", value: "45", icon: CheckCircle },
  ];

  const actionButtons = [
    { title: "Registar Produtor", icon: UserPlus, color: "bg-green-600" },
    { title: "Mapear Parcela", icon: Map, color: "bg-blue-600" },
    { title: "Iniciar Visita", icon: PlayCircle, color: "bg-orange-600" },
    { title: "Ver Recursos", icon: BookOpen, color: "bg-purple-600" },
    { title: "Relatórios", icon: BarChart3, color: "bg-indigo-600" },
    { title: "Sincronizar Dados", icon: RefreshCw, color: "bg-teal-600" },
  ];

  const navigationItems = [
    { title: "Início", icon: Home, active: true },
    { title: "Produtores", icon: Users, active: false },
    { title: "Visitas", icon: Calendar, active: false },
    { title: "Recursos", icon: BookOpen, active: false },
    { title: "Perfil", icon: User, active: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Olá, {userName}!</h1>
            <p className="text-green-100 mt-1">Bem-vindo ao seu painel de extensão</p>
          </div>
          <div className="bg-white/20 p-3 rounded-full">
            <User className="h-8 w-8" />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">Resumo</h2>
          <div className="grid grid-cols-3 gap-3">
            {summaryData.map((item, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-20 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl shadow-sm flex flex-col items-center justify-center p-3 space-y-1"
              >
                <item.icon className="h-5 w-5 text-green-600" />
                <span className="text-xl font-bold text-gray-900">{item.value}</span>
                <span className="text-xs text-gray-600 text-center leading-tight">
                  {item.title}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-2 gap-4">
            {actionButtons.map((button, index) => (
              <Button
                key={index}
                className={`${button.color} hover:opacity-90 text-white p-6 h-auto flex-col space-y-2 rounded-2xl shadow-lg border-0`}
              >
                <button.icon className="h-8 w-8" />
                <span className="text-sm font-medium text-center leading-tight">
                  {button.title}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Offline Indicator */}
        <div className="bg-amber-100 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-amber-800 font-medium">
              App disponível offline
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-5 py-2">
          {navigationItems.map((item, index) => (
            <button
              key={index}
              className={`flex flex-col items-center py-3 px-1 ${
                item.active 
                  ? 'text-green-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <item.icon className={`h-5 w-5 ${item.active ? 'text-green-600' : ''}`} />
              <span className="text-xs mt-1 font-medium">{item.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;