import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url)
  
  // If requesting to view the certificate directly
  if (url.searchParams.get('view') === 'true') {
    try {
      const certificateId = url.searchParams.get('certificateId')
      
      if (!certificateId) {
        return new Response('Certificate ID required', { status: 400 })
      }

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Fetch data
      const { data: certificate } = await supabaseClient
        .from('export_certificates')
        .select('*')
        .eq('id', certificateId)
        .single()

      const { data: application } = await supabaseClient
        .from('export_applications')
        .select('*')
        .eq('id', certificate.application_id)
        .single()

      const { data: exporter } = await supabaseClient
        .from('exporters')
        .select('*')
        .eq('id', application.exporter_id)
        .single()

      // Generate QR code URL
      const qrData = encodeURIComponent(JSON.stringify({
        certificateNumber: certificate.certificate_number,
        company: exporter.company_name,
        nuit: exporter.company_nuit,
        verificationUrl: `https://vxkljzytssofphkedakk.supabase.co/verify-certificate/${certificate.certificate_number}`
      }))
      
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}&bgcolor=ffffff&color=000000&format=png&ecc=M`

      // Create beautiful HTML content
      const htmlContent = `<!DOCTYPE html>
<html lang="pt-PT">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificado ${certificate.certificate_number}</title>
    <style>
        @page {
            size: A4;
            margin: 1cm;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }
        .certificate-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border-radius: 10px;
            overflow: hidden;
        }
        .certificate {
            padding: 40px;
            position: relative;
        }
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px;
            color: rgba(46, 125, 50, 0.05);
            font-weight: bold;
            z-index: 0;
            pointer-events: none;
        }
        .content {
            position: relative;
            z-index: 1;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #2e7d32;
            padding-bottom: 20px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2e7d32;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .subtitle {
            font-size: 16px;
            color: #666;
            margin-bottom: 20px;
        }
        .certificate-title {
            font-size: 24px;
            font-weight: bold;
            color: #2e7d32;
            background: linear-gradient(135deg, #e8f5e8, #f1f8e9);
            padding: 15px;
            border-radius: 8px;
            border: 2px solid #2e7d32;
            margin-top: 15px;
        }
        .certificate-number {
            position: absolute;
            top: 20px;
            right: 20px;
            background: #2e7d32;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: bold;
            font-size: 14px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin: 30px 0;
        }
        .info-section {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            border-left: 5px solid #2e7d32;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #2e7d32;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .field {
            margin: 12px 0;
            display: flex;
            align-items: center;
        }
        .field-label {
            font-weight: bold;
            color: #2e7d32;
            min-width: 120px;
            margin-right: 10px;
        }
        .field-value {
            color: #333;
            flex: 1;
        }
        .qr-section {
            text-align: center;
            margin: 40px 0;
            padding: 20px;
            background: linear-gradient(135deg, #e8f5e8, #f1f8e9);
            border-radius: 15px;
            border: 2px dashed #2e7d32;
        }
        .qr-title {
            font-weight: bold;
            color: #2e7d32;
            margin-bottom: 15px;
            font-size: 16px;
        }
        .qr-code img {
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .signature-section {
            margin-top: 50px;
            text-align: center;
            border-top: 2px solid #2e7d32;
            padding-top: 30px;
        }
        .signature-line {
            border-top: 2px solid #333;
            width: 300px;
            margin: 20px auto;
        }
        .signature-text {
            font-weight: bold;
            color: #2e7d32;
            font-size: 16px;
            margin: 10px 0;
        }
        .signature-details {
            color: #666;
            font-size: 14px;
            margin: 5px 0;
        }
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2e7d32;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-weight: bold;
            box-shadow: 0 5px 15px rgba(46, 125, 50, 0.3);
            z-index: 1000;
        }
        .print-button:hover {
            background: #1b5e20;
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .certificate-container {
                box-shadow: none;
                border-radius: 0;
            }
            .print-button {
                display: none;
            }
        }
        @media (max-width: 768px) {
            .info-grid {
                grid-template-columns: 1fr;
            }
            .certificate {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">🖨️ Imprimir</button>
    
    <div class="certificate-container">
        <div class="watermark">IAOM</div>
        <div class="certificate">
            <div class="certificate-number">${certificate.certificate_number}</div>
            
            <div class="content">
                <div class="header">
                    <div class="logo">Instituto do Algodão & Oleaginosas</div>
                    <div class="subtitle">REPÚBLICA DE MOÇAMBIQUE</div>
                    <div class="certificate-title">CERTIFICADO DE EXPORTAÇÃO DE ALGODÃO</div>
                </div>

                <div class="info-grid">
                    <div class="info-section">
                        <h3 class="section-title">🏢 Dados da Empresa</h3>
                        <div class="field">
                            <span class="field-label">Nome:</span>
                            <span class="field-value">${exporter.company_name}</span>
                        </div>
                        <div class="field">
                            <span class="field-label">NUIT:</span>
                            <span class="field-value">${exporter.company_nuit}</span>
                        </div>
                        <div class="field">
                            <span class="field-label">Endereço:</span>
                            <span class="field-value">${exporter.company_address || 'Av. das Fibras, Maputo'}</span>
                        </div>
                        <div class="field">
                            <span class="field-label">Email:</span>
                            <span class="field-value">${exporter.contact_email}</span>
                        </div>
                    </div>

                    <div class="info-section">
                        <h3 class="section-title">📦 Dados do Produto</h3>
                        <div class="field">
                            <span class="field-label">Produto:</span>
                            <span class="field-value">${application.products?.join(', ') || 'Fibra de Algodão'}</span>
                        </div>
                        <div class="field">
                            <span class="field-label">Quantidade:</span>
                            <span class="field-value">${application.quantity_kg ? `${application.quantity_kg.toLocaleString()} kg` : 'N/A'}</span>
                        </div>
                        <div class="field">
                            <span class="field-label">Destino:</span>
                            <span class="field-value">${application.destination_country}</span>
                        </div>
                        <div class="field">
                            <span class="field-label">Categoria:</span>
                            <span class="field-value">${application.category || 'Tipo A - Longa Fibra'}</span>
                        </div>
                    </div>
                </div>

                <div class="qr-section">
                    <div class="qr-title">🔍 Código de Verificação</div>
                    <div class="qr-code">
                        <img src="${qrCodeUrl}" alt="QR Code de Verificação" />
                    </div>
                    <div style="margin-top: 10px; font-size: 12px; color: #666;">
                        Escaneie para verificar a autenticidade
                    </div>
                </div>

                <div class="signature-section">
                    <p style="margin-bottom: 20px; font-style: italic; color: #666;">
                        Este certificado foi emitido eletronicamente e é válido sem assinatura física
                    </p>
                    <div class="signature-line"></div>
                    <div class="signature-text">Eng. João Mucavele</div>
                    <div class="signature-details">Director Geral do IAOM</div>
                    <div class="signature-details">Data de emissão: ${new Date(certificate.issued_date).toLocaleDateString('pt-PT')}</div>
                    <div class="signature-details">Válido até: ${new Date(certificate.expiry_date).toLocaleDateString('pt-PT')}</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`

      return new Response(htmlContent, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600'
        }
      })
      
    } catch (error) {
      return new Response(`Erro ao carregar certificado: ${error.message}`, { status: 500 })
    }
  }

  // Regular API endpoint for generating certificate
  try {
    const { certificateId } = await req.json()
    
    if (!certificateId) {
      return new Response(
        JSON.stringify({ error: 'Certificate ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate the direct view URL
    const viewUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-certificate-pdf?view=true&certificateId=${certificateId}`

    return new Response(
      JSON.stringify({ 
        success: true, 
        certificateUrl: viewUrl,
        message: 'Certificate generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})