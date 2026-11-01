// Languages and every word the game can say.
// WORDS entries are [English, Japanese, Chinese, Indonesian]. Japanese and
// Chinese use "native|reading" so word cards can show romaji / pinyin too.

const LANGS = [
  { id: 'en', name: 'English', voice: 'en-US' },
  { id: 'ja', name: '日本語', voice: 'ja-JP' },
  { id: 'zh', name: '中文', voice: 'zh-CN' },
  { id: 'id', name: 'Indonesia', voice: 'id-ID' },
];
const LANG_COLUMN = { en: 0, ja: 1, zh: 2, id: 3 };

const WORDS = {
  title:      ['Rainbow Zoo', 'にじいろどうぶつえん|nijiiro dōbutsuen', '彩虹动物园|cǎihóng dòngwùyuán', 'Kebun Binatang Pelangi'],
  hello:      ['Hello!', 'こんにちは！|konnichiwa', '你好！|nǐ hǎo', 'Halo!'],
  yummy:      ['Yummy!', 'おいしい！|oishii', '好吃！|hǎo chī', 'Enak!'],
  great:      ['Great job!', 'すごい！|sugoi', '真棒！|zhēn bàng', 'Hebat!'],
  big:        ['So big!', 'おおきい！|ōkii', '好大！|hǎo dà', 'Besar sekali!'],
  roar:       ['Roar!', 'ガオー！|gaō', '吼！|hǒu', 'Aum!'],
  meow:       ['Meow!', 'ニャー！|nyā', '喵！|miāo', 'Meong!'],

  // Levels
  level:      ['Level', 'レベル|reberu', '等级|děngjí', 'Level'],
  levelup:    ['Level up!', 'レベルアップ！|reberu appu', '升级啦！|shēngjí la', 'Naik level!'],
  new:        ['New!', 'あたらしい！|atarashii', '新的！|xīn de', 'Baru!'],

  // Hats (level rewards)
  bow:        ['bow', 'リボン|ribon', '蝴蝶结|húdiéjié', 'pita'],
  flower:     ['flower', 'おはな|ohana', '花|huā', 'bunga'],
  cap:        ['cap', 'ぼうし|bōshi', '帽子|màozi', 'topi'],
  sunhat:     ['sun hat', 'むぎわらぼうし|mugiwara bōshi', '草帽|cǎomào', 'topi jerami'],
  headphones: ['headphones', 'ヘッドホン|heddohon', '耳机|ěrjī', 'headphone'],
  tophat:     ['top hat', 'シルクハット|shiruku hatto', '礼帽|lǐmào', 'topi tinggi'],
  gradcap:    ['graduation cap', 'がくぼう|gakubō', '学士帽|xuéshìmào', 'topi toga'],
  star:       ['star', 'ほし|hoshi', '星星|xīngxing', 'bintang'],
  crown:      ['crown', 'おうかん|ōkan', '皇冠|huángguān', 'mahkota'],

  // Hints for what to do with the mouse / finger
  click:      ['Click!', 'クリック！|kurikku', '点一下！|diǎn yíxià', 'Klik!'],
  tap:        ['Tap!', 'タップ！|tappu', '点一下！|diǎn yíxià', 'Ketuk!'],
  drag:       ['Drag!', 'ドラッグ！|doraggu', '拖一拖！|tuō yi tuō', 'Seret!'],

  // Animals
  rabbit:     ['rabbit', 'うさぎ|usagi', '兔子|tùzi', 'kelinci'],
  hamster:    ['hamster', 'ハムスター|hamusutā', '仓鼠|cāngshǔ', 'hamster'],
  lion:       ['lion', 'ライオン|raion', '狮子|shīzi', 'singa'],
  dinosaur:   ['dinosaur', 'きょうりゅう|kyōryū', '恐龙|kǒnglóng', 'dinosaurus'],
  godzilla:   ['Godzilla', 'ゴジラ|gojira', '哥斯拉|gēsīlā', 'Godzilla'],
  giraffe:    ['giraffe', 'キリン|kirin', '长颈鹿|chángjǐnglù', 'jerapah'],
  elephant:   ['elephant', 'ぞう|zō', '大象|dàxiàng', 'gajah'],
  horse:      ['horse', 'うま|uma', '马|mǎ', 'kuda'],
  cat:        ['cat', 'ねこ|neko', '猫|māo', 'kucing'],
  ladybug:    ['ladybug', 'てんとうむし|tentōmushi', '瓢虫|piáochóng', 'kepik'],

  // Fruits
  apple:      ['apple', 'りんご|ringo', '苹果|píngguǒ', 'apel'],
  banana:     ['banana', 'バナナ|banana', '香蕉|xiāngjiāo', 'pisang'],
  strawberry: ['strawberry', 'いちご|ichigo', '草莓|cǎoméi', 'stroberi'],
  grapes:     ['grapes', 'ぶどう|budō', '葡萄|pútáo', 'anggur'],
  watermelon: ['watermelon', 'すいか|suika', '西瓜|xīguā', 'semangka'],
  orange:     ['orange', 'みかん|mikan', '橘子|júzi', 'jeruk'],
  peach:      ['peach', 'もも|momo', '桃子|táozi', 'persik'],
  cherry:     ['cherry', 'さくらんぼ|sakuranbo', '樱桃|yīngtáo', 'ceri'],

  // Vegetables
  carrot:     ['carrot', 'にんじん|ninjin', '胡萝卜|húluóbo', 'wortel'],
  broccoli:   ['broccoli', 'ブロッコリー|burokkorī', '西兰花|xīlánhuā', 'brokoli'],
  corn:       ['corn', 'とうもろこし|tōmorokoshi', '玉米|yùmǐ', 'jagung'],
  tomato:     ['tomato', 'トマト|tomato', '西红柿|xīhóngshì', 'tomat'],
  cucumber:   ['cucumber', 'きゅうり|kyūri', '黄瓜|huángguā', 'mentimun'],
  potato:     ['potato', 'じゃがいも|jagaimo', '土豆|tǔdòu', 'kentang'],

  // Colors (prefixed so the color "orange" doesn't clash with the fruit)
  c_red:      ['red', 'あか|aka', '红色|hóngsè', 'merah'],
  c_orange:   ['orange', 'オレンジ|orenji', '橙色|chéngsè', 'oranye'],
  c_yellow:   ['yellow', 'きいろ|kiiro', '黄色|huángsè', 'kuning'],
  c_green:    ['green', 'みどり|midori', '绿色|lǜsè', 'hijau'],
  c_blue:     ['blue', 'あお|ao', '蓝色|lánsè', 'biru'],
  c_purple:   ['purple', 'むらさき|murasaki', '紫色|zǐsè', 'ungu'],
  c_pink:     ['pink', 'ピンク|pinku', '粉色|fěnsè', 'merah muda'],

  // Numbers
  n0:  ['zero', 'ゼロ|zero', '零|líng', 'nol'],
  n1:  ['one', 'いち|ichi', '一|yī', 'satu'],
  n2:  ['two', 'に|ni', '二|èr', 'dua'],
  n3:  ['three', 'さん|san', '三|sān', 'tiga'],
  n4:  ['four', 'よん|yon', '四|sì', 'empat'],
  n5:  ['five', 'ご|go', '五|wǔ', 'lima'],
  n6:  ['six', 'ろく|roku', '六|liù', 'enam'],
  n7:  ['seven', 'なな|nana', '七|qī', 'tujuh'],
  n8:  ['eight', 'はち|hachi', '八|bā', 'delapan'],
  n9:  ['nine', 'きゅう|kyū', '九|jiǔ', 'sembilan'],
  n10: ['ten', 'じゅう|jū', '十|shí', 'sepuluh'],

  // Directions
  up:         ['up', 'うえ|ue', '上|shàng', 'atas'],
  down:       ['down', 'した|shita', '下|xià', 'bawah'],
  left:       ['left', 'ひだり|hidari', '左|zuǒ', 'kiri'],
  right:      ['right', 'みぎ|migi', '右|yòu', 'kanan'],

  // Daily routine (clock mode)
  wakeup:     ['Wake up!', 'おはよう！|ohayō', '起床！|qǐchuáng', 'Bangun!'],
  breakfast:  ['Breakfast', 'あさごはん|asa gohan', '早饭|zǎofàn', 'Sarapan'],
  play:       ['Play time', 'あそぶじかん|asobu jikan', '玩耍时间|wánshuǎ shíjiān', 'Waktu bermain'],
  lunch:      ['Lunch', 'ひるごはん|hiru gohan', '午饭|wǔfàn', 'Makan siang'],
  nap:        ['Nap time', 'おひるね|ohirune', '午睡|wǔshuì', 'Tidur siang'],
  snack:      ['Snack time', 'おやつ|oyatsu', '点心|diǎnxin', 'Camilan'],
  dinner:     ['Dinner', 'ばんごはん|ban gohan', '晚饭|wǎnfàn', 'Makan malam'],
  bath:       ['Bath time', 'おふろ|ofuro', '洗澡|xǐzǎo', 'Mandi'],
  bedtime:    ['Good night', 'おやすみ|oyasumi', '晚安|wǎn’ān', 'Selamat tidur'],

  // Game modes
  mode_walk:    ['Walk & Play', 'おさんぽ|osanpo', '散步|sànbù', 'Jalan-jalan'],
  mode_feed:    ['Snack Time', 'もぐもぐ|mogumogu', '吃东西|chī dōngxi', 'Ayo Makan'],
  mode_letters: ['Letter Balloons', 'もじふうせん|moji fūsen', '字母气球|zìmǔ qìqiú', 'Balon Huruf'],
  mode_bubbles: ['Bubble Pop', 'しゃぼんだま|shabondama', '泡泡|pàopao', 'Gelembung'],
  mode_buttons: ['Button Party', 'ボタン|botan', '按钮|ànniǔ', 'Tombol'],
  mode_clock:   ['Clock Time', 'とけい|tokei', '时钟|shízhōng', 'Jam'],
};

