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

  // Caso a chave ainda não tenha sido configurada no ambiente
  if (!apiKey || apiKey === "MY_GOOGLE_PLACES_API_KEY" || apiKey.startsWith("AIzaSy_fake")) {
    console.warn("[Google Places] GOOGLE_PLACES_API_KEY não configurada. Usando dados demonstrativos reais de Cachoeiro de Itapemirim.");
    return {
      rawPlaces: getMockPlaces(query),
      isMockData: true,
    };
  }

  try {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      query
    )}&language=pt-BR&key=${apiKey}`;

    const searchRes = await fetch(searchUrl, { next: { revalidate: 0 } });
    if (!searchRes.ok) {
      throw new Error(`Google Places HTTP error: ${searchRes.status} ${searchRes.statusText}`);
    }

    const searchData = await searchRes.json();
    if (searchData.status !== "OK" && searchData.status !== "ZERO_RESULTS") {
      throw new Error(`Google Places API returned status: ${searchData.status} - ${searchData.error_message || ""}`);
    }

    const results = searchData.results || [];
    const placesWithoutWebsite: RawPlace[] = [];

    // Limita o número de buscas detalhadas para respeitar cotas e tempo de execução
    const candidates = results.slice(0, Math.min(results.length, maxResults * 2));

    for (const candidate of candidates) {
      // Ignora estabelecimentos permanentemente fechados
      if (candidate.business_status === "CLOSED_PERMANENTLY") {
        continue;
      }

      // Busca os detalhes para verificar telefone e website
      const details = await fetchPlaceDetails(candidate.place_id, apiKey);

      const website = details?.website || candidate.website;
      const phone = details?.formatted_phone_number || candidate.formatted_phone_number;

      // FILTRO CRUCIAL: Apenas empresas SEM website
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

    return {
      rawPlaces: placesWithoutWebsite,
      isMockData: false,
    };
  } catch (error) {
    console.error("[Google Places Search Error]:", error);
    // Em caso de falha de conexão na API do Google, faz fallback gracioso para não quebrar o cron
    return {
      rawPlaces: getMockPlaces(query),
      isMockData: true,
    };
  }
}

/**
 * Dados demonstrativos de alta fidelidade para testes locais imediatos
 */
function getMockPlaces(query: string): RawPlace[] {
  const lower = query.toLowerCase();
  
  // Coordenadas base de acordo com a cidade pesquisada
  let baseLat = -20.8489;
  let baseLng = -41.1128; // Cachoeiro de Itapemirim

  if (lower.includes("vitória") || lower.includes("vitoria")) {
    baseLat = -20.3155;
    baseLng = -40.3128;
  } else if (lower.includes("vila velha")) {
    baseLat = -20.3297;
    baseLng = -40.2925;
  } else if (lower.includes("linhares")) {
    baseLat = -19.3911;
    baseLng = -40.0722;
  } else if (lower.includes("guarapari")) {
    baseLat = -20.6706;
    baseLng = -40.4976;
  }

  return [
    {
      place_id: "ChIJ_mock_marmoraria_1",
      name: "Marmoraria Granito Nobre Cachoeiro",
      formatted_address: "Rod. Engenheiro Fabiano Vivacqua, Cachoeiro de Itapemirim - ES",
      rating: 4.8,
      user_ratings_total: 47,
      formatted_phone_number: "(28) 99945-8812",
      international_phone_number: "+55 28 99945-8812",
      website: undefined,
      lat: baseLat + 0.0082,
      lng: baseLng - 0.0045,
    },
    {
      place_id: "ChIJ_mock_marmoraria_2",
      name: "Itapemirim Mármores & Pedras Decorativas",
      formatted_address: "Av. Mauro Miranda Madureira, 450, Cachoeiro de Itapemirim - ES",
      rating: 4.9,
      user_ratings_total: 62,
      formatted_phone_number: "(28) 99871-3309",
      international_phone_number: "+55 28 99871-3309",
      website: undefined,
      lat: baseLat - 0.0064,
      lng: baseLng + 0.0071,
    },
    {
      place_id: "ChIJ_mock_marmoraria_3",
      name: "Arte em Granitos e Quartzo Sul-Capixaba",
      formatted_address: "R. Bernardo Horta, 120, Guandu, Cachoeiro de Itapemirim - ES",
      rating: 4.7,
      user_ratings_total: 29,
      formatted_phone_number: "(28) 99912-7744",
      international_phone_number: "+55 28 99912-7744",
      website: undefined,
      lat: baseLat + 0.0035,
      lng: baseLng + 0.0052,
    },
    {
      place_id: "ChIJ_mock_marmoraria_4",
      name: "Pedras & Bancadas Imperial",
      formatted_address: "Bairro Campo Leopoldina, Cachoeiro de Itapemirim - ES",
      rating: 4.6,
      user_ratings_total: 18,
      formatted_phone_number: "(28) 99988-1122",
      international_phone_number: "+55 28 99988-1122",
      website: undefined,
      lat: baseLat - 0.0091,
      lng: baseLng - 0.0038,
    },
    {
      place_id: "ChIJ_mock_marmoraria_5",
      name: "Marmoraria Estrela do Sul",
      formatted_address: "Av. Francisco Lacerda de Aguiar, 210, Cachoeiro de Itapemirim - ES",
      rating: 5.0,
      user_ratings_total: 14,
      formatted_phone_number: "(28) 99901-5566",
      international_phone_number: "+55 28 99901-5566",
      website: undefined,
      lat: baseLat + 0.0048,
      lng: baseLng - 0.0084,
    },
  ];
}
