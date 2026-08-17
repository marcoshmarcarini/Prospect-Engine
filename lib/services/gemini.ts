import { GoogleGenAI } from "@google/genai";

// Inicialização segura do cliente Gemini
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export interface PitchGenerationParams {
  companyName: string;
  rating: number;
  userRatingsTotal?: number;
  cityOrAddress?: string;
  senderName?: string;
}

const CANDIDATE_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

/**
 * Gera uma abordagem comercial persuasiva, humanizada e direta para WhatsApp usando o Gemini com resiliência a picos de demanda
 */
export async function generateWhatsAppPitch(params: PitchGenerationParams): Promise<string> {
  const { companyName, rating, userRatingsTotal, cityOrAddress } = params;
  const senderName = params.senderName || process.env.YOUR_NAME_OR_BRAND || "Marcos";

  const ai = getGeminiClient();

  // Se a chave não estiver configurada, gera template de alta conversão automaticamente
  if (!ai) {
    return generateFallbackPitch(params);
  }

  const isHighRating = rating >= 4.0;

  const prompt = `
Você é um consultor comercial de alto nível em prospecção B2B via WhatsApp.
Escreva uma mensagem de WhatsApp para a empresa "${companyName}".

DADOS DA EMPRESA:
- Nome da Empresa: "${companyName}"
- Nota no Google Maps: ${rating > 0 ? rating.toFixed(1) : "Sem nota informada"} ${userRatingsTotal ? `(${userRatingsTotal} avaliações)` : ""}
- Localização/Região: "${cityOrAddress || "Região local"}"
- Seu Nome (Remetente): "${senderName}"

REGRA CRÍTICA PARA A ABORDAGEM:
${
  isHighRating
    ? `- A nota da empresa é ${rating.toFixed(1)} (maior ou igual a 4.0): Elogie a reputação deles e a pontuação alta conquistada no Google Maps.`
    : `- A nota da empresa é menor que 4.0 ou inexistente: NÃO cite a nota em hipótese alguma. Diga apenas que você encontrou o perfil deles no Google Maps, viu que eles têm muito potencial de busca na região, mas estão perdendo vendas.`
}

PROBLEMA CENTRAL A SER ATACADO:
- Eles NÃO possuem um site oficial linkado no perfil comercial do Google Maps.
- Mostre que quem busca no Google sem encontrar link oficial acaba cotando com concorrentes.

OFERTA:
- Ofereça a criação de um hotsite/página comercial rápida e ágil, integrada diretamente ao WhatsApp da equipe comercial para converter buscas em orçamentos.
- Faça uma chamada para ação (CTA) simples e de baixo atrito para apresentar um modelo rápido.

REGRAS DE ESTILO E FORMATAÇÃO:
- Seja cordial, direto, profissional e persuasivo.
- NÃO use emojis em excesso (no máximo 1 ou 2 sutis, ou nenhum).
- Assine educadamente como "${senderName}".
- Retorne APENAS o texto da mensagem pronta para envio no WhatsApp, sem aspas e sem explicações antes ou depois.
`;

  // Tenta a geração com fallback entre modelos caso algum esteja enfrentando pico de demanda (503/429)
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          temperature: 0.6,
          topP: 0.9,
        },
      });

      const text = response.text?.trim();
      if (text && text.length > 20) {
        return text;
      }
    } catch (error: any) {
      const isOverloaded = error?.status === 503 || error?.message?.includes("high demand") || error?.code === 503;
      if (isOverloaded) {
        console.warn(`[Gemini] Modelo ${modelName} com alta demanda temporária (503). Tentando modelo alternativo...`);
      } else {
        console.warn(`[Gemini] Erro no modelo ${modelName}: ${error?.message || error}. Tentando modelo alternativo...`);
      }
    }
  }

  // Se todos os modelos falharem ou estiverem ocupados, utiliza o fallback calibrado
  console.info(`[Gemini] Utilizando template fallback comercial com a assinatura de ${senderName}.`);
  return generateFallbackPitch(params);
}

/**
 * Template fallback de alta conversão caso o Gemini esteja sem conexão
 */
function generateFallbackPitch(params: PitchGenerationParams): string {
  const { companyName, rating, userRatingsTotal } = params;
  const senderName = params.senderName || process.env.YOUR_NAME_OR_BRAND || "Marcos";

  if (rating >= 4.0) {
    const reviewsNote = userRatingsTotal ? ` e mais de ${userRatingsTotal} avaliações positivas` : "";
    return `Olá, tudo bem? Meu nome é ${senderName}.

Estava pesquisando empresas do segmento na região e encontrei o perfil da *${companyName}* no Google Maps. Quero parabenizar pelo trabalho: a nota de vocês (${rating.toFixed(1)} estrelas${reviewsNote}) mostra a confiança e a qualidade do atendimento que vocês oferecem aos clientes.

Notei, porém, um ponto de oportunidade comercial importante: o perfil de vocês ainda não possui um *site oficial* cadastrado.

Hoje, a maioria das pessoas que encontra a empresa no Google busca um link rápido para ver o catálogo, serviços e tirar dúvidas. Sem esse canal, vocês acabam perdendo orçamentos para concorrentes da região.

Eu desenvolvo páginas comerciais e hotsites rápidos, otimizados para celular e com botão direto para o WhatsApp da sua equipe, justamente para transformar quem pesquisa no Google em clientes no seu atendimento.

Teria 3 minutos nesta semana para eu te mostrar um modelo rápido de como ficaria a página da *${companyName}*?

Um abraço,
*${senderName}* | Consultoria de Presença Digital`;
  }

  return `Olá, tudo bem? Meu nome é ${senderName}.

Estava fazendo um mapeamento de negócios no Google Maps e encontrei o perfil da *${companyName}*. Notei que a empresa tem uma excelente localização e um grande potencial de buscas diárias de novos clientes na região.

Ao analisar o perfil, observei que vocês ainda não possuem um *site ou página oficial* linkada no cadastro do Google.

Quando o cliente encontra a empresa e não tem onde clicar para ver mais detalhes, ele costuma voltar para a busca e fechar com o concorrente mais próximo que tem essa facilidade.

Trabalho criando páginas comerciais e hotsites ágeis, pensados exclusivamente para converter as buscas do Google em conversas diretas no WhatsApp da empresa, sem burocracia.

Faz sentido para você eu enviar um exemplo rápido de como estruturar essa página para a *${companyName}*?

Fico à disposição,
*${senderName}* | Consultoria de Presença Digital`;
}

/**
 * Constrói a URL do WhatsApp Web / App já codificada
 */
export function buildWhatsAppUrl(cleanPhone: string, pitchText: string): string {
  if (!cleanPhone) return "";
  const encodedMessage = encodeURIComponent(pitchText);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
