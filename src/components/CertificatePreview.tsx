import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, X } from 'lucide-react';
import { CertificateTemplate } from './CertificateTemplate';

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
  const certificateRef = React.useRef<HTMLDivElement>(null);

  if (!certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
        <DialogHeader className="flex flex-row items-center justify-between no-print">
          <div>
            <DialogTitle className="flex items-center gap-2">
              Certificado de Exportação
              <Badge variant="secondary">{certificate.certificate_number}</Badge>
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-4">
          <div className="border rounded-lg p-4 bg-white shadow-lg no-print">
            <div className="transform scale-90 origin-top-left" style={{ width: '111.11%' }}>
              <CertificateTemplate
                ref={certificateRef}
                certificate={certificate}
                companyInfo={companyInfo}
              />
            </div>
          </div>
          
          {/* Version for printing - hidden on screen */}
          <div className="hidden print:block">
            <CertificateTemplate
              certificate={certificate}
              companyInfo={companyInfo}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}