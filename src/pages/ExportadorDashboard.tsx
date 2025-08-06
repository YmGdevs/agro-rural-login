import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import CertificateRequestForm from "@/components/CertificateRequestForm";
import { CertificatePreview } from "@/components/CertificatePreview";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  Clock, 
  X, 
  Plus,
  Award,
  Building2,
  Package,
  Eye
} from "lucide-react";

interface Exporter {
  id: string;
  company_name: string;
  company_nuit: string;
  contact_email: string;
  contact_phone: string;
  export_products: string[];
  company_address: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  created_at: string;
}

interface ExportDocument {
  id: string;
  document_type: string;
  document_name: string;
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  upload_date: string;
  review_comments?: string;
}

interface ExportApplication {
  id: string;
  application_type: 'certification' | 'renewal';
  products: string[];
  destination_country: string;
  quantity_kg?: number;
  estimated_value?: number;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'expired';
  submitted_at: string;
  review_comments?: string;
}

interface ExportCertificate {
  id: string;
  certificate_number: string;
  exporter_name: string;
  product_name: string;
  quantity: number;
  destination_country: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  certificate_pdf_url?: string;
  export_applications?: {
    destination_country: string;
    products: string[];
    quantity_kg?: number;
  };
}

export default function ExportadorDashboard() {
  const { user } = useAuth();
  const [exporter, setExporter] = useState<Exporter | null>(null);
  const [documents, setDocuments] = useState<ExportDocument[]>([]);
  const [applications, setApplications] = useState<ExportApplication[]>([]);
  const [certificates, setCertificates] = useState<ExportCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewApplication, setShowNewApplication] = useState(false);
  const [showCertificateRequest, setShowCertificateRequest] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<ExportCertificate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [newApplication, setNewApplication] = useState({
    products: [] as string[],
    destination_country: '',
    quantity_kg: '',
    estimated_value: ''
  });

  const [newDocument, setNewDocument] = useState({
    document_type: '',
    document_name: '',
    file: null as File | null
  });

  useEffect(() => {
    if (user) {
      fetchExporterData();
    }
  }, [user]);

  const fetchExporterData = async () => {
    try {
      // Fetch exporter profile
      const { data: exporterData, error: exporterError } = await supabase
        .from('exporters')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (exporterError && exporterError.code !== 'PGRST116') {
        console.error('Error fetching exporter:', exporterError);
        return;
      }

      setExporter(exporterData as any);

      if (exporterData) {
        // Fetch documents
        const { data: docsData } = await supabase
          .from('export_documents')
          .select('*')
          .eq('exporter_id', exporterData.id)
          .order('upload_date', { ascending: false });

        setDocuments(docsData as any || []);

        // Fetch applications
        const { data: appsData } = await supabase
          .from('export_applications')
          .select('*')
          .eq('exporter_id', exporterData.id)
          .order('submitted_at', { ascending: false });

        setApplications(appsData as any || []);

        // Fetch certificates
        const { data: certsData } = await supabase
          .from('export_certificates')
          .select(`
            *,
            export_applications!inner(
              destination_country,
              products,
              quantity_kg
            )
          `)
          .eq('export_applications.exporter_id', exporterData.id)
          .order('issued_date', { ascending: false });

        setCertificates(certsData as any || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async () => {
    if (!newDocument.file || !newDocument.document_type || !exporter) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = newDocument.file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('export-documents')
        .upload(fileName, newDocument.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('export-documents')
        .getPublicUrl(fileName);

      // Save document record
      const { error: docError } = await supabase
        .from('export_documents')
        .insert({
          exporter_id: exporter.id,
          document_type: newDocument.document_type,
          document_name: newDocument.document_name || newDocument.file.name,
          file_url: publicUrl,
          file_size: newDocument.file.size
        });

      if (docError) throw docError;

      toast.success("Documento enviado com sucesso!");
      setNewDocument({ document_type: '', document_name: '', file: null });
      fetchExporterData();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error("Erro ao enviar documento");
    } finally {
      setUploading(false);
    }
  };

  const submitApplication = async () => {
    if (!newApplication.products.length || !newApplication.destination_country || !exporter) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      const { error } = await supabase
        .from('export_applications')
        .insert({
          exporter_id: exporter.id,
          products: newApplication.products,
          destination_country: newApplication.destination_country,
          quantity_kg: newApplication.quantity_kg ? parseFloat(newApplication.quantity_kg) : null,
          estimated_value: newApplication.estimated_value ? parseFloat(newApplication.estimated_value) : null
        });

      if (error) throw error;

      toast.success("Pedido de certificação submetido com sucesso!");
      setNewApplication({ products: [], destination_country: '', quantity_kg: '', estimated_value: '' });
      setShowNewApplication(false);
      fetchExporterData();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error("Erro ao submeter pedido");
    }
  };

  const handleViewCertificate = (certificate: ExportCertificate) => {
    setSelectedCertificate(certificate);
    setIsPreviewOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", variant: "secondary" as const, icon: Clock },
      approved: { label: "Aprovado", variant: "default" as const, icon: CheckCircle2 },
      rejected: { label: "Rejeitado", variant: "destructive" as const, icon: X },
      under_review: { label: "Em Revisão", variant: "secondary" as const, icon: FileText },
      active: { label: "Ativo", variant: "default" as const, icon: CheckCircle2 },
      expired: { label: "Expirado", variant: "secondary" as const, icon: Clock }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!exporter) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Perfil não encontrado</CardTitle>
            <CardDescription>
              Não foi encontrado um perfil de exportador para este usuário.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard do Exportador</h2>
            <p className="text-muted-foreground">
              Gerencie suas certificações e documentos de exportação
            </p>
          </div>
          {getStatusBadge(exporter.status)}
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="applications">Pedidos</TabsTrigger>
            <TabsTrigger value="certificates">Certificados</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Documentos</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{documents.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {documents.filter(d => d.status === 'pending').length} pendentes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{applications.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {applications.filter(a => a.status === 'pending').length} pendentes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Certificados</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{certificates.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {certificates.filter(c => c.status === 'active').length} ativos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Empresa</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-bold">{exporter.company_name}</div>
                  <p className="text-xs text-muted-foreground">NUIT: {exporter.company_nuit}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Produtos para Exportação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {exporter.export_products.map((product, index) => (
                    <Badge key={index} variant="outline">{product}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Documentos
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Upload className="h-4 w-4 mr-2" />
                        Enviar Documento
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Enviar Novo Documento</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="docType">Tipo de Documento</Label>
                          <Select onValueChange={(value) => setNewDocument({...newDocument, document_type: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="commercial_license">Licença Comercial</SelectItem>
                              <SelectItem value="phytosanitary_certificate">Certificado Fitossanitário</SelectItem>
                              <SelectItem value="company_registration">Registo da Empresa</SelectItem>
                              <SelectItem value="tax_clearance">Certidão de Quitação Fiscal</SelectItem>
                              <SelectItem value="other">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="docName">Nome do Documento</Label>
                          <Input
                            id="docName"
                            value={newDocument.document_name}
                            onChange={(e) => setNewDocument({...newDocument, document_name: e.target.value})}
                            placeholder="Nome do documento"
                          />
                        </div>
                        <div>
                          <Label htmlFor="file">Arquivo</Label>
                          <Input
                            id="file"
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => setNewDocument({...newDocument, file: e.target.files?.[0] || null})}
                          />
                        </div>
                        <Button onClick={uploadDocument} disabled={uploading} className="w-full">
                          {uploading ? "Enviando..." : "Enviar Documento"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{doc.document_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Enviado em {new Date(doc.upload_date).toLocaleDateString('pt-PT')}
                        </p>
                        {doc.review_comments && (
                          <p className="text-sm text-yellow-600 mt-1">{doc.review_comments}</p>
                        )}
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Pedidos de Certificação
                   <div className="flex gap-2">
                     <Dialog open={showCertificateRequest} onOpenChange={setShowCertificateRequest}>
                       <DialogTrigger asChild>
                         <Button>
                           <Award className="h-4 w-4 mr-2" />
                           Pedir Certificado
                         </Button>
                       </DialogTrigger>
                       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                         <DialogHeader>
                           <DialogTitle>Pedido de Certificado de Exportação</DialogTitle>
                         </DialogHeader>
                         <CertificateRequestForm
                           exporterId={exporter.id}
                           onSuccess={() => {
                             setShowCertificateRequest(false);
                             fetchExporterData();
                           }}
                           onCancel={() => setShowCertificateRequest(false)}
                         />
                       </DialogContent>
                     </Dialog>
                     <Dialog open={showNewApplication} onOpenChange={setShowNewApplication}>
                       <DialogTrigger asChild>
                         <Button variant="outline">
                           <Plus className="h-4 w-4 mr-2" />
                           Novo Pedido
                         </Button>
                       </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Novo Pedido de Certificação</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Produtos</Label>
                          <Textarea
                            placeholder="Lista os produtos a exportar (um por linha)"
                            value={newApplication.products.join('\n')}
                            onChange={(e) => setNewApplication({
                              ...newApplication,
                              products: e.target.value.split('\n').filter(p => p.trim())
                            })}
                          />
                        </div>
                        <div>
                          <Label>País de Destino</Label>
                          <Input
                            value={newApplication.destination_country}
                            onChange={(e) => setNewApplication({...newApplication, destination_country: e.target.value})}
                            placeholder="País de destino"
                          />
                        </div>
                        <div>
                          <Label>Quantidade (kg)</Label>
                          <Input
                            type="number"
                            value={newApplication.quantity_kg}
                            onChange={(e) => setNewApplication({...newApplication, quantity_kg: e.target.value})}
                            placeholder="Quantidade em kg"
                          />
                        </div>
                        <div>
                          <Label>Valor Estimado (MZN)</Label>
                          <Input
                            type="number"
                            value={newApplication.estimated_value}
                            onChange={(e) => setNewApplication({...newApplication, estimated_value: e.target.value})}
                            placeholder="Valor estimado"
                          />
                        </div>
                        <Button onClick={submitApplication} className="w-full">
                          Submeter Pedido
                        </Button>
                      </div>
                    </DialogContent>
                   </Dialog>
                   </div>
                 </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">
                          {app.application_type === 'certification' ? 'Certificado de Exportação' : 'Renovação'} - 
                          {app.products?.join(', ') || 'N/A'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {app.destination_country && `Destino: ${app.destination_country} | `}
                          Submetido em {new Date(app.submitted_at).toLocaleDateString('pt-PT')}
                        </p>
                        {(app as any).nuit_holder && (
                          <p className="text-sm text-muted-foreground">
                            Portador NUIT: {(app as any).nuit_holder}
                          </p>
                        )}
                        {(app as any).category && (
                          <p className="text-sm text-muted-foreground">
                            Categoria: {(app as any).category}
                          </p>
                        )}
                        {app.review_comments && (
                          <p className="text-sm text-yellow-600 mt-1">{app.review_comments}</p>
                        )}
                      </div>
                      {getStatusBadge(app.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certificates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Certificados de Exportação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">Certificado {cert.certificate_number}</p>
                        {getStatusBadge(cert.status)}
                      </div>
                      <div className="space-y-2 text-sm">
                         <p><strong>Tipo:</strong> Certificado de Exportação</p>
                         <p><strong>Emitido:</strong> {new Date(cert.issue_date).toLocaleDateString('pt-PT')}</p>
                         <p><strong>Validade:</strong> {new Date(cert.expiry_date).toLocaleDateString('pt-PT')}</p>
                        {cert.export_applications && (
                          <>
                            <p><strong>Destino:</strong> {cert.export_applications.destination_country}</p>
                            <p><strong>Produtos:</strong> {cert.export_applications.products?.join(', ')}</p>
                            {cert.export_applications.quantity_kg && (
                              <p><strong>Quantidade:</strong> {cert.export_applications.quantity_kg} kg</p>
                            )}
                          </>
                        )}
                        <div className="flex gap-2 mt-3">
                          {cert.certificate_pdf_url ? (
                            <Button variant="outline" size="sm" asChild>
                              <a href={cert.certificate_pdf_url} target="_blank" rel="noopener noreferrer">
                                <FileText className="h-4 w-4 mr-2" />
                                Baixar PDF
                              </a>
                            </Button>
                           ) : (
                             <Button 
                               variant="outline" 
                               size="sm" 
                               onClick={() => handleViewCertificate({
                                 ...cert,
                                 exporter_name: exporter.company_name,
                                 product_name: cert.export_applications?.products?.join(', ') || 'N/A',
                                 quantity: cert.export_applications?.quantity_kg || 0,
                                 destination_country: cert.export_applications?.destination_country || 'N/A'
                               })}
                             >
                               <Eye className="h-4 w-4 mr-2" />
                               Ver Certificado
                             </Button>
                           )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CertificatePreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        certificate={selectedCertificate}
        companyInfo={exporter ? {
          name: exporter.company_name,
          address: exporter.company_address || 'Endereço não informado',
          phone: exporter.contact_phone || 'Telefone não informado',
          email: exporter.contact_email || 'Email não informado'
        } : undefined}
      />
    </SidebarProvider>
  );
}