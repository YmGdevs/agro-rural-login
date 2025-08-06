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
    console.log('PDF generation started')
    const { certificateId } = await req.json()
    console.log('Certificate ID received:', certificateId)
    
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

    console.log('Fetching certificate data for ID:', certificateId)
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
    
    console.log('Certificate data:', certificate)
    console.log('Certificate error:', certError)

    if (certError || !certificate) {
      console.error('Error fetching certificate:', certError)
      return new Response(
        JSON.stringify({ error: 'Certificate not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate QR code for PDF
    const qrData = JSON.stringify({
      certificateNumber: certificate.certificate_number,
      company: certificate.export_applications.exporters.company_name,
      nuit: certificate.export_applications.exporters.company_nuit,
      products: certificate.export_applications.products,
      quantity: certificate.export_applications.quantity_kg,
      destination: certificate.export_applications.destination_country,
      issueDate: certificate.issued_date,
      verificationUrl: `${Deno.env.get('SUPABASE_URL')}/verify-certificate/${certificate.certificate_number}`
    })
    
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 100,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

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
    
    doc.text(`Nome: ${certificate.export_applications.exporters.company_name}`, leftMargin, yPosition)
    yPosition += 10
    doc.text(`NUIT: ${certificate.export_applications.exporters.company_nuit}`, leftMargin, yPosition)
    yPosition += 10
    doc.text(`Endereço: ${certificate.export_applications.exporters.company_address || 'N/A'}`, leftMargin, yPosition)
    yPosition += 15
    
    // Product details
    doc.text(`Produto: ${certificate.export_applications.products?.join(', ') || 'N/A'}`, leftMargin, yPosition)
    yPosition += 10
    doc.text(`Quantidade: ${certificate.export_applications.quantity_kg ? `${certificate.export_applications.quantity_kg} kg` : 'N/A'}`, leftMargin, yPosition)
    yPosition += 10
    doc.text(`Classificação: ${certificate.export_applications.category || 'Tipo A - Longa Fibra'}`, leftMargin, yPosition)
    yPosition += 10
    doc.text(`Origem Geográfica: ${certificate.export_applications.commercialization_provinces?.join(', ') || 'Moçambique'}`, leftMargin, yPosition)
    yPosition += 10
    doc.text(`Destino: ${certificate.export_applications.destination_country}`, leftMargin, yPosition)
    yPosition += 15
    
    doc.text(`Número de Série: ${certificate.certificate_number}`, leftMargin, yPosition)
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
    doc.text(`Data de emissão: ${new Date(certificate.issued_date).toLocaleDateString('pt-PT')}`, leftMargin, yPosition)
    
    // Add QR code to PDF
    doc.addImage(qrCodeDataURL, 'PNG', 20, 110, 25, 25)
    
    // Convert PDF to bytes
    const pdfBytes = doc.output('arraybuffer')
    
    // Upload PDF to Supabase storage
    const fileName = `certificate-${certificate.certificate_number}-${Date.now()}.pdf`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('export-documents')
      .upload(`certificates/${fileName}`, pdfBytes, {
        contentType: 'application/pdf',
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