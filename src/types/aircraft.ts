export type Aircraft = {
  t?: string;
  flight?: string;
  alt_geom?: number;
  lat?: number;
  lon?: number;
  gs?: number;
};

export type AdsbResponse = {
  ac?: Aircraft[];
};
