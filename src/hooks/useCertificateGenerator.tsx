import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

export interface GenerateOptions {
  format: 'png' | 'pdf';
  fileName?: string;
  quality?: number;
}

export function useCertificateGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const generateCertificate = async (options: GenerateOptions = { format: 'png' }) => {
    if (!certificateRef.current) {
      toast.error('Certificado não encontrado');
      return null;
    }

    setIsGenerating(true);
    try {
      // Configurações para alta qualidade
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2, // Aumenta a resolução
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
        scrollX: 0,
        scrollY: 0,
      });

      const { format, fileName, quality = 1.0 } = options;
      const baseFileName = fileName || `certificado_${Date.now()}`;

      if (format === 'png') {
        // Gerar PNG
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${baseFileName}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            toast.success('Certificado PNG gerado com sucesso!');
          }
        }, 'image/png', quality);
      } else if (format === 'pdf') {
        // Gerar PDF usando jsPDF
        const imgData = canvas.toDataURL('image/png', quality);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        // Calcular dimensões para manter proporção
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasAspectRatio = canvas.width / canvas.height;
        const pdfAspectRatio = pdfWidth / pdfHeight;

        let imgWidth = pdfWidth;
        let imgHeight = pdfHeight;

        if (canvasAspectRatio > pdfAspectRatio) {
          imgHeight = pdfWidth / canvasAspectRatio;
        } else {
          imgWidth = pdfHeight * canvasAspectRatio;
        }

        const x = (pdfWidth - imgWidth) / 2;
        const y = (pdfHeight - imgHeight) / 2;

        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(`${baseFileName}.pdf`);
        
        toast.success('Certificado PDF gerado com sucesso!');
      }

      return canvas;
    } catch (error) {
      console.error('Erro ao gerar certificado:', error);
      toast.error('Erro ao gerar certificado');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    certificateRef,
    generateCertificate,
    isGenerating
  };
}