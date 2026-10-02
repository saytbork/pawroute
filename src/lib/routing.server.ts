// Route provider abstraction. Mapbox implementation when MAPBOX_ACCESS_TOKEN is set;
// otherwise `null` provider — callers must never invent travel minutes.

export type Point = { lat: number; lng: number };

export interface RouteProvider {
  name: string;
  geocode(query: string): Promise<(Point & { label: string }) | null>;
  /** Driving durations in whole minutes, matrix[i][j] from points[i] to points[j]. */
  matrix(points: Point[]): Promise<number[][] | null>;
}

export function getRouteProvider(): RouteProvider | null {
  const token = process.env["MAPBOX_ACCESS_TOKEN"];
  if (!token) return null;
  return {
    name: "mapbox",
    async geocode(query) {
      const cached = await readCache(query);
      if (cached) return cached;
      const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(query)}&country=ca&limit=1&access_token=${token}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`Mapbox geocode failed [${res.status}]: ${await res.text()}`);
        return null;
      }
      const body = (await res.json()) as {
        features?: {
          geometry: { coordinates: [number, number] };
          properties?: { full_address?: string };
        }[];
      };
      const f = body.features?.[0];
      if (!f) return null;
      const out = {
        lng: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
        label: f.properties?.full_address ?? query,
      };
      await writeCache(query, out);
      return out;
    },
    async matrix(points) {
      if (points.length < 2) return points.map(() => [0]);
      if (points.length > 25) return null;
      const coords = points.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(";");
      const res = await fetch(
        `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coords}?annotations=duration&access_token=${token}`,
      );
      if (!res.ok) {
        console.error(`Mapbox matrix failed [${res.status}]: ${await res.text()}`);
        return null;
      }
      const body = (await res.json()) as { durations?: (number | null)[][] };
      if (!body.durations) return null;
      return body.durations.map((row) => row.map((s) => (s == null ? 999 : Math.round(s / 60))));
    },
  };
}

async function readCache(query: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("geocode_cache")
    .select("lat,lng,label")
    .eq("query", query.toLowerCase())
    .maybeSingle();
  return data ? { lat: data.lat, lng: data.lng, label: data.label ?? query } : null;
}

async function writeCache(query: string, p: Point & { label: string }) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("geocode_cache")
    .upsert({ query: query.toLowerCase(), lat: p.lat, lng: p.lng, label: p.label });
}