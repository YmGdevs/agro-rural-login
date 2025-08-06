import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileImage, FileText, X } from 'lucide-react';
import { CertificateTemplate } from './CertificateTemplate';
import { useCertificateGenerator } from '@/hooks/useCertificateGenerator';

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
}

interface CertificatePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: ExportCertificate | null;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export function CertificatePreview({ 
  isOpen, 
  onClose, 
  certificate, 
  companyInfo 
}: CertificatePreviewProps) {
  const { certificateRef, generateCertificate, isGenerating } = useCertificateGenerator();

  if (!certificate) return null;

  const handleDownloadPNG = () => {
    generateCertificate({
      format: 'png',
      fileName: `certificado_${certificate.certificate_number}`,
      quality: 1.0
    });
  };

  const handleDownloadPDF = () => {
    generateCertificate({
      format: 'pdf',
      fileName: `certificado_${certificate.certificate_number}`,
      quality: 0.95
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="flex items-center gap-2">
              Certificado de Exportação
              <Badge variant="secondary">{certificate.certificate_number}</Badge>
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownloadPNG}
              disabled={isGenerating}
              variant="outline"
              size="sm"
            >
              <FileImage className="h-4 w-4 mr-2" />
              PNG
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              variant="outline"
              size="sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-4">
          <div className="border rounded-lg p-4 bg-muted/5">
            <div className="transform scale-75 origin-top-left" style={{ width: '133.33%' }}>
              <CertificateTemplate
                ref={certificateRef}
                certificate={certificate}
                companyInfo={companyInfo}
              />
            </div>
          </div>
        </div>

        {isGenerating && (
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              Gerando certificado...
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}