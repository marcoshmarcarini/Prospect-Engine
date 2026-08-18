import { RawPlace } from "@/lib/types";

/**
 * Sanitiza e padroniza o telefone para o formato internacional do WhatsApp (wa.me)
 * Ex: "(28) 99912-3456" -> "5528999123456"
 */
export function sanitizePhoneForWhatsApp(phone?: string): { formatted: string; clean: string } {
  if (!phone) {
    return { formatted: "Telefone não informado", clean: "" };
  }

  // Remove caracteres não numéricos
  let clean = phone.replace(/\D/g, "");

  // Se começou com 0, remove o zero inicial (ex: 028 -> 28)
  if (clean.startsWith("0")) {
    clean = clean.substring(1);
  }

  // Se não possui o DDI 55 do Brasil e tem 10 ou 11 dígitos (DDD + número)
  if (clean.length === 10 || clean.length === 11) {
    clean = `55${clean}`;
  }

  return {
    formatted: phone.trim(),
    clean: clean,
  };
}

/**
 * Busca detalhes complementares de uma empresa no Google Place Details
 */
async function fetchPlaceDetails(placeId: string, apiKey: string): Promise<any | null> {
  try {
    const fields = [
      "name",
      "rating",
      "user_ratings_total",
      "formatted_phone_number",
      "international_phone_number",
      "website",
      "formatted_address",
      "business_status",
      "geometry",
    ].join(",");

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
      placeId
    )}&fields=${fields}&language=pt-BR&key=${apiKey}`;

    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) {
      console.warn(`[Google Places] Falha ao obter detalhes do place_id ${placeId}: ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    if (data.status !== "OK" || !data.result) {
      console.warn(`[Google Places Details Status]: ${data.status} - ${data.error_message || ""}`);
      return null;
    }

    return data.result;
  } catch (error) {
    console.error(`[Google Places Details Error]`, error);
    return null;
  }
}

/**
 * Busca empresas locais usando a Google Places Text Search API
 * e filtra estritamente as que NÃO possuem website.
 */
export async function searchPlacesWithoutWebsite(
  query: string,
  maxResults: number = 10
): Promise<{ rawPlaces: RawPlace[]; isMockData: boolean }> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  // 1. Trava rígida: Se não tiver API Key, o sistema para aqui e avisa.
  if (!apiKey || apiKey === "MY_GOOGLE_PLACES_API_KEY") {
    console.error("🚨 [ERRO FATAL]: GOOGLE_PLACES_API_KEY não foi encontrada no arquivo .env");
    return { rawPlaces: [], isMockData: false };
  }

  try {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      query
    )}&language=pt-BR&key=${apiKey}`;

    const searchRes = await fetch(searchUrl, { next: { revalidate: 0 } });
    
    if (!searchRes.ok) {
      console.error(`🚨 [ERRO HTTP Google Places]: ${searchRes.status} ${searchRes.statusText}`);
      return { rawPlaces: [], isMockData: false };
    }

    const searchData = await searchRes.json();
    
    // 2. Trava de API: Se o Google recusar a chave (ex: falta de pagamento ou API desativada)
    if (searchData.status !== "OK" && searchData.status !== "ZERO_RESULTS") {
      console.error(`🚨 [ERRO API Google Places]: Status ${searchData.status} - Motivo: ${searchData.error_message || "Desconhecido"}`);
      return { rawPlaces: [], isMockData: false };
    }

    const results = searchData.results || [];
    const placesWithoutWebsite: RawPlace[] = [];

    const candidates = results.slice(0, Math.min(results.length, maxResults * 2));

    for (const candidate of candidates) {
      if (candidate.business_status === "CLOSED_PERMANENTLY") {
        continue;
      }

      const details = await fetchPlaceDetails(candidate.place_id, apiKey);

      const website = details?.website || candidate.website;
      const phone = details?.formatted_phone_number || candidate.formatted_phone_number;

      if (!website || website.trim() === "") {
        const placeLat = details?.geometry?.location?.lat ?? candidate?.geometry?.location?.lat;
        const placeLng = details?.geometry?.location?.lng ?? candidate?.geometry?.location?.lng;

        placesWithoutWebsite.push({
          place_id: candidate.place_id,
          name: details?.name || candidate.name,
          formatted_address: details?.formatted_address || candidate.formatted_address,
          rating: details?.rating ?? candidate.rating ?? 0,
          user_ratings_total: details?.user_ratings_total ?? candidate.user_ratings_total ?? 0,
          formatted_phone_number: phone,
          international_phone_number: details?.international_phone_number,
          website: undefined,
          lat: placeLat,
          lng: placeLng,
        });

        if (placesWithoutWebsite.length >= maxResults) {
          break;
        }
      }
    }

    // Retorna APENAS dados reais
    return {
      rawPlaces: placesWithoutWebsite,
      isMockData: false,
    };
    
  } catch (error) {
    // 3. Se a internet cair ou o fetch falhar, ele loga o erro no console e retorna vazio, sem inventar dados.
    console.error("🚨 [ERRO CATASTRÓFICO na busca do Google Places]:", error);
    return {
      rawPlaces: [],
      isMockData: false,
    };
  }
}
