/**
 * Deterministic mock responses for Sirius dev mode.
 * Used only when SIRIUS_API_URL is not configured on the server.
 * TODO(sirius): delete once every real endpoint is wired.
 */

export type MockRequest = {
  route: string;
  task?: string | undefined;
  payload: Record<string, unknown>;
};

const pick = <T>(arr: T[], seed: string, offset = 0): T =>
  arr[(hash(seed) + offset) % arr.length]!;

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

const cap = (s: string) => (s ? s[0]!.toLocaleUpperCase("tr-TR") + s.slice(1) : s);

/** Media routes that are not yet live in the Sirius backend mock. */
export const MOCK_UNAVAILABLE_ROUTES = new Set([
  "/v1/video/create",
  "/v1/avatar/create",
  "/v1/avatar/talk",
]);

export function mockResponse(req: MockRequest): unknown {
  const { route, task = "", payload } = req;
  const prompt = String(payload["prompt"] ?? payload["idea"] ?? payload["destination"] ?? "");

  if (route === "/v1/research") {
    if (task === "trip.research") return tripResearch(prompt);
    return {
      trends: [
        {
          title: `${cap(prompt) || "Konu"} için "önce sonuç, sonra süreç" kurgusu`,
          why: "İlk 2 saniyede sonucu gösteren videolar bu hafta %38 daha fazla izlenme alıyor.",
        },
        {
          title: "Sessiz vlog + altyazı katmanı",
          why: "Ses kapalı izlenme oranı yüksek; altyazılı kısa formatlar öne çıkıyor.",
        },
        {
          title: "Tek çekim, 3 kesit",
          why: "Düşük prodüksiyon maliyeti, yüksek tamamlanma oranı.",
        },
        {
          title: "Yorumdan içerik üretme",
          why: "Topluluk sorularına cevap veren formatlar kaydedilme oranını artırıyor.",
        },
      ],
      keywords: [prompt || "içerik", "kısa video", "hook", "algoritma", "2026 trend"],
    };
  }

  if (route === "/v1/generate") {
    if (task === "creator.package") return creatorPackage(payload);
    if (task === "creator.hooks") return { hooks: hooks(prompt) };
    if (task === "creator.repurpose") return { variants: repurpose(payload) };
    if (task === "creator.calendar") return { calendar: calendar(prompt) };
    if (task === "trip.plan") return tripPlan(payload);
    if (task === "trip.day") return { day: tripDay(payload, Number(payload["dayNumber"] ?? 1)) };
  }

  if (route === "/v1/chat") {
    return { message: chatReply(String(payload["message"] ?? ""), String(payload["product"] ?? "")) };
  }

  if (route === "/v1/memory") {
    return { ok: true, stored: payload };
  }

  if (route === "/v1/tools") {
    return { tools: ["research", "image.create", "image.edit", "audio.create"] };
  }

  if (route === "/v1/image/create" || route === "/v1/image/edit") {
    return {
      status: "done",
      // Placeholder visual generated locally; clearly labelled in the UI as demo output.
      resultUrl: null,
      message: "Demo modunda görsel önizlemesi üretildi (gerçek görsel servisi bağlı değil).",
      demo: true,
    };
  }

  if (route === "/v1/audio/create") {
    return { status: "done", resultUrl: null, demo: true, message: "Demo seslendirme hazır." };
  }

  return { ok: true };
}

function chatReply(message: string, product: string) {
  if (product === "__none__") {
    return `Bunu plana işledim: "${message}". Sağdaki güzergâhı güncelledim; istersen tek bir günü yeniden üretebilirim.`;
  }
  return `Anladım: "${message}". İçerik paketini buna göre güncelledim. Hook'u ya da senaryoyu ayrı ayrı yeniden üretmemi isteyebilirsin.`;
}

function hooks(idea: string): string[] {
  const base = idea || "bu fikir";
  return [
    `"${cap(base)} hakkında herkesin yanlış bildiği 3 şey"`,
    `"3 gün denedim, sonuç beklediğim gibi olmadı."`,
    `"Bunu daha önce bilseydim ${base} için haftalar kazanırdım."`,
    `"Kimse söylemiyor ama ${base} işinde asıl fark burada."`,
  ];
}

