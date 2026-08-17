import { NextRequest, NextResponse } from "next/server";
import { searchPlacesWithoutWebsite, sanitizePhoneForWhatsApp } from "@/lib/services/places";
import { generateWhatsAppPitch, buildWhatsAppUrl } from "@/lib/services/gemini";
import { sendProspectDigestEmail } from "@/lib/services/resend";
import { Lead, ProspectResult } from "@/lib/types";

// Permite execução em serverless da Vercel
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 segundos de timeout para funções Vercel Pro/Hobby

/**
 * Função central do pipeline de prospecção
 */
async function executeProspectingPipeline(options: {
  searchTerm?: string;
  maxResults?: number;
  sendEmail?: boolean;
  recipientEmail?: string;
}): Promise<ProspectResult> {
  const startTime = Date.now();
  const searchTerm = options.searchTerm?.trim() || process.env.DEFAULT_SEARCH_TERM || "Marmoraria em Cachoeiro de Itapemirim";
  const maxResults = options.maxResults || 8;
  const shouldSendEmail = options.sendEmail !== false;

  console.log(`[Prospecting Pipeline] Iniciando busca para: "${searchTerm}"`);

  // 1. BUSCA & FILTRO: Buscar empresas no Google Places e filtrar sem site
  const { rawPlaces, isMockData } = await searchPlacesWithoutWebsite(searchTerm, maxResults);
  console.log(`[Prospecting Pipeline] Encontradas ${rawPlaces.length} empresas sem site.`);

  // 2. INTELIGÊNCIA ARTIFICIAL: Gerar copy personalizada com Gemini para cada empresa
  const leads: Lead[] = [];

  for (const place of rawPlaces) {
    try {
      const { formatted: formattedPhone, clean: cleanPhone } = sanitizePhoneForWhatsApp(
        place.formatted_phone_number || place.international_phone_number
      );

      // Gera pitch com Gemini
      const pitch = await generateWhatsAppPitch({
        companyName: place.name,
        rating: place.rating || 0,
        userRatingsTotal: place.user_ratings_total,
        cityOrAddress: place.formatted_address,
      });

      // Monta o link wa.me
      const waUrl = buildWhatsAppUrl(cleanPhone, pitch);

      leads.push({
        id: place.place_id,
        name: place.name,
        phone: formattedPhone,
        cleanPhone: cleanPhone,
        rating: place.rating || 0,
        userRatingsTotal: place.user_ratings_total || 0,
        address: place.formatted_address || "Endereço não disponível",
        website: null,
        hasWebsite: false,
        whatsappPitch: pitch,
        whatsappUrl: waUrl,
        generatedAt: new Date().toISOString(),
        lat: place.lat,
        lng: place.lng,
      });
    } catch (leadError) {
      console.error(`[Prospecting Pipeline] Erro ao processar lead "${place.name}":`, leadError);
    }
  }

  // 3. DISPARO / NOTIFICAÇÃO: Enviar relatório com links wa.me por e-mail via Resend
  let emailSent = false;
  let emailId: string | undefined;
  let emailError: string | undefined;

  if (shouldSendEmail && leads.length > 0) {
    const emailResult = await sendProspectDigestEmail({
      searchTerm,
      leads,
      recipientEmail: options.recipientEmail,
    });

    emailSent = emailResult.success;
    emailId = emailResult.emailId;
    emailError = emailResult.error;
  }

  const executionTimeMs = Date.now() - startTime;

  return {
    success: true,
    searchTerm,
    totalFound: rawPlaces.length,
    totalWithoutWebsite: leads.length,
    leads,
    emailSent,
    emailId,
    emailError,
    executionTimeMs,
    timestamp: new Date().toISOString(),
    warning: isMockData
      ? "Nota: GOOGLE_PLACES_API_KEY não configurada no .env. Dados de demonstração utilizados com sucesso."
      : undefined,
  };
}

/**
 * GET Handler: Acionado pelo Vercel Cron Jobs diariamente
 */
export async function GET(req: NextRequest) {
  try {
    // Validação de segurança opcional para o Cron da Vercel
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && cronSecret !== "meu_segredo_super_seguro_123") {
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.warn("[Cron Security] Requisição não autorizada bloqueada.");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || undefined;
    const sendEmailParam = searchParams.get("sendEmail");
    const sendEmail = sendEmailParam === null ? true : sendEmailParam === "true";

    const result = await executeProspectingPipeline({
      searchTerm: query,
      sendEmail,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("[Route /api/prospect GET Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro interno ao executar prospecção automática.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST Handler: Para testes manuais a partir do Dashboard com parâmetros personalizados
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { searchTerm, maxResults, sendEmail, recipientEmail } = body;

    const result = await executeProspectingPipeline({
      searchTerm,
      maxResults: maxResults ? Number(maxResults) : undefined,
      sendEmail: sendEmail !== undefined ? Boolean(sendEmail) : true,
      recipientEmail,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("[Route /api/prospect POST Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro interno ao executar prospecção automática via POST.",
      },
      { status: 500 }
    );
  }
}
