export type Direction = "long" | "short";
export type TradeResult = "win" | "loss" | "be" | "open";
export type JournalMode = "live" | "study" | "replay";
export type Visibility = "private" | "followers" | "public";
export type TradingSession = "asia" | "london" | "new_york_am" | "new_york_lunch" | "new_york_pm" | "other";
export type ImageType = "htf_analysis" | "setup" | "entry" | "management" | "exit" | "other";

export interface Instrument {
  id: string;
  symbol: string;
  display_name: string;
  asset_class: string;
  exchange: string | null;
  market_timezone: string;
}

export interface Setup {
  id: string;
  user_id: string;
  name: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TradeImage {
  id: string;
  trade_id: string;
  storage_path: string;
  image_type: ImageType;
  timeframe: string;
  position: number;
  created_at: string;
  crop_x: number;
  crop_y: number;
  crop_width: number;
  crop_height: number;
  crop_zoom: number;
  crop_rotation: number;
  aspect_ratio: "4:3";
  signed_url?: string | null;
}

export interface StudyEntry {
  id: string;
  trade_id: string;
  position: number;
  entry_at: string;
  session: TradingSession;
  session_override: boolean;
  direction: Direction;
  planned_rr: number;
  result: TradeResult;
  realized_r: number;
  created_at?: string;
  updated_at?: string;
}

export interface Trade {
  id: string;
  user_id: string;
  instrument_id: string;
  setup_id: string | null;
  trade_date: string;
  entry_at: string | null;
  direction: Direction | null;
  planned_rr: number | null;
  result: TradeResult | null;
  realized_r: number | null;
  journal_mode: JournalMode;
  setup_found: boolean;
  session: TradingSession;
  session_override: boolean;
  notes: string | null;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
  instrument: Instrument;
  setup: Setup | null;
  images: TradeImage[];
  study_entries: StudyEntry[];
}