function creatorPackage(payload: Record<string, unknown>) {
  const idea = String(payload["idea"] ?? "içerik fikri");
  const platform = String(payload["platform"] ?? "instagram");
  const tone = String(payload["tone"] ?? "samimi");
  const hookList = hooks(idea);

  return {
    research: [
      `Trend bağlamı: ${cap(idea)} konusunda kısa format içerikler bu ay yükselişte.`,
      `Platform notu: ${platform} için ilk 2 saniye ve altyazı kritik.`,
      `Ton: ${tone}. Rakip içeriklerde eksik olan şey: net bir sonuç vaadi.`,
    ].join("\n"),
    hook: hookList.join("\n"),
    script: [
      `0-2sn (HOOK): ${hookList[0]}`,
      `2-6sn: Sorunu tek cümleyle kur — "${cap(idea)} denerken çoğu kişi burada takılıyor."`,
      "6-14sn: 3 adımı hızlı kesitlerle göster. Her adımda ekranda kısa metin.",
      "14-22sn: Sonucu göster, kanıt/önce-sonra ekle.",
      "22-28sn: Kısa özet + izleyiciye mikro görev ver.",
      "28-30sn: CTA.",
    ].join("\n"),
    shotlist: [
      "0-2sn | Yakın plan yüz, doğal ışık | Hook'u söyle",
      "2-6sn | Masa üstü üstten çekim | Sorunu göster",
      "6-14sn | 3 hızlı kesit, el detayları | Adımları uygula",
      "14-22sn | Önce/sonra yan yana | Sonucu göster",
      "22-30sn | Orta plan, kameraya bak | Özet + CTA",
    ].join("\n"),
    caption: `${cap(idea)} için kısa bir rehber 👇\n\nÇoğu kişi ilk adımda vazgeçiyor. Bu 3 adımı sırayla uygula, farkı ilk haftada gör.\n\nKaydet, sonra lazım olacak.`,
    cta: "Bunu denemek istiyorsan yorumlara \"başlıyorum\" yaz, adım adım listeyi göndereyim.",
    hashtags: [
      "#içeriküretimi",
      "#reels",
      "#" + (idea.split(" ")[0] || "sirius").toLocaleLowerCase("tr-TR"),
      "#kısavideo",
      "#ipucu",
      "#2026",
    ].join(" "),
    imagePrompts: [
      `Kapak görseli: ${idea} temalı, yumuşak doğal ışık, sade arka plan, dikey 9:16 kompozisyon`,
      `Carousel 1: büyük tipografi ile "${hookList[0]}" başlığı, minimal düzen`,
      `Carousel 2: 3 adımın ikon tabanlı görselleştirmesi`,
    ].join("\n"),
    voiceover: `Sakin ve ${tone} bir ton. Hook'u vurgulu oku, adımlarda temposunu biraz artır, CTA'da yavaşla.`,
  };
}

function repurpose(payload: Record<string, unknown>) {
  const idea = String(payload["idea"] ?? "fikir");
  return [
    { label: "Reel (30sn)", content: `Hızlı hook + 3 adım + CTA. Odak: ${idea} sonucunu göstermek.` },
    { label: "Story (3 kare)", content: "1) Soru sor 2) Mini ipucu ver 3) Ankete yönlendir." },
    {
      label: "Carousel (6 slayt)",
      content: "1 Kapak · 2 Problem · 3-5 Adımlar · 6 Özet + CTA",
    },
    { label: "Kısa caption", content: `${cap(idea)} için 3 adım. Kaydet, sonra lazım olacak.` },
  ];
}

function calendar(idea: string) {
  const days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];
  const items = [
    `Reel: ${idea} — 3 adım`,
    "Story: Anket + soru kutusu",
    "Carousel: Detaylı rehber",
    "Kısa video: Yorumlara cevap",
    "UGC: Kullanıcı deneyimi",
  ];
  return days.map((day, i) => ({ day, item: items[i]! }));
}

/* ---------------------------------- trip ---------------------------------- */

