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
    console.log('Function started')
    
    const requestBody = await req.json()
    console.log('Request body received:', requestBody)
    
    const { certificateId } = requestBody
    console.log('Certificate ID:', certificateId)
    
    if (!certificateId) {
      console.log('No certificate ID provided')
      return new Response(
        JSON.stringify({ error: 'Certificate ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Creating Supabase client')
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Fetching certificate...')
    // Fetch certificate first
    const { data: certificate, error: certError } = await supabaseClient
      .from('export_certificates')
      .select('*')
      .eq('id', certificateId)
      .single()
    
    console.log('Certificate result:', { certificate, certError })

    if (certError || !certificate) {
      console.error('Certificate not found:', certError)
      return new Response(
        JSON.stringify({ error: 'Certificate not found', details: certError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching application...')
    // Fetch application separately
    const { data: application, error: appError } = await supabaseClient
      .from('export_applications')
      .select('*')
      .eq('id', certificate.application_id)
      .single()
    
    console.log('Application result:', { application, appError })

    if (appError || !application) {
      console.error('Application not found:', appError)
      return new Response(
        JSON.stringify({ error: 'Application not found', details: appError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching exporter...')
    // Fetch exporter separately
    const { data: exporter, error: exporterError } = await supabaseClient
      .from('exporters')
      .select('*')
      .eq('id', application.exporter_id)
      .single()
    
    console.log('Exporter result:', { exporter, exporterError })

    if (exporterError || !exporter) {
      console.error('Exporter not found:', exporterError)
      return new Response(
        JSON.stringify({ error: 'Exporter not found', details: exporterError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Creating certificate HTML...')
    
    // Generate QR code URL
    const qrData = encodeURIComponent(JSON.stringify({
      certificateNumber: certificate.certificate_number,
      company: exporter.company_name,
      nuit: exporter.company_nuit,
      verificationUrl: `https://vxkljzytssofphkedakk.supabase.co/verify-certificate/${certificate.certificate_number}`
    }))
    
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrData}&bgcolor=ffffff&color=000000&format=png&ecc=M`

    // Create simple HTML content
    const htmlContent = `<!DOCTYPE html>
<html lang="pt-PT">
<head>
    <meta charset="UTF-8">
    <title>Certificado ${certificate.certificate_number}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .certificate { border: 2px solid #2e7d32; padding: 30px; max-width: 800px; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { color: #2e7d32; font-size: 24px; font-weight: bold; }
        .content { margin: 20px 0; }
        .field { margin: 10px 0; }
        .label { font-weight: bold; }
        .qr-code { text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">
            <div class="title">INSTITUTO DO ALGODÃO & OLEAGINOSAS</div>
            <div>MOÇAMBIQUE</div>
            <h2>CERTIFICADO DE EXPORTAÇÃO</h2>
        </div>
        
        <div class="content">
            <div class="field"><span class="label">Número:</span> ${certificate.certificate_number}</div>
            <div class="field"><span class="label">Empresa:</span> ${exporter.company_name}</div>
            <div class="field"><span class="label">NUIT:</span> ${exporter.company_nuit}</div>
            <div class="field"><span class="label">Produtos:</span> ${application.products?.join(', ') || 'N/A'}</div>
            <div class="field"><span class="label">Destino:</span> ${application.destination_country}</div>
            <div class="field"><span class="label">Quantidade:</span> ${application.quantity_kg ? `${application.quantity_kg} kg` : 'N/A'}</div>
            <div class="field"><span class="label">Emitido em:</span> ${new Date(certificate.issued_date).toLocaleDateString('pt-PT')}</div>
        </div>
        
        <div class="qr-code">
            <img src="${qrCodeUrl}" alt="QR Code" style="width: 100px; height: 100px;" />
            <div>Código de Verificação</div>
        </div>
    </div>
</body>
</html>`

    console.log('Uploading certificate...')
    
    // Upload certificate
    const fileName = `certificate-${certificate.certificate_number}-${Date.now()}.html`
    const htmlBytes = new TextEncoder().encode(htmlContent)
    
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('export-documents')
      .upload(`certificates/${fileName}`, htmlBytes, {
        contentType: 'text/html; charset=utf-8',
        upsert: false
      })

    console.log('Upload result:', { uploadData, uploadError })

    if (uploadError) {
      console.error('Upload failed:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Failed to upload certificate', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('export-documents')
      .getPublicUrl(`certificates/${fileName}`)

    console.log('Public URL:', publicUrl)

    // Update certificate
    const { error: updateError } = await supabaseClient
      .from('export_certificates')
      .update({ certificate_pdf_url: publicUrl })
      .eq('id', certificateId)

    console.log('Update result:', updateError)

    if (updateError) {
      console.error('Update failed:', updateError)
    }

    console.log('Certificate generated successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        certificateUrl: publicUrl,
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