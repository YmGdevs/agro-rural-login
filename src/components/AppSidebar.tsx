import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Filter,
  Search,
  LogOut,
  Home,
  Users,
  BarChart3,
  BookOpen,
  User,
  Settings,
  Shield,
  Building2,
  DollarSign,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const navigationItems = [
  { title: "Início", icon: Home, url: "/dashboard", active: true },
  { title: "Produtores", icon: Users, url: "/producers", active: false },
  { title: "Métricas", icon: BarChart3, url: "/metrics", active: false },
  { title: "Recursos", icon: BookOpen, url: "/resources", active: false },
  { title: "Perfil", icon: User, url: "/profile", active: false },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const { role, hasBackofficeAccess, isAdmin, isEmpresaFomentadora, isExtensionista } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Role-based navigation items
  const getNavigationItems = () => {
    // Empresa fomentadora has different navigation
    if (isEmpresaFomentadora) {
      return [
        { title: "Home", icon: Home, url: "/empresa-fomentadora" },
        { title: "Pedidos de Empréstimo", icon: DollarSign, url: "/loan-request" },
        { title: "Aprovar Empréstimos", icon: Shield, url: "/empresa-fomentadora" },
      ];
    }

    const baseItems = [
      { title: "Home", icon: Home, url: "/dashboard" },
      { title: "Produtores", icon: Users, url: "/producers" },
    ];

    const backofficeItems = hasBackofficeAccess ? [
      { title: "Backoffice", icon: BarChart3, url: "/backoffice" },
      { title: "Extensionistas", icon: Users, url: "/extensionistas" },
    ] : [];

    const adminItems = isAdmin ? [
      { title: "Utilizadores", icon: Shield, url: "/user-management" },
    ] : [];

    return [...baseItems, ...backofficeItems, ...adminItems];
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Até breve!",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer logout",
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-600 font-medium">
            {!collapsed && "Menu Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {/* Navigation Items */}
              {getNavigationItems().map((item) => (
                <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className="rounded-xl text-gray-600 hover:bg-gray-100"
                  >
                    <button
                      onClick={() => navigate(item.url)}
                      className="flex items-center w-full p-3"
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span className="ml-3">{item.title}</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-600 font-medium">
            {!collapsed && "Ações"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {/* Filter Button */}
              <SidebarMenuItem>
                <SidebarMenuButton className="rounded-xl text-gray-600 hover:bg-gray-100">
                  <div className="flex items-center w-full p-3">
                    <Filter className="h-5 w-5" />
                    {!collapsed && <span className="ml-3">Filtros</span>}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Search Button */}
              <SidebarMenuItem>
                <SidebarMenuButton className="rounded-xl text-gray-600 hover:bg-gray-100">
                  <div className="flex items-center w-full p-3">
                    <Search className="h-5 w-5" />
                    {!collapsed && <span className="ml-3">Pesquisar</span>}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Logout Button */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="rounded-xl text-red-600 hover:bg-red-50"
                  onClick={handleSignOut}
                >
                  <div className="flex items-center w-full p-3">
                    <LogOut className="h-5 w-5" />
                    {!collapsed && <span className="ml-3">Sair</span>}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}