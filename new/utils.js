function compressImage(file, width, height, targetKB = 7.99, minQuality = 0.0) {
  return new Promise(resolve => {
    if ((file.type === 'image/jpeg' || file.type === 'image/jpg') && file.size / 1024 <= targetKB) {
      return resolve(file);
    }
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      const compress = q => {
        canvas.toBlob(blob => {
          if (blob.size / 1024 <= targetKB || q <= 0.04) {
            resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
          } else {
            compress(q - 0.035);
          }
        }, 'image/jpeg', q);
      };
      let estimateQuality = Math.max(minQuality, Math.min(0.95, Math.max(0.1, (targetKB * 6000) / (width * height))) + 0.05);
      compress(estimateQuality);
    };
    img.src = URL.createObjectURL(file);
  });
}

async function compressAggressive(file) {
  const maxSize = 720;
  if (file.type.startsWith('image/')) {
    if (file.type === 'image/gif') {
      return file;
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        let width = img.width;
        let height = img.height;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        const quality = file.size / 1024 < 27 ? 7.98 : 41.0; // 57/ 23.0
        compressImage(file, width, height, quality).then(resolve);
      };
      img.src = URL.createObjectURL(file);
    });
  }
  return file;
}

function getColorBySeed(seed, minColor = 100, maxColor = 256) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
      hash ^= seed.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  hash = hash >>> 0;
  const multColor = maxColor - minColor;
  const r = (((hash & 0xFF0000) >> 16) / 255) * multColor + minColor;
  const g = (((hash & 0x00FF00) >> 8) / 255) * multColor + minColor;
  const b = ((hash & 0x0000FF) / 255) * multColor + minColor;
  const hex = n => Math.floor(n).toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

