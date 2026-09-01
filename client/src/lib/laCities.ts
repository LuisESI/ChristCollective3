// Los Angeles County — the 88 incorporated cities plus well-known LA City
// neighborhoods & unincorporated communities. Used for the founding funnel's
// city picker (select-only, so no invalid/made-up cities get entered).
const RAW: string[] = [
  // Incorporated cities
  "Agoura Hills", "Alhambra", "Arcadia", "Artesia", "Avalon", "Azusa", "Baldwin Park", "Bell",
  "Bell Gardens", "Bellflower", "Beverly Hills", "Bradbury", "Burbank", "Calabasas", "Carson",
  "Cerritos", "Claremont", "Commerce", "Compton", "Covina", "Cudahy", "Culver City", "Diamond Bar",
  "Downey", "Duarte", "El Monte", "El Segundo", "Gardena", "Glendale", "Glendora", "Hawaiian Gardens",
  "Hawthorne", "Hermosa Beach", "Hidden Hills", "Huntington Park", "Industry", "Inglewood", "Irwindale",
  "La Cañada Flintridge", "La Habra Heights", "La Mirada", "La Puente", "La Verne", "Lakewood",
  "Lancaster", "Lawndale", "Lomita", "Long Beach", "Los Angeles", "Lynwood", "Malibu", "Manhattan Beach",
  "Maywood", "Monrovia", "Montebello", "Monterey Park", "Norwalk", "Palmdale", "Palos Verdes Estates",
  "Paramount", "Pasadena", "Pico Rivera", "Pomona", "Rancho Palos Verdes", "Redondo Beach", "Rolling Hills",
  "Rolling Hills Estates", "Rosemead", "San Dimas", "San Fernando", "San Gabriel", "San Marino",
  "Santa Clarita", "Santa Fe Springs", "Santa Monica", "Sierra Madre", "Signal Hill", "South El Monte",
  "South Gate", "South Pasadena", "Temple City", "Torrance", "Vernon", "Walnut", "West Covina",
  "West Hollywood", "Westlake Village", "Whittier",
  // LA City neighborhoods & unincorporated communities
  "Atwater Village", "Bel Air", "Boyle Heights", "Brentwood", "Canoga Park", "Century City", "Chatsworth",
  "Chinatown", "Crenshaw", "Downtown LA", "Eagle Rock", "Echo Park", "Encino", "Granada Hills",
  "Hancock Park", "Harbor City", "Highland Park", "Hollywood", "Koreatown", "Ladera Heights", "Larchmont",
  "Leimert Park", "Los Feliz", "Marina del Rey", "Mar Vista", "Mid-City", "Mid-Wilshire", "North Hollywood",
  "Northridge", "Pacific Palisades", "Palms", "Panorama City", "Playa del Rey", "Playa Vista", "Porter Ranch",
  "Reseda", "San Pedro", "Sawtelle", "Sherman Oaks", "Silver Lake", "Studio City", "Sun Valley", "Sylmar",
  "Tarzana", "Toluca Lake", "Tujunga", "Valley Village", "Van Nuys", "Venice", "Watts", "West Los Angeles",
  "Westchester", "Westwood", "Winnetka", "Woodland Hills",
];

export const LA_CITIES: string[] = Array.from(new Set(RAW)).sort((a, b) => a.localeCompare(b));
