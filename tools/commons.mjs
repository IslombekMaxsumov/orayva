// Downloads the destination photos from Wikimedia Commons, resizes them and
// writes js/photos.js (PHOTOS per place, and HERO for the home page).
// Run: node tools/commons.mjs   (Windows PowerShell does the resizing)
//
// Picked by eye on 2026-11-23 from contact sheets of every large landscape
// photo Commons has of each place: one clear landmark, daylight and a blue
// sky where possible, so the twelve look like one set. Every photo is CC0,
// CC BY, CC BY-SA or public domain; author and licence are shown with it.
// The Nukus museum paintings were left out (the paintings may still be in copyright).
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERO = {
  file: "Xiva kalta minor.jpg", pos: "34% 40%", coords: "41.3784° N, 60.3590° E",
  place: { en: "Itchan Kala, Khiva", ru: "Ичан-Кала, Хива", uz: "Ichan Qal'a, Xiva" },
  alt: {
    en: "The turquoise Kalta Minor minaret and the tiled towers of the Kuhna Ark gate in Khiva, under a clear blue sky",
    ru: "Бирюзовый минарет Кальта-Минор и изразцовые башни ворот Куня-Арка в Хиве под ясным небом",
    uz: "Xivadagi feruza Kalta Minor minorasi va Ko'hna Ark darvozasining koshinli minoralari, tiniq osmon ostida",
  },
};

