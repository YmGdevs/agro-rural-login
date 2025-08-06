import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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

    // Get certificate data
    const { data: cert } = await supabaseClient
      .from('export_certificates')
      .select(`*, export_applications(*, exporters(*))`)
      .eq('id', certificateId)
      .single()

    if (!cert) {
      return new Response(
        JSON.stringify({ error: 'Certificate not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Simple HTML
    const html = `<!DOCTYPE html>
<html><head><title>Certificado ${cert.certificate_number}</title></head>
<body style="font-family:Arial;padding:20px;">
<h1>CERTIFICADO DE EXPORTAÇÃO</h1>
<p><b>Número:</b> ${cert.certificate_number}</p>
<p><b>Empresa:</b> ${cert.export_applications.exporters.company_name}</p>
<p><b>NUIT:</b> ${cert.export_applications.exporters.company_nuit}</p>
<p><b>Produtos:</b> ${cert.export_applications.products?.join(', ')}</p>
<p><b>Destino:</b> ${cert.export_applications.destination_country}</p>
</body></html>`

    const fileName = `cert-${cert.certificate_number}.html`
    const { data } = await supabaseClient.storage
      .from('export-documents')
      .upload(`certificates/${fileName}`, new TextEncoder().encode(html), {
        contentType: 'text/html',
        upsert: true
      })

    const { data: { publicUrl } } = supabaseClient.storage
      .from('export-documents')
      .getPublicUrl(`certificates/${fileName}`)

    await supabaseClient
      .from('export_certificates')
      .update({ certificate_pdf_url: publicUrl })
      .eq('id', certificateId)

    return new Response(
      JSON.stringify({ success: true, certificateUrl: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})