async function tryTranslateOrNull(englishText, targetLocal = 'ru') {
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLocal}&dt=t&q=${encodeURIComponent(englishText)}`);
    const data = await res.json();
    const translated = Array.isArray(data?.[0]) ? data[0].map(x => x?.[0]).filter(Boolean).join("") : null;
    if (translated && translated !== englishText) {
      return translated;
    }
  } catch (e) { }
  try {
    if (!("Translator" in window)) return null;
    const translator = await Translator.create({ sourceLanguage: "en", targetLanguage: targetLocal });
    const result = await translator.translate(englishText);
    return result;
  } catch (e) { }
  return null;
}

function getRandomSid(len = 38) {
  return [...Array(len)].map(() => 'abcdefghjkmnpqrstuvwxyz0123456789'[Math.floor(Math.random()*33)]).join('');
}

function formatPostDate(utcTimestamp) {
  if (!utcTimestamp) return 'Just now';
  const date = new Date(utcTimestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30.44);
  const diffYears = Math.floor(diffDays / 365.25);
  if (diffMins < 1) return 'few seconds ago';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  if (diffYears < 2) return '1 year ago';
  return `${diffYears} years ago`;
}

const timezoneToCountry = {
  "Europe/Andorra": "ad",
  "Asia/Dubai": "ae",
  "Asia/Kabul": "af",
  "America/Antigua": "ag",
  "America/Anguilla": "ai",
  "Europe/Tirane": "al",
  "Asia/Yerevan": "am",
  "Africa/Luanda": "ao",
  "Antarctica/McMurdo": "aq",
  "Antarctica/Casey": "aq",
  "Antarctica/Davis": "aq",
  "Antarctica/DumontDUrville": "aq",
  "Antarctica/Mawson": "aq",
  "Antarctica/Palmer": "aq",
  "Antarctica/Rothera": "aq",
  "Antarctica/Syowa": "aq",
  "Antarctica/Troll": "aq",
  "Antarctica/Vostok": "aq",
  "America/Argentina/Buenos_Aires": "ar",
  "America/Argentina/Cordoba": "ar",
  "America/Argentina/Salta": "ar",
  "America/Argentina/Jujuy": "ar",
  "America/Argentina/Tucuman": "ar",
  "America/Argentina/Catamarca": "ar",
  "America/Argentina/La_Rioja": "ar",
  "America/Argentina/San_Juan": "ar",
  "America/Argentina/Mendoza": "ar",
  "America/Argentina/San_Luis": "ar",
  "America/Argentina/Rio_Gallegos": "ar",
  "America/Argentina/Ushuaia": "ar",
  "Pacific/Pago_Pago": "as",
  "Europe/Vienna": "at",
  "Australia/Lord_Howe": "au",
  "Antarctica/Macquarie": "au",
  "Australia/Hobart": "au",
  "Australia/Melbourne": "au",
  "Australia/Sydney": "au",
  "Australia/Broken_Hill": "au",
  "Australia/Brisbane": "au",
  "Australia/Lindeman": "au",
  "Australia/Adelaide": "au",
  "Australia/Darwin": "au",
  "Australia/Perth": "au",
  "Australia/Eucla": "au",
  "America/Aruba": "aw",
  "Europe/Mariehamn": "ax",
  "Asia/Baku": "az",
  "Europe/Sarajevo": "ba",
  "America/Barbados": "bb",
  "Asia/Dhaka": "bd",
  "Europe/Brussels": "be",
  "Africa/Ouagadougou": "bf",
  "Europe/Sofia": "bg",
  "Asia/Bahrain": "bh",
  "Africa/Bujumbura": "bi",
  "Africa/Porto-Novo": "bj",
  "America/St_Barthelemy": "bl",
  "Atlantic/Bermuda": "bm",
  "Asia/Brunei": "bn",
  "America/La_Paz": "bo",
  "America/Kralendijk": "bq",
  "America/Noronha": "br",
  "America/Belem": "br",
  "America/Fortaleza": "br",
  "America/Recife": "br",
  "America/Araguaina": "br",
  "America/Maceio": "br",
  "America/Bahia": "br",
  "America/Sao_Paulo": "br",
  "America/Campo_Grande": "br",
  "America/Cuiaba": "br",
  "America/Santarem": "br",
  "America/Porto_Velho": "br",
  "America/Boa_Vista": "br",
  "America/Manaus": "br",
  "America/Eirunepe": "br",
  "America/Rio_Branco": "br",
  "America/Nassau": "bs",
  "Asia/Thimphu": "bt",
  "Africa/Gaborone": "bw",
  "Europe/Minsk": "by",
  "America/Belize": "bz",
  "America/St_Johns": "ca",
  "America/Halifax": "ca",
  "America/Glace_Bay": "ca",
  "America/Moncton": "ca",
  "America/Goose_Bay": "ca",
  "America/Blanc-Sablon": "ca",
  "America/Toronto": "ca",
  "America/Iqaluit": "ca",
  "America/Atikokan": "ca",
  "America/Winnipeg": "ca",
  "America/Resolute": "ca",
  "America/Rankin_Inlet": "ca",
  "America/Regina": "ca",
  "America/Swift_Current": "ca",
  "America/Edmonton": "ca",
  "America/Cambridge_Bay": "ca",
  "America/Inuvik": "ca",
  "America/Vancouver": "ca",
  "America/Creston": "ca",
  "America/Dawson_Creek": "ca",
  "America/Fort_Nelson": "ca",
  "America/Whitehorse": "ca",
  "America/Dawson": "ca",
  "Indian/Cocos": "cc",
  "Africa/Kinshasa": "cd",
  "Africa/Lubumbashi": "cd",
  "Africa/Bangui": "cf",
  "Africa/Brazzaville": "cg",
  "Europe/Zurich": "ch",
  "Africa/Abidjan": "ci",
  "Pacific/Rarotonga": "ck",
  "America/Santiago": "cl",
  "America/Coyhaique": "cl",
  "America/Punta_Arenas": "cl",
  "Pacific/Easter": "cl",
  "Africa/Douala": "cm",
  "Asia/Shanghai": "cn",
  "Asia/Urumqi": "cn",
  "America/Bogota": "co",
  "America/Costa_Rica": "cr",
  "America/Havana": "cu",
  "Atlantic/Cape_Verde": "cv",
  "America/Curacao": "cw",
  "Indian/Christmas": "cx",
  "Asia/Nicosia": "cy",
  "Asia/Famagusta": "cy",
  "Europe/Prague": "cz",
  "Europe/Berlin": "de",
  "Europe/Busingen": "de",
  "Africa/Djibouti": "dj",
  "Europe/Copenhagen": "dk",
  "America/Dominica": "dm",
  "America/Santo_Domingo": "do",
  "Africa/Algiers": "dz",
  "America/Guayaquil": "ec",
  "Pacific/Galapagos": "ec",
  "Europe/Tallinn": "ee",
  "Africa/Cairo": "eg",
  "Africa/El_Aaiun": "eh",
  "Africa/Asmara": "er",
  "Europe/Madrid": "es",
  "Africa/Ceuta": "es",
  "Atlantic/Canary": "es",
  "Africa/Addis_Ababa": "et",
  "Europe/Helsinki": "fi",
  "Pacific/Fiji": "fj",
  "Atlantic/Stanley": "fk",
  "Pacific/Chuuk": "fm",
  "Pacific/Pohnpei": "fm",
  "Pacific/Kosrae": "fm",
  "Atlantic/Faroe": "fo",
  "Europe/Paris": "fr",
  "Africa/Libreville": "ga",
  "Europe/London": "gb",
  "America/Grenada": "gd",
  "Asia/Tbilisi": "ge",
  "America/Cayenne": "gf",
  "Europe/Guernsey": "gg",
  "Africa/Accra": "gh",
  "Europe/Gibraltar": "gi",
  "America/Nuuk": "gl",
  "America/Danmarkshavn": "gl",
  "America/Scoresbysund": "gl",
  "America/Thule": "gl",
  "Africa/Banjul": "gm",
  "Africa/Conakry": "gn",
  "America/Guadeloupe": "gp",
  "Africa/Malabo": "gq",
  "Europe/Athens": "gr",
  "Atlantic/South_Georgia": "gs",
  "America/Guatemala": "gt",
  "Pacific/Guam": "gu",
  "Africa/Bissau": "gw",
  "America/Guyana": "gy",
  "Asia/Hong_Kong": "hk",
  "America/Tegucigalpa": "hn",
  "Europe/Zagreb": "hr",
  "America/Port-au-Prince": "ht",
  "Europe/Budapest": "hu",
  "Asia/Jakarta": "id",
  "Asia/Pontianak": "id",
  "Asia/Makassar": "id",
  "Asia/Jayapura": "id",
  "Europe/Dublin": "ie",
  "Asia/Jerusalem": "il",
  "Europe/Isle_of_Man": "im",
  "Asia/Kolkata": "in",
  "Indian/Chagos": "io",
  "Asia/Baghdad": "iq",
  "Asia/Tehran": "ir",
  "Atlantic/Reykjavik": "is",
  "Europe/Rome": "it",
  "Europe/Jersey": "je",
  "America/Jamaica": "jm",
  "Asia/Amman": "jo",
  "Asia/Tokyo": "jp",
  "Africa/Nairobi": "ke",
  "Asia/Bishkek": "kg",
  "Asia/Phnom_Penh": "kh",
  "Pacific/Tarawa": "ki",
  "Pacific/Kanton": "ki",
  "Pacific/Kiritimati": "ki",
  "Indian/Comoro": "km",
  "America/St_Kitts": "kn",
  "Asia/Pyongyang": "kp",
  "Asia/Seoul": "kr",
  "Asia/Kuwait": "kw",
  "America/Cayman": "ky",
  "Asia/Almaty": "kz",
  "Asia/Qyzylorda": "kz",
  "Asia/Qostanay": "kz",
  "Asia/Aqtobe": "kz",
  "Asia/Aqtau": "kz",
  "Asia/Atyrau": "kz",
  "Asia/Oral": "kz",
  "Asia/Vientiane": "la",
  "Asia/Beirut": "lb",
  "America/St_Lucia": "lc",
  "Europe/Vaduz": "li",
  "Asia/Colombo": "lk",
  "Africa/Monrovia": "lr",
  "Africa/Maseru": "ls",
  "Europe/Vilnius": "lt",
  "Europe/Luxembourg": "lu",
  "Europe/Riga": "lv",
  "Africa/Tripoli": "ly",
  "Africa/Casablanca": "ma",
  "Europe/Monaco": "mc",
  "Europe/Chisinau": "md",
  "Europe/Podgorica": "me",
  "America/Marigot": "mf",
  "Indian/Antananarivo": "mg",
  "Pacific/Majuro": "mh",
  "Pacific/Kwajalein": "mh",
  "Europe/Skopje": "mk",
  "Africa/Bamako": "ml",
  "Asia/Yangon": "mm",
  "Asia/Ulaanbaatar": "mn",
  "Asia/Hovd": "mn",
  "Asia/Macau": "mo",
  "Pacific/Saipan": "mp",
  "America/Martinique": "mq",
  "Africa/Nouakchott": "mr",
  "America/Montserrat": "ms",
  "Europe/Malta": "mt",
  "Indian/Mauritius": "mu",
  "Indian/Maldives": "mv",
  "Africa/Blantyre": "mw",
  "America/Mexico_City": "mx",
  "America/Cancun": "mx",
  "America/Merida": "mx",
  "America/Monterrey": "mx",
  "America/Matamoros": "mx",
  "America/Chihuahua": "mx",
  "America/Ciudad_Juarez": "mx",
  "America/Ojinaga": "mx",
  "America/Mazatlan": "mx",
  "America/Bahia_Banderas": "mx",
  "America/Hermosillo": "mx",
  "America/Tijuana": "mx",
  "Asia/Kuala_Lumpur": "my",
  "Asia/Kuching": "my",
  "Africa/Maputo": "mz",
  "Africa/Windhoek": "na",
  "Pacific/Noumea": "nc",
  "Africa/Niamey": "ne",
  "Pacific/Norfolk": "nf",
  "Africa/Lagos": "ng",
  "America/Managua": "ni",
  "Europe/Amsterdam": "nl",
  "Europe/Oslo": "no",
  "Asia/Kathmandu": "np",
  "Pacific/Nauru": "nr",
  "Pacific/Niue": "nu",
  "Pacific/Auckland": "nz",
  "Pacific/Chatham": "nz",
  "Asia/Muscat": "om",
  "America/Panama": "pa",
  "America/Lima": "pe",
  "Pacific/Tahiti": "pf",
  "Pacific/Marquesas": "pf",
  "Pacific/Gambier": "pf",
  "Pacific/Port_Moresby": "pg",
  "Pacific/Bougainville": "pg",
  "Asia/Manila": "ph",
  "Asia/Karachi": "pk",
  "Europe/Warsaw": "pl",
  "America/Miquelon": "pm",
  "Pacific/Pitcairn": "pn",
  "America/Puerto_Rico": "pr",
  "Asia/Gaza": "ps",
  "Asia/Hebron": "ps",
  "Europe/Lisbon": "pt",
  "Atlantic/Madeira": "pt",
  "Atlantic/Azores": "pt",
  "Pacific/Palau": "pw",
  "America/Asuncion": "py",
  "Asia/Qatar": "qa",
  "Indian/Reunion": "re",
  "Europe/Bucharest": "ro",
  "Europe/Belgrade": "rs",
  "Europe/Kaliningrad": "ru",
  "Europe/Moscow": "ru",
  "Europe/Simferopol": "ru",
  "Europe/Kirov": "ru",
  "Europe/Volgograd": "ru",
  "Europe/Astrakhan": "ru",
  "Europe/Saratov": "ru",
  "Europe/Ulyanovsk": "ru",
  "Europe/Samara": "ru",
  "Asia/Yekaterinburg": "ru",
  "Asia/Omsk": "ru",
  "Asia/Novosibirsk": "ru",
  "Asia/Barnaul": "ru",
  "Asia/Tomsk": "ru",
  "Asia/Novokuznetsk": "ru",
  "Asia/Krasnoyarsk": "ru",
  "Asia/Irkutsk": "ru",
  "Asia/Chita": "ru",
  "Asia/Yakutsk": "ru",
  "Asia/Khandyga": "ru",
  "Asia/Vladivostok": "ru",
  "Asia/Ust-Nera": "ru",
  "Asia/Magadan": "ru",
  "Asia/Sakhalin": "ru",
  "Asia/Srednekolymsk": "ru",
  "Asia/Kamchatka": "ru",
  "Asia/Anadyr": "ru",
  "Africa/Kigali": "rw",
  "Asia/Riyadh": "sa",
  "Pacific/Guadalcanal": "sb",
  "Indian/Mahe": "sc",
  "Africa/Khartoum": "sd",
  "Europe/Stockholm": "se",
  "Asia/Singapore": "sg",
  "Atlantic/St_Helena": "sh",
  "Europe/Ljubljana": "si",
  "Arctic/Longyearbyen": "sj",
  "Europe/Bratislava": "sk",
  "Africa/Freetown": "sl",
  "Europe/San_Marino": "sm",
  "Africa/Dakar": "sn",
  "Africa/Mogadishu": "so",
  "America/Paramaribo": "sr",
  "Africa/Juba": "ss",
  "Africa/Sao_Tome": "st",
  "America/El_Salvador": "sv",
  "America/Lower_Princes": "sx",
  "Asia/Damascus": "sy",
  "Africa/Mbabane": "sz",
  "America/Grand_Turk": "tc",
  "Africa/Ndjamena": "td",
  "Indian/Kerguelen": "tf",
  "Africa/Lome": "tg",
  "Asia/Bangkok": "th",
  "Asia/Dushanbe": "tj",
  "Pacific/Fakaofo": "tk",
  "Asia/Dili": "tl",
  "Asia/Ashgabat": "tm",
  "Africa/Tunis": "tn",
  "Pacific/Tongatapu": "to",
  "Europe/Istanbul": "tr",
  "America/Port_of_Spain": "tt",
  "Pacific/Funafuti": "tv",
  "Asia/Taipei": "tw",
  "Africa/Dar_es_Salaam": "tz",
  "Europe/Kyiv": "ua",
  "Africa/Kampala": "ug",
  "Pacific/Midway": "um",
  "Pacific/Wake": "um",
  "America/New_York": "us",
  "America/Detroit": "us",
  "America/Kentucky/Louisville": "us",
  "America/Kentucky/Monticello": "us",
  "America/Indiana/Indianapolis": "us",
  "America/Indiana/Vincennes": "us",
  "America/Indiana/Winamac": "us",
  "America/Indiana/Marengo": "us",
  "America/Indiana/Petersburg": "us",
  "America/Indiana/Vevay": "us",
  "America/Chicago": "us",
  "America/Indiana/Tell_City": "us",
  "America/Indiana/Knox": "us",
  "America/Menominee": "us",
  "America/North_Dakota/Center": "us",
  "America/North_Dakota/New_Salem": "us",
  "America/North_Dakota/Beulah": "us",
  "America/Denver": "us",
  "America/Boise": "us",
  "America/Phoenix": "us",
  "America/Los_Angeles": "us",
  "America/Anchorage": "us",
  "America/Juneau": "us",
  "America/Sitka": "us",
  "America/Metlakatla": "us",
  "America/Yakutat": "us",
  "America/Nome": "us",
  "America/Adak": "us",
  "Pacific/Honolulu": "us",
  "America/Montevideo": "uy",
  "Asia/Samarkand": "uz",
  "Asia/Tashkent": "uz",
  "Europe/Vatican": "va",
  "America/St_Vincent": "vc",
  "America/Caracas": "ve",
  "America/Tortola": "vg",
  "America/St_Thomas": "vi",
  "Asia/Ho_Chi_Minh": "vn",
  "Pacific/Efate": "vu",
  "Pacific/Wallis": "wf",
  "Pacific/Apia": "ws",
  "Asia/Aden": "ye",
  "Indian/Mayotte": "yt",
  "Africa/Johannesburg": "za",
  "Africa/Lusaka": "zm",
  "Africa/Harare": "zw"
};

function getLocalUser() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localeOS = navigator.language.split('-')[0];
  const output = {
    "timezone": (timezoneToCountry[timezone] || null),
    "userlang": localeOS,
  };
  return output;
}

function toSlug(text) {
  if (!text || typeof text !== 'string') return '';
  let str = text.trim().toLowerCase();
  const russian = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z',
    'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
    'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };
  const arabic = {
    'ا': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
    'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a',
    'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w',
    'ي': 'y', 'ة': 'h', 'ى': 'a', 'آ': 'aa', 'ؤ': 'u', 'ئ': 'i', 'ء': 'a', 'لا': 'la'
  };
  const hebrew = {
    'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z', 'ח': 'ch', 'ט': 't',
    'י': 'y', 'כ': 'k', 'ך': 'kh', 'ל': 'l', 'מ': 'm', 'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's',
    'ע': 'a', 'פ': 'f', 'ף': 'f', 'צ': 'ts', 'ץ': 'ts', 'ק': 'k', 'ר': 'r', 'ש': 'sh', 'ת': 't'
  };
  const chinese = {
    '的': 'de', '一': 'yi', '是': 'shi', '了': 'le', '不': 'bu', '我': 'wo', '人': 'ren',
    '在': 'zai', '有': 'you', '他': 'ta', '这': 'zhe', '中': 'zhong', '大': 'da', '来': 'lai',
    '上': 'shang', '国': 'guo', '文': 'wen', '学': 'xue', '为': 'wei', '子': 'zi', '你': 'ni',
    '好': 'hao', '世': 'shi', '界': 'jie', '朋': 'peng', '友': 'you', '爱': 'ai', '心': 'xin'
  };
  const japanese = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o', 'か': 'ka', 'き': 'ki', 'く': 'ku',
    'け': 'ke', 'こ': 'ko', 'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to', 'な': 'na', 'に': 'ni',
    'ぬ': 'nu', 'ね': 'ne', 'の': 'no', 'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he',
    'ほ': 'ho', 'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo', 'や': 'ya',
    'ゆ': 'yu', 'よ': 'yo', 'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'wo', 'ん': 'n', 'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge',
    'ご': 'go', 'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo', 'だ': 'da',
    'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do', 'ば': 'ba', 'び': 'bi', 'ぶ': 'bu',
    'べ': 'be', 'ぼ': 'bo', 'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo', 'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
    'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho', 'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
    'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo', 'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
    'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo', 'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
    'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo', 'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
    'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
    'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o', 'カ': 'ka', 'キ': 'ki', 'ク': 'ku',
    'ケ': 'ke', 'コ': 'ko', 'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
    'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to', 'ナ': 'na', 'ニ': 'ni',
    'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no', 'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he',
    'ホ': 'ho', 'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo', 'ヤ': 'ya',
    'ユ': 'yu', 'ヨ': 'yo', 'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
    'ワ': 'wa', 'ヲ': 'wo', 'ン': 'n', 'ガ': 'ga', 'ギ': 'gi', 'グ': 'gu', 'ゲ': 'ge',
    'ゴ': 'go', 'ザ': 'za', 'ジ': 'ji', 'ズ': 'zu', 'ゼ': 'ze', 'ゾ': 'zo', 'ダ': 'da',
    'ヂ': 'ji', 'ヅ': 'zu', 'デ': 'de', 'ド': 'do', 'バ': 'ba', 'ビ': 'bi', 'ブ': 'bu',
    'ベ': 'be', 'ボ': 'bo', 'パ': 'pa', 'ピ': 'pi', 'プ': 'pu', 'ペ': 'pe', 'ポ': 'po'
  };
  const korean = {
    'ㄱ': 'g', 'ㄲ': 'kk', 'ㄴ': 'n', 'ㄷ': 'd', 'ㄸ': 'tt', 'ㄹ': 'r', 'ㅁ': 'm', 'ㅂ': 'b',
    'ㅃ': 'pp', 'ㅅ': 's', 'ㅆ': 'ss', 'ㅇ': '', 'ㅈ': 'j', 'ㅉ': 'jj', 'ㅊ': 'ch', 'ㅋ': 'k',
    'ㅌ': 't', 'ㅍ': 'p', 'ㅎ': 'h', 'ㅏ': 'a', 'ㅐ': 'ae', 'ㅑ': 'ya', 'ㅒ': 'yae', 'ㅓ': 'eo',
    'ㅔ': 'e', 'ㅕ': 'yeo', 'ㅖ': 'ye', 'ㅗ': 'o', 'ㅘ': 'wa', 'ㅙ': 'wae', 'ㅚ': 'oe', 'ㅛ': 'yo',
    'ㅜ': 'u', 'ㅝ': 'wo', 'ㅞ': 'we', 'ㅟ': 'wi', 'ㅠ': 'yu', 'ㅡ': 'eu', 'ㅢ': 'ui', 'ㅣ': 'i'
  };
  const greek = {
    'α': 'a', 'β': 'v', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'i', 'θ': 'th', 'ι': 'i',
    'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's',
    'ς': 's', 'τ': 't', 'υ': 'y', 'φ': 'f', 'χ': 'ch', 'ψ': 'ps', 'ω': 'o'
  };
  const hindi = {
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ii', 'उ': 'u', 'ऊ': 'uu', 'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai',
    'ओ': 'o', 'औ': 'au', 'क': 'ka', 'ख': 'kha', 'ग': 'ga', 'घ': 'gha', 'ङ': 'nga', 'च': 'cha',
    'छ': 'chha', 'ज': 'ja', 'झ': 'jha', 'ञ': 'nya', 'ट': 'ta', 'ठ': 'tha', 'ड': 'da', 'ढ': 'dha',
    'ण': 'na', 'त': 'ta', 'थ': 'tha', 'द': 'da', 'ध': 'dha', 'न': 'na', 'प': 'pa', 'फ': 'pha',
    'ब': 'ba', 'भ': 'bha', 'म': 'ma', 'य': 'ya', 'र': 'ra', 'ल': 'la', 'व': 'va', 'श': 'sha',
    'ष': 'sha', 'स': 'sa', 'ह': 'ha', 'क्ष': 'ksha', 'त्र': 'tra', 'ज्ञ': 'gya'
  };
  const accents = {
    'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss', 'æ': 'ae', 'ø': 'oe', 'å': 'aa', 'é': 'e',
    'è': 'e', 'ê': 'e', 'ë': 'e', 'ï': 'i', 'î': 'i', 'ô': 'o', 'ç': 'c', 'ñ': 'n', 'š': 's',
    'ž': 'z', 'č': 'c', 'ć': 'c', 'đ': 'dj', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z',
    'ż': 'z', 'ý': 'y', 'þ': 'th', 'ð': 'd', 'œ': 'oe'
  };
  const extendedLatin = {
    'є': 'ye', 'ї': 'yi', 'ґ': 'g', 'і': 'i',
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
    'ď': 'd', 'ť': 't', 'ň': 'n', 'ř': 'r', 'ů': 'u', 'ý': 'y',
    'đ': 'dj', 'č': 'c', 'š': 's', 'ž': 'z',
    'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ț': 't',
    'ı': 'i', 'ğ': 'g', 'ş': 's', 'ö': 'o', 'ü': 'u', 'ç': 'c',
    'ő': 'o', 'ű': 'u',
    'þ': 'th', 'ð': 'd', 'æ': 'ae',
    'õ': 'o', 'ä': 'ae', 'å': 'aa',
    'ā': 'a', 'ē': 'e', 'ī': 'i', 'ū': 'u', 'ļ': 'l', 'ķ': 'k', 'ņ': 'n', 'ģ': 'g',
    'ċ': 'c', 'ġ': 'g', 'ħ': 'h',
    'đ': 'd', 'ê': 'e', 'ô': 'o', 'ơ': 'o', 'ư': 'u', 'ă': 'a'
  };
  const extendedEurope = {
    'ß': 'ss', 'œ': 'oe', 'æ': 'ae', 'ø': 'oe', 'å': 'aa',
    'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'ae', 'å': 'aa',
    'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
    'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
    'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'oe',
    'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'ue',
    'ý': 'y', 'ÿ': 'y', 'ñ': 'n', 'ç': 'c',
    'þ': 'th', 'ð': 'd', 'ł': 'l', 'ń': 'n', 'ś': 's', 'ź': 'z', 'ż': 'z',
    'č': 'c', 'ď': 'd', 'ě': 'e', 'ň': 'n', 'ř': 'r', 'š': 's', 'ť': 't', 'ů': 'u', 'ž': 'z',
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
    'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ț': 't',
    'ğ': 'g', 'ı': 'i', 'ö': 'oe', 'ş': 's', 'ü': 'ue',
    'ő': 'o', 'ű': 'u',
    'ā': 'a', 'ē': 'e', 'ī': 'i', 'ū': 'u', 'ķ': 'k', 'ļ': 'l', 'ņ': 'n', 'ģ': 'g',
    'ċ': 'c', 'ġ': 'g', 'ħ': 'h', 'ż': 'z',
    'đ': 'd', 'ê': 'e', 'ô': 'o', 'ơ': 'o', 'ư': 'u', 'ă': 'a'
  };
  const extendedWorld = {
    'α': 'a', 'β': 'v', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'i', 'θ': 'th', 'ι': 'i',
    'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's',
    'ς': 's', 'τ': 't', 'υ': 'y', 'φ': 'f', 'χ': 'ch', 'ψ': 'ps', 'ω': 'o',
    'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z', 'ח': 'ch', 'ט': 't',
    'י': 'y', 'כ': 'k', 'ך': 'kh', 'ל': 'l', 'מ': 'm', 'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's',
    'ע': 'a', 'פ': 'f', 'ף': 'f', 'צ': 'ts', 'ץ': 'ts', 'ק': 'k', 'ר': 'r', 'ש': 'sh', 'ת': 't',
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ii', 'उ': 'u', 'ऊ': 'uu', 'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai',
    'ओ': 'o', 'औ': 'au', 'क': 'ka', 'ख': 'kha', 'ग': 'ga', 'घ': 'gha', 'ङ': 'nga', 'च': 'cha',
    'छ': 'chha', 'ज': 'ja', 'झ': 'jha', 'ञ': 'nya', 'ट': 'ta', 'ठ': 'tha', 'ड': 'da', 'ढ': 'dha',
    'ण': 'na', 'त': 'ta', 'थ': 'tha', 'द': 'da', 'ध': 'dha', 'न': 'na', 'प': 'pa', 'फ': 'pha',
    'ब': 'ba', 'भ': 'bha', 'म': 'ma', 'य': 'ya', 'र': 'ra', 'ल': 'la', 'व': 'va', 'श': 'sha',
    'ष': 'sha', 'स': 'sa', 'ह': 'ha', 'क्ष': 'ksha', 'त्र': 'tra', 'ज्ञ': 'gya',
    'ㄱ': 'g', 'ㄲ': 'kk', 'ㄴ': 'n', 'ㄷ': 'd', 'ㄸ': 'tt', 'ㄹ': 'r', 'ㅁ': 'm', 'ㅂ': 'b',
    'ㅃ': 'pp', 'ㅅ': 's', 'ㅆ': 'ss', 'ㅇ': '', 'ㅈ': 'j', 'ㅉ': 'jj', 'ㅊ': 'ch', 'ㅋ': 'k',
    'ㅌ': 't', 'ㅍ': 'p', 'ㅎ': 'h', 'ㅏ': 'a', 'ㅐ': 'ae', 'ㅑ': 'ya', 'ㅒ': 'yae', 'ㅓ': 'eo',
    'ㅔ': 'e', 'ㅕ': 'yeo', 'ㅖ': 'ye', 'ㅗ': 'o', 'ㅘ': 'wa', 'ㅙ': 'wae', 'ㅚ': 'oe', 'ㅛ': 'yo',
    'ㅜ': 'u', 'ㅝ': 'wo', 'ㅞ': 'we', 'ㅟ': 'wi', 'ㅠ': 'yu', 'ㅡ': 'eu', 'ㅢ': 'ui', 'ㅣ': 'i'
  };
  const allMaps = [arabic, hebrew, chinese, japanese, korean, greek, hindi, accents, extendedEurope, extendedLatin, russian, extendedWorld];
  for (let i = 0; i < str.length; i++) {
    let replaced = false;
    for (let len = 2; len <= 3; len++) {
      const substr = str.substr(i, len);
      for (const map of allMaps) {
        if (map[substr]) {
          str = str.slice(0, i) + map[substr] + str.slice(i + len);
          replaced = true;
          break;
        }
      }
      if (replaced) break;
    }
    if (!replaced) {
      const ch = str[i];
      for (const map of allMaps) {
        if (map[ch]) {
          str = str.slice(0, i) + map[ch] + str.slice(i + 1);
          replaced = true;
          break;
        }
      }
    }
  }
  let slug = str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || '';
}