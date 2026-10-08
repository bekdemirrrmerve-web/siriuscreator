import type { Competitor, InboxMessage, Platform, ScheduledPost } from "@/lib/types";

/**
 * Deterministic demo data. Shown with a "Demo veri" badge until a real
 * social account connection replaces it.
 * TODO(social): replace with Instagram Graph / TikTok / YouTube Analytics data.
 */

export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  x: "X",
  linkedin: "LinkedIn",
  pinterest: "Pinterest",
};

export const ALL_PLATFORMS = Object.keys(PLATFORM_LABEL) as Platform[];

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export type DailyMetric = {
  date: string;
  platform: Platform;
  reach: number;
  impressions: number;
  engagement: number;
  clicks: number;
  followersGained: number;
};

const BASE: Record<Platform, number> = {
  instagram: 5200,
  tiktok: 8400,
  youtube: 2600,
  x: 1100,
  linkedin: 900,
  pinterest: 1500,
};

export function dailyMetrics(): DailyMetric[] {
  const r = rng(42);
  const out: DailyMetric[] = [];
  const today = new Date();
  for (let d = 89; d >= 0; d--) {
    const day = new Date(today);
    day.setDate(today.getDate() - d);
    const iso = day.toISOString().slice(0, 10);
    const growth = 1 + (89 - d) / 180;
    for (const p of ALL_PLATFORMS) {
      const reach = Math.round(BASE[p] * growth * (0.7 + r() * 0.6));
      const impressions = Math.round(reach * (1.4 + r() * 0.5));
      out.push({
        date: iso,
        platform: p,
        reach,
        impressions,
        engagement: Math.round(reach * (0.04 + r() * 0.05)),
        clicks: Math.round(reach * (0.004 + r() * 0.01)),
        followersGained: Math.round(BASE[p] / 250 * (0.5 + r())),
      });
    }
  }
  return out;
}

export const FOLLOWERS: Record<Platform, number> = {
  instagram: 48200,
  tiktok: 91400,
  youtube: 12800,
  x: 6300,
  linkedin: 4100,
  pinterest: 7900,
};

export type PostPerf = {
  id: string;
  platform: Platform;
  content: string;
  format: string;
  date: string;
  reach: number;
  views: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
};

const POST_TITLES: [Platform, string, string][] = [
  ["instagram", "Ev kahvesini 60 saniyede profesyonelleştir", "Reels"],
  ["tiktok", "Kadıköy'de 100 TL ile bir gün", "TikTok"],
  ["instagram", "Freelancer'lar için 5 fatura hatası", "Carousel"],
  ["youtube", "Minimal çalışma masası kurulumu", "Short"],
  ["tiktok", "Seramik atölyesinde ilk denemem", "TikTok"],
  ["linkedin", "Tek kişilik ajans kurarken öğrendiklerim", "Metin"],
  ["instagram", "Soğuk demleme tarifinin sırrı", "Reels"],
  ["x", "İçerik takvimini 1 saatte hazırlama yöntemi", "Thread"],
  ["pinterest", "Sonbahar kapsül dolap fikirleri", "Pin"],
  ["tiktok", "Market fişimi analiz ettim", "TikTok"],
  ["instagram", "Ürün fotoğrafı: telefonla stüdyo ışığı", "Carousel"],
  ["youtube", "1 haftada 30 içerik çektim", "Short"],
  ["instagram", "Kullanıcı yorumu: el yapımı sabun", "UGC"],
  ["tiktok", "3 malzemeli kahvaltı", "TikTok"],
  ["linkedin", "Müşteri teklifini nasıl fiyatlıyorum", "Metin"],
];

export function postPerformance(): PostPerf[] {
  const r = rng(7);
  const today = new Date();
  return POST_TITLES.map(([platform, content, format], i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - Math.round(i * 5.5 + r() * 3));
    const reach = Math.round(BASE[platform] * (1.5 + r() * 6));
    const likes = Math.round(reach * (0.03 + r() * 0.06));
    return {
      id: `perf-${i}`,
      platform,
      content,
      format,
      date: d.toISOString().slice(0, 10),
      reach,
      views: Math.round(reach * (1.3 + r())),
      likes,
      comments: Math.round(likes * (0.04 + r() * 0.08)),
      saves: Math.round(likes * (0.1 + r() * 0.3)),
      shares: Math.round(likes * (0.05 + r() * 0.2)),
    };
  });
}

