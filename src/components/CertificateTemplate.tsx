import React from 'react';
import QRCode from 'qrcode';

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

interface CertificateTemplateProps {
  certificate: ExportCertificate;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export const CertificateTemplate = React.forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ certificate, companyInfo }, ref) => {
    const [qrCodeUrl, setQrCodeUrl] = React.useState<string>('');

    React.useEffect(() => {
      const generateQRCode = async () => {
        try {
          const verificationUrl = `${window.location.origin}/verify/${certificate.certificate_number}`;
          const qrUrl = await QRCode.toDataURL(verificationUrl, {
            width: 100,
            margin: 1,
          });
          setQrCodeUrl(qrUrl);
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      };

      generateQRCode();
    }, [certificate.certificate_number]);

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    return (
      <div
        ref={ref}
        className="bg-background p-8 min-h-[29.7cm] w-[21cm] mx-auto"
        style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          lineHeight: '1.4',
          color: '#000000',
          backgroundColor: '#ffffff'
        }}
      >
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-primary pb-6">
          <h1 className="text-3xl font-bold text-primary mb-2">
            CERTIFICADO DE EXPORTAÇÃO
          </h1>
          <h2 className="text-xl text-muted-foreground">
            EXPORT CERTIFICATE
          </h2>
          <div className="text-sm text-muted-foreground mt-2">
            República de Moçambique - Ministry of Agriculture
          </div>
        </div>

        {/* Certificate Number */}
        <div className="text-center mb-6">
          <div className="text-lg font-semibold">
            Certificado Nº: <span className="text-primary">{certificate.certificate_number}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3 text-primary">Exportador / Exporter</h3>
              <div className="border rounded-lg p-4 bg-muted/20">
                <div className="font-medium">{certificate.exporter_name}</div>
                {companyInfo && (
                  <>
                    <div className="text-sm mt-1">{companyInfo.address}</div>
                    <div className="text-sm">Tel: {companyInfo.phone}</div>
                    <div className="text-sm">Email: {companyInfo.email}</div>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-primary">Produto / Product</h3>
              <div className="border rounded-lg p-4 bg-muted/20">
                <div className="font-medium">{certificate.product_name}</div>
                <div className="text-sm mt-1">
                  Quantidade / Quantity: <span className="font-medium">{certificate.quantity} kg</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-primary">Destino / Destination</h3>
              <div className="border rounded-lg p-4 bg-muted/20">
                <div className="font-medium">{certificate.destination_country}</div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3 text-primary">Datas / Dates</h3>
              <div className="border rounded-lg p-4 bg-muted/20 space-y-2">
                <div>
                  <span className="font-medium">Data de Emissão / Issue Date:</span>
                  <div className="ml-4">{formatDate(certificate.issue_date)}</div>
                </div>
                <div>
                  <span className="font-medium">Data de Validade / Expiry Date:</span>
                  <div className="ml-4">{formatDate(certificate.expiry_date)}</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-primary">Status</h3>
              <div className="border rounded-lg p-4 bg-muted/20">
                <div className="font-medium text-green-600">
                  {certificate.status === 'issued' ? 'EMITIDO / ISSUED' : certificate.status.toUpperCase()}
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-3 text-primary">Verificação / Verification</h3>
              {qrCodeUrl && (
                <div className="border rounded-lg p-4 bg-muted/20">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code para verificação" 
                    className="mx-auto mb-2"
                    style={{ width: '100px', height: '100px' }}
                  />
                  <div className="text-xs text-muted-foreground">
                    Escaneie para verificar<br/>
                    Scan to verify
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Declaration */}
        <div className="border-t-2 border-primary pt-6 mb-8">
          <h3 className="font-semibold text-lg mb-3 text-primary">Declaração / Declaration</h3>
          <div className="text-sm leading-relaxed bg-muted/20 p-4 rounded-lg">
            <p className="mb-2">
              Certificamos que o produto acima mencionado está em conformidade com os regulamentos de exportação 
              da República de Moçambique e está autorizado para exportação para o destino indicado.
            </p>
            <p className="italic">
              We certify that the above mentioned product complies with the export regulations of the 
              Republic of Mozambique and is authorized for export to the indicated destination.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="grid grid-cols-2 gap-8 pt-8 border-t">
          <div>
            <div className="text-center">
              <div className="border-t border-foreground w-48 mx-auto mb-2"></div>
              <div className="font-medium">Assinatura Autorizada</div>
              <div className="text-sm text-muted-foreground">Authorized Signature</div>
            </div>
          </div>
          <div>
            <div className="text-center">
              <div className="border-t border-foreground w-48 mx-auto mb-2"></div>
              <div className="font-medium">Carimbo Oficial</div>
              <div className="text-sm text-muted-foreground">Official Stamp</div>
            </div>
          </div>
        </div>

        {/* Document Footer */}
        <div className="text-center text-xs text-muted-foreground mt-8 pt-4 border-t">
          Este certificado é válido apenas para a quantidade e destino especificados<br/>
          This certificate is valid only for the specified quantity and destination<br/>
          <span className="font-mono">{certificate.certificate_number}</span>
        </div>
      </div>
    );
  }
);

CertificateTemplate.displayName = 'CertificateTemplate';