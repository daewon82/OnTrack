import { NextResponse } from "next/server";

/**
 * Open-Meteo 날씨 프록시 (서울 좌표 고정)
 * - 무료, API 키 불필요
 * - 오늘 현재 + 7일 예보
 *
 * 1시간 캐시 (날씨 자주 안 바뀜)
 */

export const revalidate = 3600;

const SEOUL = { lat: 37.5665, lon: 126.978 };

type OpenMeteoResponse = {
  current?: {
    time: string;
    temperature_2m: number;
    precipitation: number;
    weather_code: number;
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
  };
};

export type WeatherDay = {
  date: string;       // "YYYY-MM-DD"
  dayName: string;    // "월"
  isToday: boolean;
  weatherCode: number;
  icon: string;
  willRain: boolean;
  precipMm: number;
  precipProb: number;
  tempMax: number;
  tempMin: number;
};

export type WeatherResponse = {
  current: {
    temp: number;
    weatherCode: number;
    icon: string;
    text: string;
    rainingNow: boolean;
  };
  today: WeatherDay;
  week: WeatherDay[];
};

/** WMO weather code → 아이콘 + 한글 텍스트 */
function describe(code: number): { icon: string; text: string; isRain: boolean } {
  if (code === 0) return { icon: "☀️", text: "맑음", isRain: false };
  if (code === 1 || code === 2) return { icon: "🌤", text: "대체로 맑음", isRain: false };
  if (code === 3) return { icon: "☁️", text: "흐림", isRain: false };
  if (code === 45 || code === 48) return { icon: "🌫", text: "안개", isRain: false };
  if (code >= 51 && code <= 57) return { icon: "🌦", text: "이슬비", isRain: true };
  if (code >= 61 && code <= 67) return { icon: "🌧", text: "비", isRain: true };
  if (code >= 71 && code <= 77) return { icon: "🌨", text: "눈", isRain: false };
  if (code >= 80 && code <= 82) return { icon: "🌧", text: "소나기", isRain: true };
  if (code >= 85 && code <= 86) return { icon: "🌨", text: "눈", isRain: false };
  if (code >= 95 && code <= 99) return { icon: "⛈", text: "뇌우", isRain: true };
  return { icon: "🌡", text: "정보없음", isRain: false };
}

const KOR_DAY = ["일", "월", "화", "수", "목", "금", "토"];

export async function GET() {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${SEOUL.lat}&longitude=${SEOUL.lon}` +
    `&current=temperature_2m,precipitation,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max` +
    `&timezone=Asia%2FSeoul&forecast_days=16`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const json = (await res.json()) as OpenMeteoResponse;
    if (!json.current || !json.daily) {
      return NextResponse.json({ error: "no data" }, { status: 502 });
    }

    const todayDateStr = json.daily.time[0];
    const week: WeatherDay[] = json.daily.time.map((d, i) => {
      // 서버가 UTC라 getDay() 가 어긋남 — UTC 자정으로 parse + getUTCDay 로 KST 날짜의 요일 매핑
      const date = new Date(d + "T00:00:00Z");
      const code = json.daily!.weather_code[i];
      const desc = describe(code);
      const precip = json.daily!.precipitation_sum[i] ?? 0;
      const prob = json.daily!.precipitation_probability_max[i] ?? 0;
      const willRain = desc.isRain || precip >= 0.2 || prob >= 50;
      return {
        date: d,
        dayName: KOR_DAY[date.getUTCDay()],
        isToday: d === todayDateStr,
        weatherCode: code,
        icon: desc.icon,
        willRain,
        precipMm: precip,
        precipProb: prob,
        tempMax: Math.round(json.daily!.temperature_2m_max[i]),
        tempMin: Math.round(json.daily!.temperature_2m_min[i]),
      };
    });

    const today = week[0];
    const cur = json.current;
    const curDesc = describe(cur.weather_code);

    const response: WeatherResponse = {
      current: {
        temp: Math.round(cur.temperature_2m),
        weatherCode: cur.weather_code,
        icon: curDesc.icon,
        text: curDesc.text,
        rainingNow: curDesc.isRain || cur.precipitation > 0,
      },
      today,
      week,
    };

    return NextResponse.json(response);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}
