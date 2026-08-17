import { Resend } from "resend";
import { EmailDispatchResult, Lead } from "@/lib/types";

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "MY_RESEND_API_KEY" || apiKey.startsWith("re_fake")) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export interface SendProspectDigestParams {
  searchTerm: string;
  leads: Lead[];
  recipientEmail?: string;
}

/**
 * Envia o relatório de prospecção com links wa.me direto para a caixa de entrada
 */
export async function sendProspectDigestEmail(
  params: SendProspectDigestParams
): Promise<EmailDispatchResult> {
  const { searchTerm, leads, recipientEmail } = params;
  const rawTo = (recipientEmail || process.env.NOTIFICATION_EMAIL_TO || "").trim();
  
  // O remetente: se estiver configurado com domínio público (gmail/hotmail) ou inválido, usa o onboarding@resend.dev
  let fromEmail = (process.env.NOTIFICATION_EMAIL_FROM || "").trim();
  if (!fromEmail || fromEmail.includes("@gmail.com") || fromEmail.includes("@hotmail.com") || fromEmail.includes("@outlook.com") || fromEmail.includes("@yahoo.com")) {
    fromEmail = "Prospect Engine <onboarding@resend.dev>";
  } else if (!fromEmail.includes("<") && fromEmail.includes("@")) {
    fromEmail = `Prospect Engine <${fromEmail}>`;
  }

  if (!rawTo || rawTo === "seu-email@exemplo.com" || rawTo === "seu-email@gmail.com") {
    return {
      success: false,
      error: "Destinatário de e-mail não configurado ou com placeholder (NOTIFICATION_EMAIL_TO).",
    };
  }

  // Validação de formato de e-mail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(rawTo)) {
    return {
      success: false,
      error: `Endereço de e-mail destinatário inválido: "${rawTo}".`,
    };
  }

  const resend = getResendClient();
  if (!resend) {
    console.warn("[Resend] RESEND_API_KEY não configurada. E-mail demonstrativo simulado com sucesso.");
    return {
      success: true,
      emailId: `simulated_email_${Date.now()}`,
    };
  }

  const todayStr = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  const subject = `🎯 [Relatório de Prospecção] ${leads.length} Empresas sem Site em "${searchTerm}"`;

  const htmlContent = generateEmailHtml({
    searchTerm,
    leads,
    dateStr: todayStr,
  });

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to: [rawTo],
      subject: subject,
      html: htmlContent,
    });

    if (data.error) {
      const errorMsg = data.error.message || "";
      console.warn("[Resend Warning]:", data.error);

      // Tratamento amigável para restrições do modo sandbox/teste do Resend
      if (errorMsg.includes("testing emails to your own email address") || errorMsg.includes("domain") || data.error.name === "validation_error") {
        return {
          success: false,
          error: `Resend (Modo Teste): Para contas sem domínio próprio verificado, o Resend só entrega para o e-mail da sua própria conta. Detalhe: ${errorMsg}`,
        };
      }

      return {
        success: false,
        error: errorMsg || `Erro do Resend (${data.error.name || "validation_error"}).`,
      };
    }

    return {
      success: true,
      emailId: data.data?.id,
    };
  } catch (error: any) {
    console.warn("[Resend Exception]:", error);
    return {
      success: false,
      error: error.message || "Falha na comunicação com a API do Resend.",
    };
  }
}

/**
 * Template HTML responsivo, moderno e elegante para o e-mail diário
 */
function generateEmailHtml(params: {
  searchTerm: string;
  leads: Lead[];
  dateStr: string;
}): string {
  const { searchTerm, leads, dateStr } = params;

  const leadsCards = leads
    .map((lead, idx) => {
      const ratingStars = lead.rating > 0 ? `⭐ ${lead.rating.toFixed(1)}` : "Sem nota";
      const reviews = lead.userRatingsTotal > 0 ? `(${lead.userRatingsTotal} avaliações)` : "";
      const formattedPitch = lead.whatsappPitch.replace(/\n/g, "<br/>");

      return `
      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div>
            <span style="display: inline-block; background-color: #f1f5f9; color: #475569; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; margin-bottom: 6px;">#${idx + 1} PROSPECT</span>
            <h3 style="margin: 0; color: #0f172a; font-size: 18px; font-weight: 700;">${lead.name}</h3>
          </div>
          <div style="background-color: #fef3c7; color: #92400e; font-weight: 700; font-size: 13px; padding: 4px 10px; border-radius: 9999px; text-align: right;">
            ${ratingStars} <span style="font-size: 11px; font-weight: 400;">${reviews}</span>
          </div>
        </div>

        <div style="margin-bottom: 14px; font-size: 13px; color: #64748b;">
          <p style="margin: 4px 0;">📍 <strong>Endereço:</strong> ${lead.address || "Não informado"}</p>
          <p style="margin: 4px 0;">📞 <strong>Telefone:</strong> <span style="color: #0f172a; font-weight: 600;">${lead.phone}</span></p>
          <p style="margin: 4px 0; color: #dc2626;">❌ <strong>Website:</strong> Não possui site oficial cadastrado no Google</p>
        </div>

        <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 14px; border-radius: 6px; margin-bottom: 16px;">
          <p style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #059669; font-weight: 700;">🤖 Abordagem Personalizada Gerada pelo Gemini:</p>
          <div style="font-size: 13px; line-height: 1.5; color: #334155; font-style: normal;">
            ${formattedPitch}
          </div>
        </div>

        <div style="text-align: center;">
          <a href="${lead.whatsappUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #25d366; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 24px; border-radius: 8px; box-shadow: 0 2px 6px rgba(37, 211, 102, 0.35);">
            💬 Abrir no WhatsApp Web / Celular &rarr;
          </a>
        </div>
      </div>
    `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Prospecção</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
    
    <!-- HEADER -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">⚡ Máquina de Prospecção Automática</h1>
      <p style="margin: 0; font-size: 14px; color: #94a3b8;">Relatório diário de empresas locais prontas para abordagem</p>
    </div>

    <!-- SUMMARY BAR -->
    <div style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 16px 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="font-size: 13px; color: #64748b;">🔍 <strong>Busca:</strong> ${searchTerm}</td>
          <td style="font-size: 13px; color: #64748b; text-align: right;">🎯 <strong>${leads.length} leads qualificados</strong></td>
        </tr>
        <tr>
          <td colspan="2" style="font-size: 11px; color: #94a3b8; padding-top: 6px;">📅 Executado em: ${dateStr}</td>
        </tr>
      </table>
    </div>

    <!-- CONTENT -->
    <div style="padding: 24px; background-color: #f8fafc;">
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #475569;">
        Abaixo estão as empresas encontradas no Google Maps que <strong>não possuem site próprio</strong>. Clique nos botões para abrir o WhatsApp diretamente com a mensagem persuasiva pronta para envio:
      </p>

      ${leadsCards.length > 0 ? leadsCards : '<p style="text-align: center; color: #64748b; padding: 40px 0;">Nenhuma empresa sem site encontrada para este termo hoje.</p>'}
    </div>

    <!-- FOOTER -->
    <div style="background-color: #0f172a; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px;">
      <p style="margin: 0 0 4px 0;">Automação Vercel Cron + Google Places + Gemini AI + Resend</p>
      <p style="margin: 0;">Para alterar termos ou horários, ajuste as variáveis de ambiente ou o arquivo <code>vercel.json</code>.</p>
    </div>
  </div>
</body>
</html>
  `;
}
