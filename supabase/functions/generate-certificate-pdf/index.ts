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

  try {
    const { certificateId } = await req.json()
    
    if (!certificateId) {
      return new Response(
        JSON.stringify({ error: 'Certificate ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch certificate and application data
    const { data: certificate, error: certError } = await supabaseClient
      .from('export_certificates')
      .select(`
        *,
        export_applications!inner(
          *,
          exporters!inner(*)
        )
      `)
      .eq('id', certificateId)
      .single()

    if (certError || !certificate) {
      console.error('Error fetching certificate:', certError)
      return new Response(
        JSON.stringify({ error: 'Certificate not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate QR code data URL
    const qrData = encodeURIComponent(certificate.qr_code_data || JSON.stringify({
      certificateNumber: certificate.certificate_number,
      company: certificate.export_applications.exporters.company_name,
      nuit: certificate.export_applications.exporters.company_nuit,
      verificationUrl: `https://vxkljzytssofphkedakk.supabase.co/verify-certificate/${certificate.certificate_number}`
    }))
    
    // Generate QR code using QR Server API (free service)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrData}&bgcolor=ffffff&color=000000&format=png&ecc=M`

    // Create HTML content for the certificate
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page {
            size: A4;
            margin: 2cm;
        }
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: white;
        }
        .certificate {
            max-width: 800px;
            margin: 0 auto;
            border: 3px solid #2e7d32;
            padding: 40px;
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #2e7d32;
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
        .title {
            font-size: 22px;
            font-weight: bold;
            color: #2e7d32;
            background: #e8f5e8;
            padding: 15px;
            border-radius: 8px;
            border-left: 5px solid #2e7d32;
        }
        .content {
            margin: 30px 0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        .section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        .field {
            margin: 12px 0;
            display: flex;
            flex-wrap: wrap;
        }
        .field-label {
            font-weight: bold;
            color: #2e7d32;
            min-width: 140px;
            margin-right: 10px;
        }
        .field-value {
            color: #333;
            flex: 1;
        }
        .qr-section {
            position: absolute;
            top: 100px;
            right: 60px;
            width: 120px;
            height: 120px;
            border: 2px dashed #2e7d32;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: white;
            border-radius: 8px;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
        .signature {
            margin-top: 60px;
            text-align: center;
            border-top: 2px solid #2e7d32;
            padding-top: 30px;
        }
        .signature-line {
            border-top: 2px solid #333;
            width: 250px;
            margin: 30px auto 15px;
        }
        .signature-text {
            font-weight: bold;
            color: #2e7d32;
            margin: 5px 0;
        }
        .certificate-number {
            position: absolute;
            top: 20px;
            right: 20px;
            background: #2e7d32;
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 12px;
        }
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            color: rgba(46, 125, 50, 0.05);
            font-weight: bold;
            z-index: 0;
            pointer-events: none;
        }
        .content-wrapper {
            position: relative;
            z-index: 1;
        }
    </style>
</head>
<body>
    <div class="watermark">IAOM</div>
    <div class="certificate">
        <div class="certificate-number">${certificate.certificate_number}</div>
        
        <div class="qr-section">
            <div style="font-weight: bold; margin-bottom: 5px; font-size: 10px;">Verificação</div>
            <img src="${qrCodeUrl}" alt="QR Code" style="width: 100px; height: 100px; border: none;" />
            <div style="font-size: 8px; margin-top: 5px; word-break: break-all;">${certificate.certificate_number}</div>
        </div>

        <div class="content-wrapper">
            <div class="header">
                <div class="logo">Instituto do Algodão & Oleaginosas</div>
                <div class="subtitle">MOÇAMBIQUE</div>
                <div class="title">CERTIFICADO DE EXPORTAÇÃO DE ALGODÃO</div>
            </div>

            <div class="content">
                <div class="section">
                    <h3 style="color: #2e7d32; margin-top: 0;">Dados da Empresa</h3>
                    <div class="field">
                        <span class="field-label">Nome:</span>
                        <span class="field-value">${certificate.export_applications.exporters.company_name}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">NUIT:</span>
                        <span class="field-value">${certificate.export_applications.exporters.company_nuit}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Endereço:</span>
                        <span class="field-value">${certificate.export_applications.exporters.company_address || 'Av. das Fibras, Maputo, Moçambique'}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Email:</span>
                        <span class="field-value">${certificate.export_applications.exporters.contact_email}</span>
                    </div>
                </div>

                <div class="section">
                    <h3 style="color: #2e7d32; margin-top: 0;">Dados do Produto</h3>
                    <div class="field">
                        <span class="field-label">Produto:</span>
                        <span class="field-value">${certificate.export_applications.products?.join(', ') || 'Fibra de Algodão'}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Quantidade:</span>
                        <span class="field-value">${certificate.export_applications.quantity_kg ? `${certificate.export_applications.quantity_kg} kg` : '25 toneladas'}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Classificação:</span>
                        <span class="field-value">${certificate.export_applications.category || 'Tipo A - Longa Fibra'}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Origem Geográfica:</span>
                        <span class="field-value">${certificate.export_applications.commercialization_provinces?.join(', ') || 'Província de Nampula, Moçambique'}</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Destino:</span>
                        <span class="field-value">${certificate.export_applications.destination_country}</span>
                    </div>
                </div>
            </div>

            <div style="text-align: center; margin: 30px 0; padding: 20px; background: #e8f5e8; border-radius: 8px;">
                <div class="field">
                    <span class="field-label">Número de Série:</span>
                    <span class="field-value" style="font-size: 18px; font-weight: bold;">${certificate.certificate_number}</span>
                </div>
            </div>

            <div class="signature">
                <p style="margin-bottom: 20px; font-style: italic;">Assinado digitalmente por:</p>
                <div class="signature-line"></div>
                <div class="signature-text">Eng. João Mucavele</div>
                <div style="color: #666; margin: 5px 0;">Cargo: Director Geral do IAOM</div>
                <div style="color: #666; margin-top: 15px;">Data de emissão: ${new Date(certificate.issued_date).toLocaleDateString('pt-PT')}</div>
                <div style="color: #666; margin: 5px 0;">Válido até: ${new Date(certificate.expiry_date).toLocaleDateString('pt-PT')}</div>
            </div>
        </div>
    </div>
</body>
</html>`

    // Convert HTML to bytes and upload as HTML file
    const htmlBytes = new TextEncoder().encode(htmlContent)
    
    // Upload as HTML file  
    const fileName = `certificate-${certificate.certificate_number}-${Date.now()}.html`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('export-documents')
      .upload(`certificates/${fileName}`, htmlBytes, {
        contentType: 'text/html',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading certificate:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Failed to upload certificate', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('export-documents')
      .getPublicUrl(`certificates/${fileName}`)

    // Update certificate with PDF URL
    const { error: updateError } = await supabaseClient
      .from('export_certificates')
      .update({ certificate_pdf_url: publicUrl })
      .eq('id', certificateId)

    if (updateError) {
      console.error('Error updating certificate:', updateError)
    }

    console.log('Certificate generated successfully:', certificate.certificate_number)

    return new Response(
      JSON.stringify({ 
        success: true, 
        certificateUrl: publicUrl,
        message: 'Certificate generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error in generate-certificate-pdf function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})