/** 7 days x 24 hours engagement intensity 0-1 (Mon first). */
export function heatmap(): number[][] {
  const r = rng(11);
  return Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, h) => {
      const evening = Math.exp(-((h - 20) ** 2) / 8);
      const lunch = Math.exp(-((h - 12.5) ** 2) / 3) * 0.55;
      const weekend = day >= 5 ? 1.15 : 1;
      return Math.min(1, (evening + lunch) * weekend * (0.75 + r() * 0.3));
    }),
  );
}

export const DAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export const BEST_TIMES: Record<Platform, string[]> = {
  instagram: ["Salı 20:00", "Perşembe 12:30", "Pazar 21:00"],
  tiktok: ["Çarşamba 21:00", "Cuma 19:30", "Cumartesi 22:00"],
  youtube: ["Cumartesi 11:00", "Pazar 17:00"],
  x: ["Pazartesi 09:00", "Çarşamba 13:00"],
  linkedin: ["Salı 08:30", "Perşembe 10:00"],
  pinterest: ["Cumartesi 20:00", "Pazar 14:00"],
};

function at(dayOffset: number, hour: number, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function demoPosts(): ScheduledPost[] {
  return [
    { id: "post-d1", platform: "instagram", scheduledAt: at(1, 20), caption: "Ev kahvesini 60 saniyede profesyonelleştiren 3 hareket ☕ Kaydet, sabah lazım olacak.", mediaName: "kahve-reels.mp4", status: "scheduled", demo: true },
    { id: "post-d2", platform: "tiktok", scheduledAt: at(2, 21), caption: "100 TL ile Kadıköy'de bir gün — part 2 geliyor.", mediaName: "kadikoy.mp4", status: "scheduled", demo: true },
    { id: "post-d3", platform: "linkedin", scheduledAt: at(3, 8, 30), caption: "Tek kişilik ajansta ilk yılımdan 5 ders.", status: "draft", demo: true },
    { id: "post-d4", platform: "instagram", scheduledAt: at(-2, 12, 30), caption: "Telefonla stüdyo ışığı: 4 slaytta ürün fotoğrafı.", mediaName: "carousel.zip", status: "published", demo: true },
    { id: "post-d5", platform: "youtube", scheduledAt: at(-1, 11), caption: "1 haftada 30 içerik çektim #shorts", mediaName: "30-icerik.mp4", status: "failed", demo: true },
    { id: "post-d6", platform: "pinterest", scheduledAt: at(5, 20), caption: "Sonbahar kapsül dolap: 12 parça, 30 kombin.", mediaName: "kapsul.jpg", status: "scheduled", demo: true },
  ];
}

function ago(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export function demoInbox(): InboxMessage[] {
  return [
    { id: "in-1", platform: "instagram", kind: "comment", author: "Elif Kaya", handle: "@elifkahvede", text: "Hangi değirmeni kullanıyorsun? Linki var mı?", postRef: "Ev kahvesini 60 saniyede…", createdAt: ago(12), read: false, replied: false },
    { id: "in-2", platform: "tiktok", kind: "comment", author: "Mert", handle: "@mertgezer", text: "100 TL gerçekten yetti mi, ulaşım dahil mi 😅", postRef: "Kadıköy'de 100 TL…", createdAt: ago(45), read: false, replied: false },
    { id: "in-3", platform: "instagram", kind: "dm", author: "Lumi Kozmetik", handle: "@lumikozmetik", text: "Merhaba! Yeni serumumuz için UGC iş birliği düşünüyoruz, fiyat listenizi paylaşabilir misiniz?", createdAt: ago(130), read: false, replied: false },
    { id: "in-4", platform: "youtube", kind: "comment", author: "Deniz A.", handle: "@denizuretir", text: "Masa lambası modeli neydi?", postRef: "Minimal çalışma masası", createdAt: ago(300), read: true, replied: true, reply: "Açıklamaya ekledim Deniz, teşekkürler!" },
    { id: "in-5", platform: "linkedin", kind: "dm", author: "Selin Aydın", handle: "Selin Aydın", text: "Paylaştığınız fiyatlama yazısı çok faydalıydı. Ekibimize kısa bir sunum yapar mısınız?", createdAt: ago(600), read: true, replied: false },
    { id: "in-6", platform: "tiktok", kind: "dm", author: "Zeynep", handle: "@zeynepceramic", text: "Atölye adresini atabilir misin? 🙏", createdAt: ago(1440), read: true, replied: false },
    { id: "in-7", platform: "x", kind: "comment", author: "Can Ö.", handle: "@canozturk", text: "Thread'in 4. maddesi altın değerinde.", postRef: "İçerik takvimi thread", createdAt: ago(2000), read: true, replied: true, reply: "Çok sevindim Can 🙌" },
  ];
}

export function demoCompetitors(): Competitor[] {
  return [
    { id: "cmp-1", handle: "@kahvelaboratuvari", platform: "instagram", followers: 126000, avgEngagement: 3.8, postsPerWeek: 5, topFormat: "Reels", demo: true },
    { id: "cmp-2", handle: "@ucuzgezgin", platform: "tiktok", followers: 342000, avgEngagement: 6.1, postsPerWeek: 9, topFormat: "Vlog / POV", demo: true },
    { id: "cmp-3", handle: "@evdeuretim", platform: "instagram", followers: 58000, avgEngagement: 5.2, postsPerWeek: 3, topFormat: "Carousel", demo: true },
  ];
}

export type Trend = {
  id: string;
  platform: "instagram" | "tiktok" | "youtube";
  title: string;
  why: string;
  keywords: string[];
  format: string;
  momentum: number;
};

export const TRENDS: Trend[] = [
  { id: "t1", platform: "tiktok", title: "“Bunu kimse söylemiyor” itiraf formatı", why: "İlk 2 saniyede merak boşluğu yaratıyor, izlenme süresi yüksek.", keywords: ["itiraf", "kimse söylemiyor", "gerçek"], format: "Yüze konuşma + altyazı", momentum: 92 },
  { id: "t2", platform: "instagram", title: "Önce / sonra 3 slaytlık dönüşüm carousel'i", why: "Kaydetme oranı ortalamanın 2 katı.", keywords: ["öncesonra", "dönüşüm", "ipucu"], format: "Carousel", momentum: 84 },
  { id: "t3", platform: "youtube", title: "“1 haftada X yaptım” deney Short'ları", why: "Seri potansiyeli yüksek, abone dönüşümü güçlü.", keywords: ["deney", "1 hafta", "challenge"], format: "YouTube Short", momentum: 78 },
  { id: "t4", platform: "tiktok", title: "Market fişi / bütçe analizi", why: "Enflasyon gündemi sayesinde yorum ve paylaşım yoğun.", keywords: ["bütçe", "market", "tasarruf"], format: "Ekran + ses", momentum: 88 },
  { id: "t5", platform: "instagram", title: "Sessiz vlog: sabah rutini ASMR", why: "Sesi kapalı izleyenler için yüksek tamamlanma.", keywords: ["sessizvlog", "rutin", "asmr"], format: "Reels", momentum: 71 },
  { id: "t6", platform: "youtube", title: "Setup turu: 3 bütçe seviyesi", why: "Karşılaştırma formatı arama trafiği çekiyor.", keywords: ["setup", "bütçe", "masa"], format: "Uzun video + Short", momentum: 66 },
  { id: "t7", platform: "tiktok", title: "Yerel esnaf hikâyeleri", why: "Topluluk hissi ve paylaşım motivasyonu yüksek.", keywords: ["esnaf", "yerel", "hikaye"], format: "Mini belgesel", momentum: 74 },
  { id: "t8", platform: "instagram", title: "Mikro eğitim: 30 saniyede tek ipucu", why: "Kısa, kaydedilebilir; algoritma eğitici içeriği öne çıkarıyor.", keywords: ["ipucu", "öğren", "30saniye"], format: "Reels", momentum: 81 },
];
