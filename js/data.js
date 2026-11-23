/* Destinations, sights, transport links, prices and ready-made tours.
   All prices are approximate demo figures in so'm (the calculators use them;
   nothing here is a real offer). Works in the browser (window.DATA) and in
   Node (module.exports) so the tests can use it. */
(function (root) {
  "use strict";

  const REGIONS = ["tashkent", "center", "west", "east", "south"];
  const TYPES = ["history", "crafts", "food", "nature", "mountains", "desert"];
  const CLASSES = ["guest", "three", "four", "five"]; // hotel classes, cheapest first

  // s(id, en, ru, uz, textEn, textRu, textUz): one sight
  const s = (id, en, ru, uz, ten, tru, tuz) => ({ id, name: { en, ru, uz }, text: { en: ten, ru: tru, uz: tuz } });

  /* ---------- destinations ----------
     best: good months (1–12). heat / snow: months with a climate warning.
     hotel: price factor for the city. maxClass: best hotel class there
     ("yurt" = a desert yurt camp, priced per person). fees: entrance fees
     per adult for the main sights. minNights: below this the stay is rushed. */
  const CITIES = [
    { id: "tashkent", region: "tashkent", types: ["history", "food"], best: [3, 4, 5, 9, 10, 11], heat: [7, 8], snow: [], minNights: 1, hotel: 1.15, maxClass: "five", fees: 80000, airport: true, popular: 7,
      name: { en: "Tashkent", ru: "Ташкент", uz: "Toshkent" },
      about: { en: "The capital: wide avenues, the metro with its painted stations, and Chorsu bazaar under its green dome.", ru: "Столица: широкие проспекты, метро с расписными станциями и базар Чорсу под зелёным куполом.", uz: "Poytaxt: keng shohko'chalar, bezakli bekatlari bilan metro va yashil gumbazli Chorsu bozori." },
      sights: [
        s("hastimam", "Khast Imam complex", "Комплекс Хаст-Имам", "Hazrati Imom majmuasi", "Mosques and a library that keeps one of the oldest Qur'ans.", "Мечети и библиотека, где хранится один из древнейших Коранов.", "Masjidlar va eng qadimiy Qur'onlardan biri saqlanadigan kutubxona."),
        s("chorsu", "Chorsu Bazaar", "Базар Чорсу", "Chorsu bozori", "The old market under a green dome: spices, bread, dried fruit.", "Старый рынок под зелёным куполом: специи, лепёшки, сухофрукты.", "Yashil gumbaz ostidagi eski bozor: ziravorlar, non, quruq mevalar."),
        s("metro", "Tashkent Metro", "Ташкентское метро", "Toshkent metrosi", "Every station is decorated differently; Kosmonavtlar is the favourite.", "Каждая станция оформлена по-своему; самая любимая — «Космонавтлар».", "Har bir bekat o'zgacha bezatilgan; eng sevimlisi — «Kosmonavtlar»."),
        s("applied", "Museum of Applied Arts", "Музей прикладного искусства", "Amaliy san'at muzeyi", "A merchant's house with carved ceilings, ceramics and suzani.", "Дом купца с резными потолками, керамикой и сюзане.", "O'ymakor shiftli savdogar uyi, kulolchilik va so'zanalar."),
      ] },
    { id: "samarkand", region: "center", types: ["history", "crafts", "food"], best: [4, 5, 9, 10], heat: [6, 7, 8], snow: [], minNights: 2, hotel: 1.05, maxClass: "five", fees: 250000, airport: true, popular: 10,
      name: { en: "Samarkand", ru: "Самарканд", uz: "Samarqand" },
      about: { en: "Timur's capital: the Registan, blue domes and the street of mausoleums at Shah-i-Zinda.", ru: "Столица Тимура: Регистан, голубые купола и улица мавзолеев Шахи-Зинда.", uz: "Temur poytaxti: Registon, moviy gumbazlar va Shohi Zinda maqbaralar ko'chasi." },
      sights: [
        s("registan", "Registan", "Регистан", "Registon", "Three madrasas around one square; come back at night for the lights.", "Три медресе вокруг одной площади; вернитесь вечером, когда включают подсветку.", "Bir maydon atrofidagi uchta madrasa; kechqurun chiroqlar yonganda yana keling."),
        s("shahizinda", "Shah-i-Zinda", "Шахи-Зинда", "Shohi Zinda", "A narrow street of tiled tombs, every door a different blue.", "Узкая улица мавзолеев в изразцах, у каждой двери свой оттенок синего.", "Koshinli maqbaralarning tor ko'chasi, har bir eshik o'zgacha moviy."),
        s("guremir", "Gur-e Amir", "Гур-Эмир", "Go'ri Amir", "Timur's tomb under a ribbed turquoise dome.", "Усыпальница Тимура под ребристым бирюзовым куполом.", "Temurning maqbarasi, qovurg'ali feruza gumbaz ostida."),
        s("konigil", "Konigil paper mill", "Бумажная мастерская Конигил", "Konigil qog'oz ustaxonasi", "Paper made from mulberry bark the old way, by a stream outside the city.", "Бумага из коры тутовника по старинной технологии, у ручья за городом.", "Shahar tashqarisida, ariq bo'yida tut po'stlog'idan qadimiy usulda qog'oz."),
      ] },
    { id: "bukhara", region: "center", types: ["history", "crafts", "food"], best: [4, 5, 9, 10], heat: [6, 7, 8], snow: [], minNights: 2, hotel: 1, maxClass: "five", fees: 200000, airport: true, popular: 9,
      name: { en: "Bukhara", ru: "Бухара", uz: "Buxoro" },
      about: { en: "A living old town of trading domes, madrasas and the pool at Lyabi-Hauz.", ru: "Живой старый город: торговые купола, медресе и хауз Ляби-Хауз.", uz: "Tirik eski shahar: savdo gumbazlari, madrasalar va Labi Hovuz." },
      sights: [
        s("kalon", "Poi Kalon", "Пои-Калян", "Poyi Kalon", "The Kalon minaret and mosque, standing since 1127.", "Минарет и мечеть Калян, стоящие с 1127 года.", "1127-yildan beri turgan Kalon minorasi va masjidi."),
        s("ark", "The Ark", "Крепость Арк", "Ark qal'asi", "The fortress of the emirs, with a museum inside.", "Крепость эмиров с музеем внутри.", "Amirlar qal'asi, ichida muzey."),
        s("lyabi", "Lyabi-Hauz", "Ляби-Хауз", "Labi Hovuz", "Tea under old mulberry trees by a 17th-century pool.", "Чай под старыми тутовниками у хауза XVII века.", "XVII asr hovuzi bo'yida, keksa tut daraxtlari ostida choy."),
        s("sitorai", "Sitorai Mohi-Hosa", "Ситораи Мохи-Хоса", "Sitorai Mohi Xosa", "The last emir's summer palace, part European, part Uzbek.", "Летний дворец последнего эмира: наполовину европейский, наполовину узбекский.", "So'nggi amirning yozgi saroyi: yarmi Yevropacha, yarmi o'zbekcha."),
      ] },
    { id: "khiva", region: "west", types: ["history", "crafts"], best: [4, 5, 9, 10], heat: [6, 7, 8], snow: [], minNights: 1, hotel: 0.95, maxClass: "four", fees: 250000, airport: true, popular: 8,
      name: { en: "Khiva", ru: "Хива", uz: "Xiva" },
      about: { en: "A walled town inside the Itchan Kala, best at sunset from the city walls.", ru: "Город за стенами Ичан-Калы; лучше всего на закате с городской стены.", uz: "Ichan Qal'a devorlari ichidagi shahar; quyosh botayotganda devor ustidan eng go'zal." },
      sights: [
        s("itchan", "Itchan Kala", "Ичан-Кала", "Ichan Qal'a", "The inner town: one ticket for most museums and madrasas.", "Внутренний город: один билет на большинство музеев и медресе.", "Ichki shahar: ko'pchilik muzey va madrasalar uchun bitta chipta."),
        s("kaltaminor", "Kalta Minor", "Кальта-Минор", "Kalta Minor", "The short, wide minaret covered in turquoise tiles.", "Невысокий широкий минарет в бирюзовых изразцах.", "Feruza koshinli past va yo'g'on minora."),
        s("juma", "Juma Mosque", "Джума-мечеть", "Juma masjidi", "A hall of 213 carved wooden columns.", "Зал из 213 резных деревянных колонн.", "213 ta o'ymakor yog'och ustunli zal."),
        s("tashhauli", "Tash-Hauli Palace", "Дворец Таш-Хаули", "Toshhovli saroyi", "Courtyards of blue-and-white tiles and the khan's harem.", "Дворики в бело-синих изразцах и гарем хана.", "Oq-moviy koshinli hovlilar va xon harami."),
      ] },
    { id: "fergana", region: "east", types: ["crafts", "food", "nature"], best: [4, 5, 6, 9, 10], heat: [7, 8], snow: [], minNights: 2, hotel: 0.8, maxClass: "four", fees: 60000, airport: true, popular: 6,
      name: { en: "Fergana Valley", ru: "Ферганская долина", uz: "Farg'ona vodiysi" },
      about: { en: "Green, fertile and full of workshops: silk in Margilan, ceramics in Rishtan, the khan's palace in Kokand.", ru: "Зелёная плодородная долина мастеров: шёлк в Маргилане, керамика в Риштане, дворец хана в Коканде.", uz: "Yam-yashil, serhosil va hunarmandlar vodiysi: Marg'ilonda ipak, Rishtonda kulolchilik, Qo'qonda xon saroyi." },
      sights: [
        s("yodgorlik", "Yodgorlik silk factory", "Шёлковая фабрика «Ёдгорлик»", "«Yodgorlik» ipak fabrikasi", "Watch atlas silk being dyed and woven by hand in Margilan.", "В Маргилане атлас красят и ткут вручную у вас на глазах.", "Marg'ilonda atlasning qo'lda bo'yalishi va to'qilishini ko'ring."),
        s("rishtan", "Rishtan ceramics", "Риштанская керамика", "Rishton kulolchiligi", "Blue-glazed bowls and plates from family workshops.", "Пиалы и ляганы с синей глазурью из семейных мастерских.", "Oilaviy ustaxonalardan moviy sirli kosa va laganlar."),
        s("khudoyar", "Khudoyar Khan Palace", "Дворец Худояр-хана", "Xudoyorxon saroyi", "The tiled palace of the last khan of Kokand.", "Изразцовый дворец последнего кокандского хана.", "Qo'qonning so'nggi xonining koshinli saroyi."),
        s("kumtepa", "Kumtepa bazaar", "Базар Кумтепа", "Qumtepa bozori", "A Thursday and Sunday market for silk, hats and fruit.", "Базар по четвергам и воскресеньям: шёлк, тюбетейки, фрукты.", "Payshanba va yakshanba kunlari ipak, do'ppi va meva bozori."),
      ] },
    { id: "nukus", region: "west", types: ["history", "desert"], best: [4, 5, 9, 10], heat: [6, 7, 8], snow: [], minNights: 1, hotel: 0.8, maxClass: "three", fees: 120000, airport: true, popular: 4,
      name: { en: "Nukus", ru: "Нукус", uz: "Nukus" },
      about: { en: "The capital of Karakalpakstan, home of the Savitsky Museum of banned Soviet avant-garde art.", ru: "Столица Каракалпакстана, где находится музей Савицкого с запрещённым советским авангардом.", uz: "Qoraqalpog'iston poytaxti, taqiqlangan sovet avangardi saqlanadigan Savitskiy muzeyi shu yerda." },
      sights: [
        s("savitsky", "Savitsky Museum", "Музей Савицкого", "Savitskiy muzeyi", "Thousands of paintings saved from the censors in the desert.", "Тысячи картин, спасённых от цензуры в пустыне.", "Senzuradan cho'lda asrab qolingan minglab rasmlar."),
        s("mizdakhan", "Mizdakhan", "Миздахкан", "Mizdahkon", "An ancient hilltop cemetery and a ruined fortress.", "Древний некрополь на холме и руины крепости.", "Tepalikdagi qadimiy qabriston va qal'a xarobalari."),
        s("chilpik", "Chilpik", "Чилпык", "Chilpiq", "A round Zoroastrian tower of silence above the Amu Darya.", "Круглая зороастрийская «башня молчания» над Амударьёй.", "Amudaryo ustidagi aylana zardushtiylik «sukunat minorasi»."),
      ] },
    { id: "muynak", region: "west", types: ["desert", "nature"], best: [4, 5, 9, 10], heat: [6, 7, 8], snow: [12, 1, 2], minNights: 1, hotel: 0.7, maxClass: "guest", fees: 50000, airport: false, popular: 3,
      name: { en: "Muynak and the Aral Sea", ru: "Муйнак и Аральское море", uz: "Mo'ynoq va Orol dengizi" },
      about: { en: "A former fishing port where rusting ships now lie in the desert, a long way from the shrinking sea.", ru: "Бывший рыбацкий порт: ржавые корабли лежат в пустыне, далеко от отступившего моря.", uz: "Sobiq baliqchilar porti: zanglagan kemalar endi dengizdan ancha uzoqda, cho'lda yotibdi." },
      sights: [
        s("ships", "Ship cemetery", "Кладбище кораблей", "Kemalar qabristoni", "Old fishing boats on the dry seabed below the former shore.", "Старые рыболовецкие суда на высохшем дне ниже бывшего берега.", "Sobiq qirg'oq ostidagi qurigan tubda eski baliqchi kemalari."),
        s("aralmuseum", "Aral Sea Museum", "Музей Аральского моря", "Orol dengizi muzeyi", "Paintings and photos of Muynak when it was still by the water.", "Картины и фото Муйнака, когда он ещё стоял у воды.", "Mo'ynoq hali suv bo'yida bo'lgan paytdagi rasm va suratlar."),
        s("ustyurt", "Ustyurt plateau", "Плато Устюрт", "Ustyurt platosi", "Cliffs and a night camp by what is left of the sea (a long drive).", "Обрывы и ночлег у остатков моря (долгая дорога).", "Jarliklar va dengiz qoldig'i bo'yida tunash (uzoq yo'l)."),
      ] },
    { id: "chimgan", region: "tashkent", types: ["mountains", "nature"], best: [1, 2, 5, 6, 7, 8, 9], heat: [], snow: [12, 1, 2], minNights: 1, hotel: 1, maxClass: "five", fees: 100000, airport: false, popular: 6,
      name: { en: "Chimgan and Charvak", ru: "Чимган и Чарвак", uz: "Chimyon va Chorvoq" },
      about: { en: "Mountains 85 km from Tashkent: skiing in winter, hiking and the turquoise Charvak lake in summer.", ru: "Горы в 85 км от Ташкента: зимой лыжи, летом походы и бирюзовое Чарвакское водохранилище.", uz: "Toshkentdan 85 km uzoqlikdagi tog'lar: qishda chang'i, yozda sayr va feruza rangli Chorvoq suv ombori." },
      sights: [
        s("amirsoy", "Amirsoy resort", "Курорт Амирсой", "Amirsoy kurorti", "Cable cars up to the slopes, open all year.", "Канатные дороги на склоны, работают круглый год.", "Yonbag'irlarga osma yo'llar, yil bo'yi ishlaydi."),
        s("charvak", "Charvak lake", "Чарвакское водохранилище", "Chorvoq suv ombori", "Swimming and boat rides on a mountain lake in summer.", "Летом купание и прогулки на лодке по горному озеру.", "Yozda tog' ko'lida cho'milish va qayiqda sayr."),
        s("bigchimgan", "Big Chimgan hike", "Поход на Большой Чимган", "Katta Chimyon cho'qqisiga sayr", "A full-day climb to 3,309 m for fit walkers.", "Восхождение на 3309 м за один день для подготовленных.", "Tayyorgarligi bor sayyohlar uchun bir kunda 3309 m ga chiqish."),
      ] },
    { id: "nurata", region: "center", types: ["desert", "nature", "history"], best: [4, 5, 9, 10], heat: [6, 7, 8], snow: [12, 1, 2], minNights: 1, hotel: 1, maxClass: "yurt", fees: 40000, airport: false, popular: 5,
      name: { en: "Nurata and Aydarkul", ru: "Нурата и Айдаркуль", uz: "Nurota va Aydarko'l" },
      about: { en: "A night in a yurt camp in the Kyzylkum desert, a camel ride and a swim in Aydarkul lake.", ru: "Ночь в юртовом лагере в пустыне Кызылкум, прогулка на верблюде и купание в озере Айдаркуль.", uz: "Qizilqum cho'lidagi o'tov lagerida tunash, tuyada sayr va Aydarko'lda cho'milish." },
      sights: [
        s("yurts", "Yurt camp", "Юртовый лагерь", "O'tov lageri", "Dinner by the fire and a sky full of stars.", "Ужин у костра и небо, полное звёзд.", "Gulxan yonida kechki ovqat va yulduzlarga to'la osmon."),
        s("camel", "Camel ride", "Прогулка на верблюде", "Tuyada sayr", "An hour across the dunes at sunset.", "Час по барханам на закате.", "Quyosh botishida barxanlar bo'ylab bir soat."),
        s("aydarkul", "Aydarkul lake", "Озеро Айдаркуль", "Aydarko'l", "A huge lake in the middle of the desert.", "Огромное озеро посреди пустыни.", "Cho'l o'rtasidagi ulkan ko'l."),
        s("nuratafort", "Nurata fortress", "Крепость Нураты", "Nurota qal'asi", "Ruins linked to Alexander the Great, and a holy spring.", "Руины, которые связывают с Александром Македонским, и святой источник.", "Iskandar Zulqarnaynga bog'lanadigan xarobalar va muqaddas buloq."),
      ] },
    { id: "shahrisabz", region: "center", types: ["history"], best: [4, 5, 9, 10], heat: [6, 7, 8], snow: [], minNights: 1, hotel: 0.8, maxClass: "three", fees: 60000, airport: false, popular: 4,
      name: { en: "Shahrisabz", ru: "Шахрисабз", uz: "Shahrisabz" },
      about: { en: "Timur's home town over the mountain pass from Samarkand, with the giant gate of the Ak-Saray.", ru: "Родной город Тимура за перевалом от Самарканда, с огромным порталом Ак-Сарая.", uz: "Samarqanddan dovon ortidagi Temurning ona shahri, Oqsaroyning ulkan peshtoqi bilan." },
      sights: [
        s("aksaray", "Ak-Saray Palace", "Дворец Ак-Сарай", "Oqsaroy", "The remains of a 65-metre palace gate.", "Остатки 65-метрового портала дворца.", "65 metrli saroy peshtoqining qoldiqlari."),
        s("dorut", "Dorut Tilovat", "Дорут-Тиловат", "Dor ut-Tilovat", "Mosque and tombs of Timur's family.", "Мечеть и усыпальницы семьи Тимура.", "Masjid va Temur oilasining maqbaralari."),
        s("takhta", "Takhtakaracha pass", "Перевал Тахтакарача", "Taxtaqoracha dovoni", "Mountain views on the road from Samarkand.", "Горные виды по дороге из Самарканда.", "Samarqanddan yo'lda tog' manzaralari."),
      ] },
    { id: "zaamin", region: "center", types: ["mountains", "nature"], best: [5, 6, 7, 8, 9], heat: [], snow: [12, 1, 2], minNights: 1, hotel: 0.8, maxClass: "three", fees: 50000, airport: false, popular: 3,
      name: { en: "Zaamin National Park", ru: "Зааминский национальный парк", uz: "Zomin milliy bog'i" },
      about: { en: "Juniper forests and cool air in the Turkestan range, a summer escape from the heat.", ru: "Арчовые леса и прохладный воздух Туркестанского хребта — летнее спасение от жары.", uz: "Turkiston tizmasidagi archazorlar va salqin havo — yozgi issiqdan qochish uchun." },
      sights: [
        s("juniper", "Juniper forest trails", "Тропы в арчовом лесу", "Archazor so'qmoqlari", "Easy walks among 700-year-old junipers.", "Лёгкие прогулки среди 700-летних арчей.", "700 yillik archalar orasida yengil sayr."),
        s("suffa", "Suffa plateau", "Плато Суффа", "Suffa platosi", "A high plateau with a giant Soviet radio telescope.", "Высокое плато с гигантским советским радиотелескопом.", "Ulkan sovet radioteleskopi joylashgan baland plato."),
        s("zaaminlake", "Zaamin reservoir", "Зааминское водохранилище", "Zomin suv ombori", "A quiet lake for a picnic.", "Тихое озеро для пикника.", "Piknik uchun sokin ko'l."),
      ] },
    { id: "termez", region: "south", types: ["history"], best: [3, 4, 10, 11], heat: [5, 6, 7, 8, 9], snow: [], minNights: 2, hotel: 0.85, maxClass: "four", fees: 80000, airport: true, popular: 3,
      name: { en: "Termez", ru: "Термез", uz: "Termiz" },
      about: { en: "The far south on the Amu Darya: Buddhist monasteries from the Kushan era and the hottest summers in the country.", ru: "Крайний юг на Амударье: буддийские монастыри кушанской эпохи и самое жаркое лето в стране.", uz: "Amudaryo bo'yidagi janub: Kushon davri buddaviy ibodatxonalari va mamlakatdagi eng issiq yoz." },
      sights: [
        s("fayaztepa", "Fayaz Tepa", "Фаяз-Тепа", "Fayoztepa", "Ruins of a Buddhist monastery with a restored stupa.", "Руины буддийского монастыря с восстановленной ступой.", "Qayta tiklangan stupali buddaviy ibodatxona xarobalari."),
        s("hakim", "Al-Hakim at-Termizi", "Мавзолей ат-Термизи", "Al-Hakim at-Termiziy", "The complex of the city's best-known scholar.", "Комплекс самого известного учёного города.", "Shaharning eng mashhur allomasining majmuasi."),
        s("archmuseum", "Archaeological Museum", "Археологический музей", "Arxeologiya muzeyi", "Finds from 2,500 years of the region's history.", "Находки за 2500 лет истории края.", "Hududning 2500 yillik tarixidan topilmalar."),
      ] },
  ];

  // other spellings people type in the search box
  const ALIASES = {
    tashkent: ["ташкент", "toshkent", "tashkent"], samarkand: ["самарканд", "samarqand", "samarkand"], bukhara: ["бухара", "buxoro", "bukhara", "buhara"],
    khiva: ["хива", "xiva", "khiva", "urgench", "ургенч", "urganch"], fergana: ["фергана", "farg'ona", "fargona", "margilan", "маргилан", "kokand", "коканд", "rishtan", "риштан"],
    nukus: ["нукус", "nukus", "karakalpak", "каракалпак", "qoraqalpog'"], muynak: ["муйнак", "mo'ynoq", "moynoq", "aral", "арал", "orol"],
    chimgan: ["чимган", "chimyon", "charvak", "чарвак", "chorvoq", "amirsoy", "амирсой"], nurata: ["нурата", "nurota", "aydarkul", "айдаркуль", "aydarko'l", "yurt", "юрт", "o'tov"],
    shahrisabz: ["шахрисабз", "shakhrisabz"], zaamin: ["заамин", "zomin"], termez: ["термез", "termiz"],
  };

  /* ---------- transport links (both directions) ----------
     [a, b, mode, hours, price]: train and flight prices are per adult,
     car prices are per km for one car (see PRICES.carKm). */
  const LINKS = [
    ["tashkent", "samarkand", "train", 2.2, 270000], ["tashkent", "samarkand", "car", 4.5, 310],
    ["samarkand", "bukhara", "train", 1.6, 200000], ["samarkand", "bukhara", "car", 4, 270],
    ["tashkent", "bukhara", "train", 3.8, 420000], ["tashkent", "bukhara", "flight", 1.2, 700000],
    ["bukhara", "khiva", "train", 6.5, 220000], ["bukhara", "khiva", "car", 6.5, 450],
    ["tashkent", "khiva", "flight", 2.3, 900000], ["tashkent", "khiva", "train", 14.5, 350000],
    ["tashkent", "nukus", "flight", 1.8, 950000], ["nukus", "khiva", "car", 3, 190], ["nukus", "muynak", "car", 3, 210],
    ["tashkent", "fergana", "train", 4.8, 160000], ["tashkent", "fergana", "car", 5, 320], ["tashkent", "fergana", "flight", 1, 600000],
    ["tashkent", "chimgan", "car", 1.5, 85],
    ["samarkand", "shahrisabz", "car", 1.8, 90], ["shahrisabz", "bukhara", "car", 4.5, 300],
    ["samarkand", "nurata", "car", 3, 180], ["nurata", "bukhara", "car", 3.5, 220],
    ["tashkent", "zaamin", "car", 3.5, 220], ["samarkand", "zaamin", "car", 2.5, 160],
    ["samarkand", "termez", "train", 6, 180000], ["samarkand", "termez", "car", 6, 370], ["tashkent", "termez", "flight", 1.5, 850000],
  ];

  /* ---------- prices (so'm, approximate) ---------- */
  const PRICES = {
    room: { guest: 450000, three: 750000, four: 1200000, five: 2400000 }, // one double room, one night
    yurt: 550000,        // per person per night in a yurt camp, dinner and breakfast included
    extraBed: 0.25,      // a second child in a room: share of the room price
    meals: 220000,       // per adult per day
    childMeals: 0.6,     // children (under 12) eat for this share
    childFare: 0.5,      // children pay half on trains, planes and entrance fees
    guide: 650000,       // per day, for the whole group
    driverDay: 900000,   // a private car and driver for the whole trip, per car per day
    carKm: 3500,         // a transfer car with driver, per km (up to 3 travellers)
    van: 1.6,            // a minivan for 4–7 travellers costs this much more
    usd: 12650,          // demo exchange rate, so'm for 1 US dollar
    season: { 1: 0.85, 2: 0.85, 3: 1, 4: 1.2, 5: 1.2, 6: 1, 7: 0.9, 8: 0.9, 9: 1.2, 10: 1.2, 11: 1, 12: 0.85 }, // hotel prices by month
    group: [[10, 0.08], [6, 0.05]], // from this many travellers: discount on hotels and guide
  };

  /* ---------- ready-made tours (opened in the planner) ---------- */
  const TOURS = [
    { id: "classic", stops: [["tashkent", 1], ["samarkand", 2], ["bukhara", 2], ["khiva", 2]], hotel: "three", guide: true, types: ["history", "crafts"],
      name: { en: "Classic Silk Road", ru: "Классический Шёлковый путь", uz: "Klassik Buyuk ipak yo'li" },
      about: { en: "The four great cities in one week, with fast trains between them and a flight home from Khiva.", ru: "Четыре великих города за неделю: скоростные поезда между ними и перелёт домой из Хивы.", uz: "To'rtta buyuk shahar bir haftada: oralarida tezyurar poyezdlar va Xivadan uyga parvoz." } },
    { id: "weekend", stops: [["samarkand", 2]], hotel: "four", guide: true, types: ["history"],
      name: { en: "Samarkand weekend", ru: "Выходные в Самарканде", uz: "Samarqandda dam olish kunlari" },
      about: { en: "Two nights in Samarkand from Tashkent by the Afrosiyob train.", ru: "Две ночи в Самарканде, из Ташкента на поезде «Афросиаб».", uz: "Toshkentdan «Afrosiyob» poyezdida Samarqandda ikki kecha." } },
    { id: "crafts", stops: [["fergana", 3]], hotel: "three", guide: true, types: ["crafts", "food"],
      name: { en: "Fergana Valley crafts", ru: "Ремёсла Ферганской долины", uz: "Farg'ona vodiysi hunarmandchiligi" },
      about: { en: "Silk, ceramics and bazaars, with time in the workshops.", ru: "Шёлк, керамика и базары, с временем в мастерских.", uz: "Ipak, kulolchilik va bozorlar, ustaxonalarda vaqt bilan." } },
    { id: "aral", stops: [["nukus", 1], ["muynak", 1], ["khiva", 2]], hotel: "three", guide: true, types: ["desert", "history"],
      name: { en: "The Aral Sea and Karakalpakstan", ru: "Арал и Каракалпакстан", uz: "Orol va Qoraqalpog'iston" },
      about: { en: "The Savitsky Museum, the ship cemetery at Muynak and the walls of Khiva.", ru: "Музей Савицкого, кладбище кораблей в Муйнаке и стены Хивы.", uz: "Savitskiy muzeyi, Mo'ynoqdagi kemalar qabristoni va Xiva devorlari." } },
    { id: "mountains", stops: [["chimgan", 2]], hotel: "four", guide: false, types: ["mountains", "nature"],
      name: { en: "Chimgan mountain break", ru: "Отдых в горах Чимгана", uz: "Chimyon tog'larida dam olish" },
      about: { en: "Two nights in the mountains, an hour and a half from Tashkent.", ru: "Две ночи в горах, в полутора часах от Ташкента.", uz: "Toshkentdan bir yarim soatlik masofada tog'larda ikki kecha." } },
    { id: "desert", stops: [["samarkand", 1], ["nurata", 1], ["bukhara", 2]], hotel: "three", guide: true, types: ["desert", "history"],
      name: { en: "Desert night between Samarkand and Bukhara", ru: "Ночь в пустыне между Самаркандом и Бухарой", uz: "Samarqand va Buxoro orasida cho'lda tun" },
      about: { en: "A yurt camp by Aydarkul lake on the road between the two cities.", ru: "Юртовый лагерь у озера Айдаркуль по дороге между двумя городами.", uz: "Ikki shahar orasidagi yo'lda, Aydarko'l bo'yida o'tov lageri." } },
    { id: "grand", stops: [["tashkent", 2], ["fergana", 2], ["samarkand", 2], ["shahrisabz", 1], ["bukhara", 2], ["nurata", 1], ["khiva", 2]], hotel: "four", guide: true, types: ["history", "crafts", "desert"],
      name: { en: "Grand Uzbekistan", ru: "Большой Узбекистан", uz: "Katta O'zbekiston" },
      about: { en: "Two weeks from the Fergana Valley to Khiva, with a desert night on the way.", ru: "Две недели от Ферганской долины до Хивы с ночью в пустыне по дороге.", uz: "Farg'ona vodiysidan Xivagacha ikki hafta, yo'lda cho'lda bir tun bilan." } },
    { id: "south", stops: [["samarkand", 1], ["termez", 2]], hotel: "three", guide: true, types: ["history"],
      name: { en: "Buddhist Termez", ru: "Буддийский Термез", uz: "Buddaviy Termiz" },
      about: { en: "Kushan-era monasteries in the far south, best in spring and autumn.", ru: "Монастыри кушанской эпохи на крайнем юге; лучше весной и осенью.", uz: "Janubdagi Kushon davri ibodatxonalari; bahor va kuzda eng yaxshi." } },
    { id: "summer", stops: [["zaamin", 2], ["samarkand", 1]], hotel: "three", guide: false, types: ["mountains", "nature"],
      name: { en: "Cool summer in Zaamin", ru: "Прохладное лето в Заамине", uz: "Zominda salqin yoz" },
      about: { en: "Juniper forests when the cities are hot, then one night in Samarkand.", ru: "Арчовые леса, когда в городах жарко, а потом ночь в Самарканде.", uz: "Shaharlar issiq paytda archazorlar, keyin Samarqandda bir kecha." } },
    { id: "food", stops: [["tashkent", 2], ["samarkand", 2]], hotel: "four", guide: true, types: ["food", "history"],
      name: { en: "Plov and bread: a food trip", ru: "Плов и лепёшки: гастротур", uz: "Palov va non: gastronomik sayohat" },
      about: { en: "Bazaars, a plov centre in Tashkent and Samarkand bread straight from the tandoor.", ru: "Базары, плов-центр в Ташкенте и самаркандские лепёшки прямо из тандыра.", uz: "Bozorlar, Toshkentdagi osh markazi va tandirdan uzilgan Samarqand noni." } },
  ];

  /* ---------- the agency ---------- */
  const OFFICES = [
    { id: "tash", city: "tashkent", address: { en: "Amir Temur Avenue 15, Tashkent", ru: "проспект Амира Темура, 15, Ташкент", uz: "Amir Temur shoh ko'chasi, 15, Toshkent" } },
    { id: "sam", city: "samarkand", address: { en: "Registon Street 4, Samarkand", ru: "улица Регистан, 4, Самарканд", uz: "Registon ko'chasi, 4, Samarqand" } },
  ];
  const START_CITIES = ["tashkent", "samarkand", "bukhara", "khiva", "fergana", "nukus", "termez"]; // cities with an airport

  const city = (id) => CITIES.find((c) => c.id === id) || null;
  const tour = (id) => TOURS.find((t) => t.id === id) || null;

  const DATA = { REGIONS, TYPES, CLASSES, CITIES, ALIASES, LINKS, PRICES, TOURS, OFFICES, START_CITIES, city, tour };
  if (typeof module !== "undefined" && module.exports) module.exports = DATA;
  else root.DATA = DATA;
})(typeof window !== "undefined" ? window : globalThis);