function tripResearch(destination: string) {
  const d = cap(destination || "hedef");
  return {
    summary: `${d} için güncel araştırma özeti: en iyi sezon, ortalama günlük bütçe, ulaşım seçenekleri ve kalabalık saatleri derlendi.`,
    highlights: [
      `${d} merkezinde çoğu nokta yürüme mesafesinde`,
      "Toplu taşıma kartı ilk gün alınırsa ciddi tasarruf sağlıyor",
      "Popüler müzeler için sabah erken saatler öneriliyor",
    ],
  };
}

const CATEGORIES = ["Gezi", "Müze", "Yemek", "Doğa", "Alışveriş", "Manzara", "Kafe"];

function place(seed: string, destination: string, idx: number) {
  const names = [
    `${cap(destination)} Eski Şehir turu`,
    `Yerel pazar molası`,
    `Panoramik teras`,
    `Şehir müzesi`,
    `Sahil/park yürüyüşü`,
    `Yerel mutfak deneyimi`,
    `Butik kahveci`,
    `Gün batımı noktası`,
  ];
  return {
    id: `${seed}-${idx}`,
    name: pick(names, seed, idx),
    category: pick(CATEGORIES, seed, idx + 3),
    durationMinutes: [60, 90, 120, 45][(hash(seed) + idx) % 4]!,
    notes: pick(
      [
        "Sabah saatleri daha sakin.",
        "Rezervasyon önerilir.",
        "Nakit bulundurmak işe yarıyor.",
        "Yürüyüş mesafesi kısa.",
      ],
      seed,
      idx + 5,
    ),
    // Koordinatlar backend'den gelmediği sürece uydurulmaz.
    geo: { status: "unresolved" as const },
  };
}

function tripDay(payload: Record<string, unknown>, dayNumber: number) {
  const destination = String(payload["destination"] ?? "hedef");
  const refinement = String(payload["refinement"] ?? "");
  const seed = `${destination}-${dayNumber}-${refinement}`;
  const titles = [
    "Şehirle tanışma",
    "Kültür ve müzeler",
    "Doğa ve manzara",
    "Yerel lezzetler",
    "Serbest keşif",
  ];
  return {
    id: `day-${dayNumber}-${hash(seed) % 9999}`,
    dayNumber,
    title: `${dayNumber}. Gün · ${pick(titles, seed, dayNumber)}`,
    morning: [place(seed + "m", destination, 1)],
    afternoon: [place(seed + "a", destination, 2), place(seed + "a2", destination, 6)],
    evening: [place(seed + "e", destination, 3)],
    status: "done" as const,
  };
}

function tripPlan(payload: Record<string, unknown>) {
  const destination = String(payload["destination"] ?? "hedef");
  const dayCount = Math.min(Math.max(Number(payload["dayCount"] ?? 4), 1), 10);
  const travelers = Number(payload["travelers"] ?? 2);
  return {
    overview: `${cap(destination)} için ${dayCount} günlük, ${travelers} kişilik dengeli bir plan hazırladım. İlk gün merkezi keşif, ortadaki günler kültür ve doğa, son gün serbest zaman ve alışveriş üzerine kurgulandı.`,
    days: Array.from({ length: dayCount }, (_, i) => tripDay(payload, i + 1)),
    budgetLines: [
      { label: "Konaklama", amount: 320 * dayCount, currency: "EUR" },
      { label: "Yemek", amount: 55 * dayCount * travelers, currency: "EUR" },
      { label: "Ulaşım", amount: 40 * dayCount, currency: "EUR" },
      { label: "Aktivite & müze", amount: 35 * dayCount * travelers, currency: "EUR" },
    ],
    packing: [
      "Rahat yürüyüş ayakkabısı",
      "Hafif yağmurluk",
      "Şarj adaptörü",
      "Pasaport / kimlik kopyası",
      "Küçük sırt çantası",
      "Güneş gözlüğü",
    ].map((label, i) => ({ id: `pack-${i}`, label, done: false })),
    transport: `${cap(destination)} içinde toplu taşıma + yürüyüş yeterli. Havalimanı transferi için ekspres tren en hızlısı.`,
    food: "Sabah yerel fırın, öğle hafif sokak lezzeti, akşam rezervasyonlu restoran önerilir.",
  };
}