function word(key, lang = Settings.lang) {
  const entry = WORDS[key];
  if (!entry) return { text: key, roman: '', en: key };
  const [text, roman = ''] = entry[LANG_COLUMN[lang]].split('|');
  return { text, roman, en: entry[0] };
}

// Hour names, index 1..12.
const HOUR_WORDS = {
  en: ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'],
  ja: ['', 'いちじ|ichi-ji', 'にじ|ni-ji', 'さんじ|san-ji', 'よじ|yo-ji', 'ごじ|go-ji', 'ろくじ|roku-ji',
    'しちじ|shichi-ji', 'はちじ|hachi-ji', 'くじ|ku-ji', 'じゅうじ|jū-ji', 'じゅういちじ|jūichi-ji', 'じゅうにじ|jūni-ji'],
  zh: ['', '一点|yī diǎn', '两点|liǎng diǎn', '三点|sān diǎn', '四点|sì diǎn', '五点|wǔ diǎn', '六点|liù diǎn',
    '七点|qī diǎn', '八点|bā diǎn', '九点|jiǔ diǎn', '十点|shí diǎn', '十一点|shíyī diǎn', '十二点|shí’èr diǎn'],
  id: ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas', 'dua belas'],
};

// How a clock time is said, e.g. 3:30 -> "half past 3" / "3時半" / "三点半" / "jam setengah empat".
function timePhrase(minutes, lang = Settings.lang) {
  const m = Math.round(minutes) % 60;
  const h = Math.floor(minutes / 60) % 12 || 12;
  const next = (h % 12) + 1;
  const en = m === 0 ? `${h} o'clock`
    : m === 30 ? `half past ${h}`
    : m === 15 ? `quarter past ${h}`
    : m === 45 ? `quarter to ${next}`
    : `${h}:${String(m).padStart(2, '0')}`;

  if (lang === 'ja') {
    const [kana, romaji] = HOUR_WORDS.ja[h].split('|');
    if (m === 0) return { text: `${h}時`, roman: `${kana} · ${romaji}`, en };
    if (m === 30) return { text: `${h}時半`, roman: `${kana}はん · ${romaji} han`, en };
    return { text: `${h}時${m}分`, roman: '', en };
  }
  if (lang === 'zh') {
    const [han, pinyin] = HOUR_WORDS.zh[h].split('|');
    if (m === 0) return { text: han, roman: pinyin, en };
    if (m === 30) return { text: `${han}半`, roman: `${pinyin} bàn`, en };
    if (m === 15) return { text: `${han}一刻`, roman: `${pinyin} yí kè`, en };
    if (m === 45) return { text: `${han}三刻`, roman: `${pinyin} sān kè`, en };
    return { text: `${han}${m}分`, roman: '', en };
  }
  if (lang === 'id') {
    const n = HOUR_WORDS.id;
    if (m === 0) return { text: `jam ${n[h]}`, roman: '', en };
    if (m === 30) return { text: `jam setengah ${n[next]}`, roman: '', en };
    if (m === 15) return { text: `jam ${n[h]} lewat seperempat`, roman: '', en };
    if (m === 45) return { text: `jam ${n[next]} kurang seperempat`, roman: '', en };
    return { text: `jam ${n[h]} lewat ${m} menit`, roman: '', en };
  }
  return { text: en, roman: '', en };
}

// "Press A" for hints; `label` is what's printed on the key or button.
function pressPhrase(label, lang = Settings.lang) {
  switch (lang) {
    case 'ja': return `${label}をおして`;
    case 'zh': return `按${label}`;
    case 'id': return `Tekan ${label}`;
    default: return `Press ${label}`;
  }
}

// "Can you make it 3 o'clock?" for the clock quiz.
function clockPrompt(phrase, lang = Settings.lang) {
  switch (lang) {
    case 'ja': return `${phrase.text}にしてね`;
    case 'zh': return `请拨到${phrase.text}`;
    case 'id': return `Ayo putar ke ${phrase.text}`;
    default: return `Can you make it ${phrase.text}?`;
  }
}
