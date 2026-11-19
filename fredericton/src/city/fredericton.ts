export const city = {
  name: "Fredericton",
  province: "NB",
  timeZone: "America/Moncton",
  lat: 45.9636,
  lon: -66.6431,
  eccc: {
    citypageId: "nb-29",
    hydrometricStation: "01AK003",
    aqhiLocationId: "DAFMJ",
  },
  river: {
    name: "Wolastoq (Saint John River)",
    // GNB River Watch flood stage for Fredericton. Verify against GNB before launch.
    floodStageMetres: 6.5,
  },
} as const;
