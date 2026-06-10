// Package name mapping for apps
// This maps app names to their Android/iOS package names
const APP_TO_PACKAGE: Record<string, string> = {
  // Seven Mountains
  'froggy-98': 'com.sevenmountains.froggy98',
  'wowy-radio': 'com.sevenmountains.wowyradio',
  'wink-106': 'com.sevenmountains.wink106',
  'willie-radio': 'com.sevenmountains.willieradio',
  'this-bigfoot-country': 'com.sevenmountains.thisbigfootcountry',
  'the-big-pig': 'com.sevenmountains.thebigpig',
  'poco-103': 'com.sevenmountains.poco103',
  'my-froggy-valley': 'com.sevenmountains.myfroggyvalley',
  'merf-radio': 'com.sevenmountains.merfradio',
  'love-my-bigfoot': 'com.sevenmountains.lovemybigfoot',
  'froggy-95-5': 'com.sevenmountains.froggy955',
  'bigfoot-country-radio': 'com.sevenmountains.bigfootcountryradio',
  'beaver-96-7': 'com.sevenmountains.beaver967',
  'radio-novo': 'com.sevenmountains.radionovo',
  'i-love-froggy': 'com.sevenmountains.ilovefroggy',
  '935-sbg': 'com.sevenmountains.sbg935',
  'the-bus-rocks': 'com.sevenmountains.thebusrocks',
  'hanna-radio': 'com.sevenmountains.hannaradio',
  'love-my-froggy': 'com.sevenmountains.lovemyfroggy',
  'listen-to-froggy': 'com.sevenmountains.listentofroggy',
  'the-met-rocks': 'com.sevenmountains.themetrocks',
  'my-bigfoot-country': 'com.sevenmountains.mybigfootcountry',
  'bigfoot-country': 'com.sevenmountains.bigfootcountry',
  'wilbur-radio': 'com.sevenmountains.wilburradio',
  'passport-radio-ky': 'com.sevenmountains.passportradioxy',
  'froggy-radio-ky': 'com.sevenmountains.froggyradioxy',
  'pop-radio-931': 'com.sevenmountains.popradio931',
  'wuhu-107': 'com.sevenmountains.wuhu107',
  'my-pop-radio': 'com.sevenmountains.mypopradio',
  'wxil-radio': 'com.sevenmountains.wxilradio',

  // Seven Mountains 3
  'waly-radio': 'com.sevenmountains3.walyradio',
  'rocky-1049': 'com.sevenmountains3.rocky1049',
  'this-is-pop-radio': 'com.sevenmountains3.thisispopradio',
  'big-froggy-101': 'com.sevenmountains3.bigfroggy101',
  'passport-radio-pa': 'com.sevenmountains3.passportradiopа',
  'mega-rock-pa': 'com.sevenmountains3.megarockpa',
  'rocky-99-johnstown': 'com.sevenmountains3.rocky99johnstown',
  'key-965': 'com.sevenmountains3.key965',
  'its-pop-radio': 'com.sevenmountains3.itspopradio',
  '3wz-radio': 'com.sevenmountains3.wz3radio',
  'bigfoot-country-legends': 'com.sevenmountains3.bigfootcountrylegends',
  'bigfoot-legends-radio': 'com.sevenmountains3.bigfootlegendsradio',

  // Seven Mountains 4
  'bigfoot-legends-ky': 'com.sevenmountains4.bigfootlegendsxy',
  'hear-the-goat': 'com.sevenmountains4.hearthegoat',
  'the-point-rocks': 'com.sevenmountains4.thepointrocks',
  'big-hits-bg': 'com.sevenmountains4.bighitsbg',
  'wingz-93': 'com.sevenmountains4.wingz93',
  'twin-tiers-magic': 'com.sevenmountains4.twintiersmagic',
  'my-radio-jamz': 'com.sevenmountains4.myradiojamz',
  'my-cool-radio': 'com.sevenmountains4.mycoolradio',
  'bigfoot-legends-ny': 'com.sevenmountains4.bigfootlegendsny',
  'pop-radio-ky': 'com.sevenmountains4.popradioxy',
  'big-oly-radio': 'com.sevenmountains4.bigolyradio',
  'goat-rock-radio': 'com.sevenmountains4.goatrockradio',

  // Seven Mountains 5
  'big-lewie': 'com.sevenmountains5.biglewie',
  'woga-radio': 'com.sevenmountains5.wogaradio',
  'my-rocky-radio': 'com.sevenmountains5.myrockyradio',
  'wuzz-radio': 'com.sevenmountains5.wuzzradio',
  'i-love-pop-radio': 'com.sevenmountains5.ilovepopradio',
  'listen-to-pop': 'com.sevenmountains5.listentopop',
  'bear-radio-rocks': 'com.sevenmountains5.bearradiorocks',
  'my-goat-rocks': 'com.sevenmountains5.mygoatrocks',
  'its-willie-radio': 'com.sevenmountains5.itswillieradio',
  'pop-radio-1035': 'com.sevenmountains5.popradio1035',
  'bigfoot-poconos': 'com.sevenmountains5.bigfootpoconos',
  'bigfoot-legends-pa': 'com.sevenmountains5.bigfootlegendspa',

  // NRW
  'radio-91-2': 'de.nrw.radio912',
  'antenne-unna': 'de.nrw.antenneunna',
  'radio-vest': 'de.nrw.radiovest',
  'radio-rsg': 'de.nrw.radiorsg',
  'radio-bochum': 'de.nrw.radiobochum',
  'radio-duisburg': 'de.nrw.radioduisburg',
  'radio-escher-lippe': 'de.nrw.radioescherlippe',
  'radio-essen': 'de.nrw.radioessen',
  'radio-hagen': 'de.nrw.radiohagen',
  'radio-herne': 'de.nrw.radioherne',
  'radio-kw': 'de.nrw.radiokw',
  'radio-mulheim': 'de.nrw.radiomulheim',
  'radio-oberhausen': 'de.nrw.radiooberhausen',
  'radio-sauerland': 'de.nrw.radiosauerland',
  'radio-siegen': 'de.nrw.radiosiegen',
  'radio-hellweg': 'de.nrw.radiohellweg',
  'radio-lippewelle': 'de.nrw.radiolippewelle',
  'radio-mk': 'de.nrw.radiomk',
  'radio-berg': 'de.nrw.radioberg',
  'radio-bonn': 'de.nrw.radiobonn',
  'radio-erft': 'de.nrw.radioerft',
  'radio-euskirchen': 'de.nrw.radioeuskirchen',
  'radio-koln': 'de.nrw.radiokoln',
  'radio-leverkusen': 'de.nrw.radioleverkusen',
  'radio-rur': 'de.nrw.radiorur',

  // Alpha Media
  'san-antonio': 'com.alphamedia.sanantonio',
  'wiil-rock': 'com.alphamedia.wiilrock',
  'djx': 'com.alphamedia.djx',
  'the-bull': 'com.alphamedia.thebull',
  'kink': 'com.alphamedia.kink',
  'the-game': 'com.alphamedia.thegame',
  'b965': 'com.alphamedia.b965',
  'ktsa': 'com.alphamedia.ktsa',
  'kxl': 'com.alphamedia.kxl',
  'live-95-5': 'com.alphamedia.live955',
  'we-102-9': 'com.alphamedia.we1029',
  'bay-country': 'com.alphamedia.baycountry',
  'free-country': 'com.alphamedia.freecountry',

  // Others
  'q-rated': 'com.other.qrated',
  'ibiza-sonica': 'com.other.ibizasonica',
  'antenne-sylt': 'com.other.antennesylt',
  'antenne-vorarlberg': 'com.other.antennevorarlberg',
  'megamix': 'com.other.megamix',
  'globo-vintage': 'com.other.globovintage',
  'radio-globo': 'com.other.radioglobo',
  'radio-romanista': 'com.other.radioromanista',
  'radio21': 'com.other.radio21',
  'the-wolf': 'com.other.thewolf',
  'rockland-radio': 'com.other.rocklandradio',
  'suisse-podcast': 'com.other.suissepodcast',
  'wtts': 'com.other.wtts',
  'bloomingtons-voice': 'com.other.bloomingtonsvoice',
  'the-quarry': 'com.other.thequarry',
  'veneto-24': 'com.other.veneto24',
  'b1streaming': 'com.other.b1streaming',
  'onefm': 'com.other.onefm',
  'lfm': 'com.other.lfm',
  'radio-lac': 'com.other.radiolac',
  'rouge': 'com.other.rouge',
  'sunshine-live': 'com.other.sunshinelive',
  'sunshine-live-at': 'com.other.sunshineliveat',
  'listen-boise': 'com.other.listenboise',
  'fly-98-5': 'com.other.fly985',
  'hot-93-7': 'com.other.hot937',
  'that-station': 'com.other.thatstation',
  'my105-dj-radio': 'com.other.my105djradio',
  'radio-2go': 'com.other.radio2go',
  'hotel-music': 'com.other.hotelmusic',
  'inferno-radio': 'com.other.infernoradio',
  'gold-play': 'com.other.goldplay',
  'my-country': 'com.other.mycountry',
  'the-breeze': 'com.other.thebreeze',
  'radio-top': 'com.other.radiotop',
  'majic-95-1': 'com.other.majic951',
  'classic-hits': 'com.other.classichits',
  'radio-fondue': 'com.other.radiofondue',
  'alt-99-5': 'com.other.alt995',
  'urban-radio': 'com.other.urbanradio',
  'magic-92-5': 'com.other.magic925',
  'babboleo': 'com.other.babboleo',
  '96-9-wink-fm': 'com.other.winkfm969',
  'radijas': 'com.other.radijas',
  'rundfunk': 'com.other.rundfunk',
  'listen-sunny-coast': 'com.other.listensunnycoast',
};

export function getPackageNameForApp(appName: string): string {
  // Check exact match first
  if (APP_TO_PACKAGE[appName]) {
    return APP_TO_PACKAGE[appName];
  }

  // Check case-insensitive match
  const lowerAppName = appName.toLowerCase();
  for (const [app, packageName] of Object.entries(APP_TO_PACKAGE)) {
    if (app.toLowerCase() === lowerAppName) {
      return packageName;
    }
  }

  // Generate a default package name based on app name
  const sanitized = appName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `com.unknown.${sanitized}`;
}

// Export the full mapping for migration purposes
export function getAllPackageMappings(): Record<string, string> {
  return { ...APP_TO_PACKAGE };
}