// [place, Commons file name, object-position ("" = centre), alt [en, ru, uz]]
const PICKS = [
  ["tashkent", "Hazrati Imam Mosque 01.jpg", "50% 45%", ["The carved entrance of the Hazrati Imam mosque in Tashkent, between two turquoise domes", "Резной портал мечети Хазрати Имам в Ташкенте между двумя бирюзовыми куполами", "Toshkentdagi Hazrati Imom masjidining ikki feruza gumbaz orasidagi o'ymakor peshtoqi"]],
  ["tashkent", "Tashkent metro drushbanarod.jpg", "", ["A Tashkent metro station with a pale blue train at the platform", "Станция ташкентского метро с голубым поездом у платформы", "Platformada havorang poyezd turgan Toshkent metrosi bekati"]],
  ["samarkand", "Sher-Dor Madrasa 02.jpg", "50% 40%", ["The Sher-Dor madrasa on the Registan in Samarkand, its tiled portal between two minarets", "Медресе Шердор на Регистане в Самарканде: изразцовый портал между двумя минаретами", "Samarqanddagi Registonda Sherdor madrasasi, ikki minora orasidagi koshinli peshtoq"]],
  ["samarkand", "Shah-i-Zinda 04.jpg", "", ["Blue-tiled mausoleums along the street of Shah-i-Zinda", "Мавзолеи в синих изразцах вдоль улицы Шахи-Зинда", "Shohi Zinda ko'chasi bo'ylab moviy koshinli maqbaralar"]],
  ["samarkand", "Dome of Gur-e Amir.jpg", "", ["The ribbed turquoise dome of Gur-e Amir, Timur's tomb", "Ребристый бирюзовый купол Гур-Эмира, усыпальницы Тимура", "Temur maqbarasi Go'ri Amirning qovurg'ali feruza gumbazi"]],
  ["bukhara", "Kalan Minaret 02.jpg", "50% 50%", ["The Kalon minaret and the turquoise dome of the Mir-i-Arab madrasa in Bukhara", "Минарет Калян и бирюзовый купол медресе Мири-Араб в Бухаре", "Buxorodagi Kalon minorasi va Mir Arab madrasasining feruza gumbazi"]],
  ["bukhara", "Labi Hovuz ko'rinishi 08.jpg", "", ["The pool of Lyabi-Hauz under old mulberry trees", "Хауз Ляби-Хауз под старыми тутовниками", "Keksa tut daraxtlari ostidagi Labi Hovuz"]],
  ["bukhara", "45 Lab-i Hauz complex 1813 mK.jpg", "", ["The tiled portal of a madrasa at the Lyabi-Hauz ensemble", "Изразцовый портал медресе ансамбля Ляби-Хауз", "Labi Hovuz ansamblidagi madrasaning koshinli peshtoqi"]],
  ["khiva", "Konya Ark towers (Цитадель Куня-Арк, Koʻhna ark), Itchan Kala, Khiva.jpg", "50% 40%", ["The tiled towers of the Kuhna Ark in Khiva against a deep blue sky", "Изразцовые башни Куня-Арка в Хиве на фоне синего неба", "Moviy osmon fonida Xivadagi Ko'hna Arkning koshinli minoralari"]],
  ["khiva", "Ota Darvaza aka West Gates, Khiva (Ota Darvaza, Ата-дарваза).jpg", "", ["Ota Darvaza, the west gate of the Itchan Kala walls", "Ата-Дарваза, западные ворота стен Ичан-Калы", "Ota Darvoza, Ichan Qal'a devorlarining g'arbiy darvozasi"]],
  ["khiva", "Konya Ark gate.jpg", "", ["The Kalta Minor minaret and the Kuhna Ark gate lit up at night", "Минарет Кальта-Минор и ворота Куня-Арка ночью в подсветке", "Kechasi chiroqlar yoritgan Kalta Minor minorasi va Ko'hna Ark darvozasi"]],
  ["fergana", "Yodgorlik Silk Factory (5982821398).jpg", "", ["Atlas silk in bright patterns on a hand loom at the Yodgorlik factory in Margilan", "Атлас с яркими узорами на ручном станке фабрики «Ёдгорлик» в Маргилане", "Marg'ilondagi «Yodgorlik» fabrikasida qo'l dastgohidagi yorqin naqshli atlas"]],
  ["fergana", "09 Taller ceràmic de Rustam Usmanov, Burhoniddin Roshidoni Ko'chasi 6 (Rixtan).jpg", "", ["Blue-glazed Rishtan plates laid out in a ceramics workshop", "Риштанские блюда с синей глазурью в керамической мастерской", "Kulolchilik ustaxonasida terilgan moviy sirli Rishton laganlari"]],
  ["nukus", "Necropolis Mizdakhan 03.JPG", "", ["The domed tombs of the Mizdakhan necropolis near Nukus", "Купольные гробницы некрополя Миздахкан у Нукуса", "Nukus yaqinidagi Mizdahkon qabristonining gumbazli maqbaralari"]],
  ["nukus", "Necropolis Mizdakhan 01.JPG", "", ["Mud-brick tombs on the hills of Mizdakhan", "Глинобитные гробницы на холмах Миздахкана", "Mizdahkon tepaliklaridagi xom g'ishtli maqbaralar"]],
  ["muynak", "Aral Sea Moynaq Karakalpakstan Uzbekistan September 2025 Ph Khusen Rustamov- 13.jpg", "50% 60%", ["A rusting fishing boat on the dry seabed at Muynak", "Ржавый рыболовецкий корабль на высохшем дне у Муйнака", "Mo'ynoqda qurigan dengiz tubidagi zanglagan baliqchi kemasi"]],
  ["muynak", "Moynaq, Aral Sea (6226807306).jpg", "", ["Old ships in the sand where the Aral Sea once was", "Старые корабли в песке на месте Аральского моря", "Orol dengizi o'rnidagi qumda yotgan eski kemalar"]],
  ["chimgan", "Charvak dam - panoramio.jpg", "", ["The turquoise Charvak reservoir between dry mountain slopes", "Бирюзовое Чарвакское водохранилище среди горных склонов", "Tog' yonbag'irlari orasidagi feruza rangli Chorvoq suv ombori"]],
  ["chimgan", "Greater Chimgan Mountain.JPG", "", ["The peak of Greater Chimgan above green slopes", "Вершина Большого Чимгана над зелёными склонами", "Yashil yonbag'irlar ustidagi Katta Chimyon cho'qqisi"]],
  ["nurata", "Закат на берегу Айдаркуля.jpg", "50% 55%", ["Sunset over the shore of Aydarkul lake", "Закат на берегу озера Айдаркуль", "Aydarko'l sohilida quyosh botishi"]],
  ["nurata", "Звездная ночь на берегу Айдаркуля.jpg", "", ["The Milky Way over tents on the shore of Aydarkul", "Млечный Путь над палатками на берегу Айдаркуля", "Aydarko'l sohilidagi chodirlar ustida Somon yo'li"]],
  ["shahrisabz", "Oq Saroy, Qashqadaryo viloyati, Shahrisabz, O`rda MFY, Shahrisabz Tarixiy markazi. 3.jpg", "50% 45%", ["The two towers left of the Ak-Saray palace gate in Shahrisabz", "Две башни, оставшиеся от портала дворца Ак-Сарай в Шахрисабзе", "Shahrisabzdagi Oqsaroy peshtoqidan qolgan ikki minora"]],
  ["shahrisabz", "Aq-Saray Shahrisabz.JPG", "", ["The ruins of the Ak-Saray gate seen from the park", "Руины портала Ак-Сарая со стороны парка", "Bog' tomondan ko'rinadigan Oqsaroy peshtoqi xarobalari"]],
  ["zaamin", "Зааминский национальный парк.jpg", "", ["A lone juniper tree on a meadow in Zaamin National Park", "Одинокая арча на лугу в Зааминском национальном парке", "Zomin milliy bog'idagi o'tloqda yolg'iz archa"]],
  ["zaamin", "Zaamin National Park, Uzbekistan.jpg", "", ["Juniper forest and mountains in Zaamin National Park", "Арчовый лес и горы в Зааминском национальном парке", "Zomin milliy bog'idagi archazor va tog'lar"]],
  ["termez", "Fayoztepa majmuasi 10.jpg", "", ["The restored stupa of the Fayaz Tepa Buddhist monastery near Termez", "Восстановленная ступа буддийского монастыря Фаяз-Тепа у Термеза", "Termiz yaqinidagi Fayoztepa buddaviy ibodatxonasining tiklangan stupasi"]],
  ["termez", "Fayoztepa majmuasi 4.jpg", "", ["Steps leading up to the stupa at Fayaz Tepa", "Ступени, ведущие к ступе Фаяз-Тепа", "Fayoztepa stupasiga olib boruvchi zinapoyalar"]],
];
const WIDTHS = [640, 1024, 1600];
const UA = { "User-Agent": "OrayvaDemoPhotoPicker/1.0 (course project)" };
const root = fileURLToPath(new URL("..", import.meta.url));
const dir = root + "assets/photos/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(params) {
  const u = "https://commons.wikimedia.org/w/api.php?" + new URLSearchParams({ format: "json", ...params });
  for (let i = 0; i < 6; i++) { await sleep(1000); const s = await (await fetch(u, { headers: UA })).text(); if (s.startsWith("{")) return JSON.parse(s); await sleep(5000 * (i + 1)); }
  throw new Error("Commons API failed");
}
const strip = (h) => (h || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const AUTHOR = { "Xiva kalta minor.jpg": "Bosinus (German Wikipedia)" }; // the page names the uploader in a long sentence

// one photo: metadata, a 1920 px Commons thumbnail (originals are rate-limited), resized copies
async function fetchOne(file, base, widths) {
  const j = await api({ action: "query", titles: "File:" + file, prop: "imageinfo", iiprop: "url|size|extmetadata", iiextmetadatafilter: "Artist|LicenseShortName|LicenseUrl" });
  const info = Object.values(j.query.pages)[0].imageinfo[0];
  const m = info.extmetadata || {};
  if (!existsSync(dir + `${base}-${widths[0]}.jpg`)) {
    const orig = info.url.split("?")[0], name = orig.split("/").pop();
    const url = orig.replace("upload.wikimedia.org/wikipedia/commons/", "thumb.wikimedia.org/wikipedia/commons/thumb/") + `/1920px-${name}`;
    let r;
    for (let k = 0; k < 5; k++) { r = await fetch(url, { headers: UA }); if (r.ok) break; await sleep(8000 * (k + 1)); }
    if (!r.ok) throw new Error(`download failed (${r.status}): ${file}`);
    writeFileSync(dir + base + "-src", Buffer.from(await r.arrayBuffer()));
    execFileSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", root + "tools/resize.ps1", "-src", dir + base + "-src", "-base", dir + base, "-widths", widths.join(",")], { stdio: "inherit" });
  }
  return {
    sizes: widths.filter((w) => existsSync(dir + `${base}-${w}.jpg`)).map((w) => [w, `assets/photos/${base}-${w}.jpg`]),
    credit: { author: AUTHOR[file] || strip(m.Artist?.value) || "Unknown", license: m.LicenseShortName?.value || "", licenseUrl: m.LicenseUrl?.value || "", page: info.descriptionurl },
  };
}

mkdirSync(dir, { recursive: true });
const PHOTOS = {};
for (const [place, file, pos, alt] of PICKS) {
  const n = (PHOTOS[place] || []).length + 1;
  const p = await fetchOne(file, `${place}-${n}`, WIDTHS);
  (PHOTOS[place] ||= []).push({ ...p, alt: { en: alt[0], ru: alt[1], uz: alt[2] }, ...(pos ? { pos } : {}) });
  console.log(place, n, "ok");
}
const hero = await fetchOne(HERO.file, "hero-khiva", [1024, 1600, 1920]);
writeFileSync(root + "js/photos.js",
  "/* Destination photos from Wikimedia Commons, written by tools/commons.mjs.\n   PHOTOS[place] = [{ sizes: [[width, file]…], alt: {en, ru, uz}, pos, credit }]; HERO = the home page photo. */\n" +
  "window.PHOTOS = " + JSON.stringify(PHOTOS, null, 1) + ";\nwindow.HERO = " + JSON.stringify({ ...hero, pos: HERO.pos, place: HERO.place, coords: HERO.coords, alt: HERO.alt }, null, 1) + ";\n");
console.log("wrote js/photos.js");
