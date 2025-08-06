import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CertificateRequestFormProps {
  exporterId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  phone: string;
  nuit_holder: string;
  license_number: string;
  license_document: File | null;
  representative_name: string;
  id_document_number: string;
  id_issue_location: string;
  id_issue_date: Date | undefined;
  id_document: File | null;
  commercialization_provinces: string;
  districts: string;
  crops: string[];
  category: string;
  payment_proof: File | null;
  signature_name: string;
  signature_date: Date | undefined;
}

const cropOptions = [
  { id: "soja", label: "Soja" },
  { id: "gergelim", label: "Gergelim" },
  { id: "girassol", label: "Girassol" },
  { id: "amendoim", label: "Amendoim" },
  { id: "algodao", label: "Algodão" }
];

const categoryOptions = [
  { value: "comerciante_local", label: "Comerciante Local de Oleaginosas" },
  { value: "comerciante_exportador", label: "Comerciante Exportador de Oleaginosas" },
  { value: "importador", label: "Importador" },
  { value: "operador_fomento", label: "Operador de Fomento" },
  { value: "produtor_grande_escala", label: "Produtor de Grande Escala" },
  { value: "produtor_nao_concessionado", label: "Produtor Não Concessionado Emergente" }
];

export default function CertificateRequestForm({ exporterId, onSuccess, onCancel }: CertificateRequestFormProps) {
  const [formData, setFormData] = useState<FormData>({
    phone: "",
    nuit_holder: "",
    license_number: "",
    license_document: null,
    representative_name: "",
    id_document_number: "",
    id_issue_location: "",
    id_issue_date: undefined,
    id_document: null,
    commercialization_provinces: "",
    districts: "",
    crops: [],
    category: "",
    payment_proof: null,
    signature_name: "",
    signature_date: undefined
  });

  const [uploading, setUploading] = useState(false);

  const handleCropChange = (cropId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      crops: checked 
        ? [...prev.crops, cropId]
        : prev.crops.filter(c => c !== cropId)
    }));
  };

  const uploadFile = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('export-documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('export-documents')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone || !formData.nuit_holder || !formData.category) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setUploading(true);
    try {
      let licenseDocumentUrl = null;
      let idDocumentUrl = null;
      let paymentProofUrl = null;

      // Upload documents
      if (formData.license_document) {
        licenseDocumentUrl = await uploadFile(formData.license_document, `licenses/${exporterId}`);
      }

      if (formData.id_document) {
        idDocumentUrl = await uploadFile(formData.id_document, `id_documents/${exporterId}`);
      }

      if (formData.payment_proof) {
        paymentProofUrl = await uploadFile(formData.payment_proof, `payment_proofs/${exporterId}`);
      }

      // Submit application
      const { error } = await supabase
        .from('export_applications')
        .insert({
          exporter_id: exporterId,
          application_type: 'certification',
          products: formData.crops,
          destination_country: 'Moçambique', // Default for domestic certification
          phone: formData.phone,
          nuit_holder: formData.nuit_holder,
          license_number: formData.license_number,
          license_document_url: licenseDocumentUrl,
          representative_name: formData.representative_name,
          id_document_number: formData.id_document_number,
          id_issue_location: formData.id_issue_location,
          id_issue_date: formData.id_issue_date?.toISOString().split('T')[0],
          id_document_url: idDocumentUrl,
          commercialization_provinces: formData.commercialization_provinces.split(',').map(p => p.trim()).filter(p => p),
          districts: formData.districts.split(',').map(d => d.trim()).filter(d => d),
          crops: formData.crops,
          category: formData.category,
          payment_proof_url: paymentProofUrl,
          signature_name: formData.signature_name,
          signature_date: formData.signature_date?.toISOString().split('T')[0]
        });

      if (error) throw error;

      toast.success("Pedido de certificado submetido com sucesso!");
      onSuccess();
    } catch (error) {
      console.error('Error submitting certificate request:', error);
      toast.error("Erro ao submeter pedido de certificado");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Telefone *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="Número de telefone"
            required
          />
        </div>

        <div>
          <Label htmlFor="nuit_holder">Portador do Nuit *</Label>
          <Input
            id="nuit_holder"
            value={formData.nuit_holder}
            onChange={(e) => setFormData(prev => ({ ...prev, nuit_holder: e.target.value }))}
            placeholder="Nome do portador do NUIT"
            required
          />
        </div>

        <div>
          <Label htmlFor="license_number">Titular do Alvará/Licença nº</Label>
          <Input
            id="license_number"
            value={formData.license_number}
            onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
            placeholder="Número do alvará/licença"
          />
        </div>

        <div>
          <Label htmlFor="license_document">Upload do Alvará</Label>
          <Input
            id="license_document"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFormData(prev => ({ ...prev, license_document: e.target.files?.[0] || null }))}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Formato PDF, JPEG, JPG ou PNG. O tamanho máximo é de 2MB.
          </p>
        </div>

        <div>
          <Label htmlFor="representative_name">Representado(a) pelo(a) Senhor(a)</Label>
          <Input
            id="representative_name"
            value={formData.representative_name}
            onChange={(e) => setFormData(prev => ({ ...prev, representative_name: e.target.value }))}
            placeholder="Nome do representante"
          />
        </div>

        <div>
          <Label htmlFor="id_document_number">(BI/Passaporte/DIRE) nº</Label>
          <Input
            id="id_document_number"
            value={formData.id_document_number}
            onChange={(e) => setFormData(prev => ({ ...prev, id_document_number: e.target.value }))}
            placeholder="Número do documento de identificação"
          />
        </div>

        <div>
          <Label htmlFor="id_issue_location">Local de Emissão</Label>
          <Input
            id="id_issue_location"
            value={formData.id_issue_location}
            onChange={(e) => setFormData(prev => ({ ...prev, id_issue_location: e.target.value }))}
            placeholder="Local de emissão do documento"
          />
        </div>

        <div>
          <Label>Data de Emissão</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.id_issue_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.id_issue_date ? (
                  format(formData.id_issue_date, "dd/MM/yyyy")
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.id_issue_date}
                onSelect={(date) => setFormData(prev => ({ ...prev, id_issue_date: date }))}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="id_document">Upload de (BI/Passaporte/DIRE)</Label>
          <Input
            id="id_document"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFormData(prev => ({ ...prev, id_document: e.target.files?.[0] || null }))}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Formato PDF, JPEG, JPG ou PNG. O tamanho máximo é de 2MB.
          </p>
        </div>

        <div>
          <Label htmlFor="commercialization_provinces">Comercialização na(s) Província(s) de</Label>
          <Textarea
            id="commercialization_provinces"
            value={formData.commercialization_provinces}
            onChange={(e) => setFormData(prev => ({ ...prev, commercialization_provinces: e.target.value }))}
            placeholder="Exemplo: Maputo ou Maputo, Sofala, ..."
          />
        </div>

        <div>
          <Label htmlFor="districts">Distrito(s) de</Label>
          <Textarea
            id="districts"
            value={formData.districts}
            onChange={(e) => setFormData(prev => ({ ...prev, districts: e.target.value }))}
            placeholder="Exemplo: Namaacha ou Namaacha, Megude, ..."
          />
        </div>
      </div>

      <div>
        <Label>Cultura *</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
          {cropOptions.map((crop) => (
            <div key={crop.id} className="flex items-center space-x-2">
              <Checkbox
                id={crop.id}
                checked={formData.crops.includes(crop.id)}
                onCheckedChange={(checked) => handleCropChange(crop.id, checked as boolean)}
              />
              <Label htmlFor={crop.id}>{crop.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Categoria de *</Label>
        <RadioGroup
          value={formData.category}
          onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          className="mt-2"
        >
          {categoryOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label htmlFor={option.value}>{option.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div>
        <Label htmlFor="payment_proof">Upload de Comprovativo de Pagamento</Label>
        <Input
          id="payment_proof"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => setFormData(prev => ({ ...prev, payment_proof: e.target.files?.[0] || null }))}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Formato PDF, JPEG, JPG ou PNG. O tamanho máximo é de 2MB.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="signature_name">Nome da Assinatura</Label>
          <Input
            id="signature_name"
            value={formData.signature_name}
            onChange={(e) => setFormData(prev => ({ ...prev, signature_name: e.target.value }))}
            placeholder="Nome para assinatura"
          />
        </div>

        <div>
          <Label>Data da Assinatura</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.signature_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.signature_date ? (
                  format(formData.signature_date, "dd/MM/yyyy")
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.signature_date}
                onSelect={(date) => setFormData(prev => ({ ...prev, signature_date: date }))}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={uploading}
          className="flex-1"
        >
          {uploading ? "Enviando..." : "Cadastrar"}
        </Button>
      </div>
    </form>
  );
}