import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { jsPDF } from "https://esm.sh/jspdf@2.5.1"
import QRCode from "https://esm.sh/qrcode@1.5.3"

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
    const { applicationId } = await req.json()
    
    if (!applicationId) {
      return new Response(
        JSON.stringify({ error: 'Application ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch application and exporter data
    const { data: application, error: appError } = await supabaseClient
      .from('export_applications')
      .select(`
        *,
        exporters (
          company_name,
          company_nuit,
          company_address,
          contact_email
        )
      `)
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      console.error('Error fetching application:', appError)
      return new Response(
        JSON.stringify({ error: 'Application not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate certificate number
    const { data: certNumber } = await supabaseClient.rpc('generate_certificate_number')
    
    // Create PDF
    const doc = new jsPDF()
    
    // Set font
    doc.setFont('helvetica')
    
    // Add IAOM header
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.text('INSTITUTO DO ALGODÃO & OLEAGINOSAS', 105, 30, { align: 'center' })
    doc.text('MOÇAMBIQUE', 105, 40, { align: 'center' })
    
    doc.setFontSize(18)
    doc.setTextColor(0, 128, 0)
    doc.text('CERTIFICADO DE EXPORTAÇÃO DE ALGODÃO', 105, 60, { align: 'center' })
    
    // Company details
    doc.setFontSize(12)
    doc.setTextColor(40, 40, 40)
    
    const leftMargin = 20
    let yPosition = 90
    
    doc.text(`Nome: ${application.exporters.company_name}`, leftMargin, yPosition)
    yPosition += 10
    doc.text(`NUIT: ${application.exporters.company_nuit}`, leftMargin, yPosition)
    yPosition += 10
    doc.text(`Endereço: ${application.exporters.company_address || 'N/A'}`, leftMargin, yPosition)
    yPosition += 15
    
    // Product details
    doc.text(`Produto: ${application.products?.join(', ') || 'N/A'}`, leftMargin, yPosition)
    yPosition += 10
    doc.text(`Quantidade: ${application.quantity_kg ? `${application.quantity_kg} kg` : 'N/A'}`, leftMargin, yPosition)
    yPosition += 10
    doc.text(`Classificação: ${application.category || 'Tipo A - Longa Fibra'}`, leftMargin, yPosition)
    yPosition += 10
    doc.text(`Origem Geográfica: ${application.commercialization_provinces?.join(', ') || 'Moçambique'}`, leftMargin, yPosition)
    yPosition += 10
    doc.text(`Destino: ${application.destination_country}`, leftMargin, yPosition)
    yPosition += 15
    
    doc.text(`Número de Série: ${certNumber}`, leftMargin, yPosition)
    yPosition += 30
    
    // Signature section
    doc.text('Assinado digitalmente por:', leftMargin, yPosition)
    yPosition += 20
    
    doc.line(leftMargin, yPosition, leftMargin + 80, yPosition)
    yPosition += 10
    doc.text('Eng. João Mucavele', leftMargin, yPosition)
    yPosition += 8
    doc.text('Cargo: Director Geral do IAOM', leftMargin, yPosition)
    yPosition += 8
    doc.text(`Data de emissão: ${new Date().toLocaleDateString('pt-PT')}`, leftMargin, yPosition)
    
    // Generate QR Code
    const qrData = JSON.stringify({
      certificateNumber: certNumber,
      company: application.exporters.company_name,
      nuit: application.exporters.company_nuit,
      products: application.products,
      quantity: application.quantity_kg,
      destination: application.destination_country,
      issueDate: new Date().toISOString(),
      verificationUrl: `${Deno.env.get('SUPABASE_URL')}/verify-certificate/${certNumber}`
    })
    
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 100,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    // Add QR code to PDF
    doc.addImage(qrCodeDataURL, 'PNG', 20, 110, 25, 25)
    
    // Convert PDF to bytes
    const pdfBytes = doc.output('arraybuffer')
    
    // Upload PDF to Supabase storage
    const fileName = `certificate-${certNumber}-${Date.now()}.pdf`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('export-documents')
      .upload(`certificates/${fileName}`, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false
      })
    
    if (uploadError) {
      console.error('Error uploading PDF:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Failed to upload certificate' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('export-documents')
      .getPublicUrl(`certificates/${fileName}`)
    
    // Create certificate record
    const { data: certificate, error: certError } = await supabaseClient
      .from('export_certificates')
      .insert({
        application_id: applicationId,
        certificate_number: certNumber,
        certificate_pdf_url: publicUrl,
        qr_code_data: qrData,
        issued_by: application.reviewed_by,
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        certificate_type: 'export',
        status: 'active'
      })
      .select()
      .single()
    
    if (certError) {
      console.error('Error creating certificate record:', certError)
      return new Response(
        JSON.stringify({ error: 'Failed to create certificate record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('Certificate generated successfully:', certNumber)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        certificate,
        certificateNumber: certNumber,
        pdfUrl: publicUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error in generate-export-certificate function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})