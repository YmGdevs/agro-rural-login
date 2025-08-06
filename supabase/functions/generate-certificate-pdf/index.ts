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

    // Create HTML template for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 40px;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2e7d32;
            margin-bottom: 10px;
        }
        .title {
            font-size: 20px;
            font-weight: bold;
            color: #2e7d32;
            margin: 20px 0;
        }
        .content {
            margin: 30px 0;
        }
        .field {
            margin: 10px 0;
            display: flex;
        }
        .field-label {
            font-weight: bold;
            width: 200px;
        }
        .signature {
            margin-top: 60px;
            text-align: center;
        }
        .signature-line {
            border-top: 1px solid #000;
            width: 300px;
            margin: 40px auto 10px;
        }
        .qr-container {
            position: absolute;
            top: 150px;
            left: 40px;
            width: 100px;
            height: 100px;
            border: 1px solid #ddd;
            text-align: center;
            padding: 10px;
            font-size: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">INSTITUTO DO ALGODÃO & OLEAGINOSAS</div>
        <div>MOÇAMBIQUE</div>
        <div class="title">CERTIFICADO DE EXPORTAÇÃO DE ALGODÃO</div>
    </div>

    <div class="qr-container">
        QR Code<br>
        ${certificate.certificate_number}
    </div>

    <div class="content">
        <div class="field">
            <span class="field-label">Nome:</span>
            <span>${certificate.export_applications.exporters.company_name}</span>
        </div>
        <div class="field">
            <span class="field-label">NUIT:</span>
            <span>${certificate.export_applications.exporters.company_nuit}</span>
        </div>
        <div class="field">
            <span class="field-label">Endereço:</span>
            <span>${certificate.export_applications.exporters.company_address || 'N/A'}</span>
        </div>
        <div class="field">
            <span class="field-label">Produto:</span>
            <span>${certificate.export_applications.products?.join(', ') || 'N/A'}</span>
        </div>
        <div class="field">
            <span class="field-label">Quantidade:</span>
            <span>${certificate.export_applications.quantity_kg ? `${certificate.export_applications.quantity_kg} kg` : 'N/A'}</span>
        </div>
        <div class="field">
            <span class="field-label">Classificação:</span>
            <span>${certificate.export_applications.category || 'Tipo A - Longa Fibra'}</span>
        </div>
        <div class="field">
            <span class="field-label">Origem Geográfica:</span>
            <span>${certificate.export_applications.commercialization_provinces?.join(', ') || 'Moçambique'}</span>
        </div>
        <div class="field">
            <span class="field-label">Destino:</span>
            <span>${certificate.export_applications.destination_country}</span>
        </div>
        <div class="field">
            <span class="field-label">Número de Série:</span>
            <span>${certificate.certificate_number}</span>
        </div>
    </div>

    <div class="signature">
        <p>Assinado digitalmente por:</p>
        <div class="signature-line"></div>
        <p><strong>Eng. João Mucavele</strong></p>
        <p>Cargo: Director Geral do IAOM</p>
        <p>Data de emissão: ${new Date(certificate.issued_date).toLocaleDateString('pt-PT')}</p>
    </div>
</body>
</html>`

    // Convert HTML to PDF using browser automation
    const pdfResponse = await fetch('https://htmlcsstoimage.com/demo_run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: htmlContent,
        css: '',
        google_fonts: '',
        selector: 'body',
        ms_delay: 0,
        viewport_width: 1280,
        viewport_height: 720,
        device_scale: 1
      })
    })

    if (!pdfResponse.ok) {
      // Fallback: Return the HTML as a simple PDF alternative
      const pdfBytes = new TextEncoder().encode(htmlContent)
      
      // Upload as HTML file (temporary solution)
      const fileName = `certificate-${certificate.certificate_number}-${Date.now()}.html`
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('export-documents')
        .upload(`certificates/${fileName}`, pdfBytes, {
          contentType: 'text/html',
          upsert: false
        })

      if (uploadError) {
        console.error('Error uploading file:', uploadError)
        return new Response(
          JSON.stringify({ error: 'Failed to generate certificate' }),
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

      return new Response(
        JSON.stringify({ 
          success: true, 
          certificateUrl: publicUrl,
          message: 'Certificate generated as HTML file'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const pdfData = await pdfResponse.json()
    
    if (pdfData.url) {
      // Download the generated image/PDF
      const imageResponse = await fetch(pdfData.url)
      const imageBuffer = await imageResponse.arrayBuffer()
      
      // Upload to Supabase storage
      const fileName = `certificate-${certificate.certificate_number}-${Date.now()}.png`
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('export-documents')
        .upload(`certificates/${fileName}`, imageBuffer, {
          contentType: 'image/png',
          upsert: false
        })

      if (uploadError) {
        console.error('Error uploading certificate:', uploadError)
        return new Response(
          JSON.stringify({ error: 'Failed to upload certificate' }),
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
          certificateUrl: publicUrl
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Failed to generate PDF' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error in generate-certificate-pdf function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})