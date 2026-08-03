'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type SupportedLanguage = 'en' | 'th' | 'kr' | 'jp';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  flag: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'th', label: 'ไทย (Thai)', flag: '🇹🇭' },
  { code: 'en', label: 'English (US)', flag: '🇺🇸' },
  { code: 'kr', label: '한국어 (Korean)', flag: '🇰🇷' },
  { code: 'jp', label: '日本語 (Japanese)', flag: '🇯🇵' },
];

export const translations = {
  en: {
    nav: {
      home: 'Home Metas',
      browse: 'Browse Setups',
      inventory: 'My Inventory',
      admin: 'Admin Portal',
      signIn: 'Sign In',
      signOut: 'Sign Out'
    },
    home: {
      badge: 'Cookie Run Classic Personalized Meta Finder',
      titlePrefix: 'Custom Metas For',
      heroDesc: 'Find the highest scoring and best coin-farming team combinations matched directly against your owned Cookies, Pets, and Treasures.',
      manageProfile: 'Manage Inventory',
      browseAll: 'Browse All Setups',
      activeInventory: 'Active Inventory',
      cookiesOwned: 'Cookies Owned',
      petsOwned: 'Pets Owned',
      treasuresOwned: 'Treasures Owned',
      topRecommended: 'Recommended Setups (Waterfall View)',
      recommendedDesc: 'Continuous waterfall stream matched against your owned items',
      readyToRun: '100% Ready To Run',
      matchScore: '% Inventory Match',
      boostedMeta: 'BOOSTED META',
      missing: 'Missing:',
      substitute: 'You own substitute:',
      targetScore: 'Target Score',
      coinsPerRun: 'Coins / Run',
      viewDetails: 'View Details',
      loadMore: 'Load More Metas',
      streaming: 'Streaming Waterfall Metas...',
      showing: 'Showing'
    },
    combo: {
      badge: 'Cookie Run Classic Waterfall Metas',
      title: 'Community Metas & Setups',
      subtitle: 'Explore authentic combinations, coin farming builds, and high score runs in a smooth waterfall stream.',
      submitSetup: 'Submit New Setup',
      searchPlaceholder: 'Search combos by name, strategy, or tag (e.g. Coin Farming, Magnet)...',
      selectEpisode: '1. Select Episode / Stage:',
      selectGoal: '2. Select Goal / Purpose:',
      allEpisodes: 'All Episodes',
      allGoals: 'All Goals',
      highScore: 'High Score',
      coinFarming: 'Coin Farming',
      xpFarming: 'XP Farming',
      semiAfk: 'Semi-AFK',
      fullManual: 'Full Manual',
      treasureBox: 'Treasure Box',
      inspectDetails: 'Inspect Details & Substitutes',
      postSetup: 'Post Setup',
      waterfallStream: 'Waterfall Stream',
      ready: 'Ready'
    },
    profile: {
      badge: 'Paginated Inventory Manager',
      title: 'Manage Your Collection',
      subtitle: 'Toggle your owned Cookies, Pets, and Treasures or upload an in-game screenshot to auto-import your collection!',
      aiScanner: 'AI Vision Scanner',
      uploadScreenshots: 'Upload In-Game Inventory Screenshot(s)',
      uploadDesc: 'Upload one or more screenshots of your treasure inventory — AI Vision reads every icon and its +0 to +9 enhancement badge, then lets you verify before importing.',
      scanning: 'Scanning…',
      uploadBtn: 'Upload Screenshot(s)',
      cookiesTab: 'Cookies',
      petsTab: 'Pets',
      treasuresTab: 'Treasures',
      selectAll: 'Select All',
      clearAll: 'Clear All',
      grade: 'Grade:',
      allGrades: 'All Grades',
      detailsAndStats: 'Details & Stats'
    },
    modal: {
      combiBreakdown: 'Setup Lineup Breakdown',
      mainRunner: 'Main Runner',
      relayRunner: 'Relay Runner',
      combiPet: 'Combi Pet',
      equippedTreasures: 'Equipped Treasures',
      strategyNotes: 'Runner Notes & Strategy',
      shareSetup: 'Share Setup',
      copied: 'Link Copied!',
      done: 'Done',
      close: 'Close',
      missingTitle: 'Missing Treasures & Substitutes You Own',
      noAlt: 'No direct tag match in inventory.',
      useAlt: 'Use owned alt:'
    },
    ads: {
      advertisement: 'ADVERTISEMENT',
      sponsored: 'Sponsored',
      learnMore: 'Learn More',
      featuredPartner: 'Featured Partner'
    }
  },
  th: {
    nav: {
      home: 'หน้าหลัก เมต้า',
      browse: 'ค้นหาเซ็ตการเล่น',
      inventory: 'คลังของฉัน',
      admin: 'ผู้ดูแลระบบ',
      signIn: 'เข้าสู่ระบบ',
      signOut: 'ออกจากระบบ'
    },
    home: {
      badge: 'ระบบค้นหาเมต้า คุกกี้รัน คลาสสิก ส่วนบุคคล',
      titlePrefix: 'จัดเมต้าเฉพาะสำหรับ',
      heroDesc: 'ค้นหาคอมโบทำคะแนนสูงสุดและคอมโบฟาร์มเหรียญที่ดีที่สุด ที่แมตช์เข้ากับคุกกี้ เพ็ท และสมบัติที่คุณมีโดยตรง',
      manageProfile: 'จัดการคลังของฉัน',
      browseAll: 'ดูเซ็ตการเล่นทั้งหมด',
      activeInventory: 'คลังไอเทมครอบครอง',
      cookiesOwned: 'คุกกี้ที่มี',
      petsOwned: 'เพ็ทที่มี',
      treasuresOwned: 'สมบัติที่มี',
      topRecommended: 'คอมโบแนะนำสำหรับคุณ (มุมมองวอเตอร์ฟอล)',
      recommendedDesc: 'แสดงผลแบบวอเตอร์ฟอลต่อเนื่อง แมตช์ตามไอเทมที่คุณมีในคลัง',
      readyToRun: 'พร้อมลงวิ่ง 100%',
      matchScore: '% ไอเทมในคลังตรงกัน',
      boostedMeta: 'เมต้าแนะนำพิเศษ',
      missing: 'ขาด:',
      substitute: 'คุณมีสมบัติทดแทน:',
      targetScore: 'คะแนนเป้าหมาย',
      coinsPerRun: 'เหรียญ / รอบ',
      viewDetails: 'ดูรายละเอียด',
      loadMore: 'โหลดเมต้าเพิ่มเติม',
      streaming: 'กำลังโหลดข้อมูลวอเตอร์ฟอล...',
      showing: 'แสดงอยู่'
    },
    combo: {
      badge: 'เซ็ตการเล่น คุกกี้รัน คลาสสิก',
      title: 'คอมโบ & เซ็ตการเล่นจากผู้เล่น',
      subtitle: 'สำรวจคอมโบทำคะแนน ฟาร์มเหรียญ และเซ็ตยอดนิยมจากผู้เล่นในมุมมองวอเตอร์ฟอล',
      submitSetup: 'แชร์เซ็ตการเล่นใหม่',
      searchPlaceholder: 'ค้นหาคอมโบตามชื่อ กลยุทธ์ หรือแท็ก (เช่น ฟาร์มเหรียญ, แม่เหล็ก)...',
      selectEpisode: '1. เลือกด่าน / เอพพิโซด:',
      selectGoal: '2. เลือกจุดประสงค์การวิ่ง:',
      allEpisodes: 'ทุกเอพพิโซด',
      allGoals: 'ทุกเป้าหมาย',
      highScore: 'ทำคะแนนสูง',
      coinFarming: 'ฟาร์มเหรียญ',
      xpFarming: 'ฟาร์ม XP',
      semiAfk: 'กึ่งออโต้ (준손크로)',
      fullManual: 'เล่นเอง (손크로)',
      treasureBox: 'กล่องสมบัติ',
      inspectDetails: 'ดูรายละเอียด & สมบัติทดแทน',
      postSetup: 'โพสต์เซ็ตการเล่น',
      waterfallStream: 'สตรีมวอเตอร์ฟอล',
      ready: 'พร้อมวิ่ง'
    },
    profile: {
      badge: 'ระบบจัดการคลังไอเทม (แบ่งหน้า)',
      title: 'จัดการคลังสะสมของคุณ',
      subtitle: 'คลิกเลือกคุกกี้ เพ็ท และสมบัติที่มี หรืออัปโหลดภาพหน้าจอในเกมเพื่อนำเข้าอัตโนมัติด้วย AI!',
      aiScanner: 'สแกนเนอร์ AI Vision',
      uploadScreenshots: 'อัปโหลดภาพหน้าจอคลังไอเทมในเกม',
      uploadDesc: 'อัปโหลดภาพหน้าจอสมบัติ AI Vision จะอ่านไอคอนและระดับตีบวก +0 ถึง +9 และให้คุณตรวจสอบก่อนบันทึกเข้าคลัง',
      scanning: 'กำลังสแกน…',
      uploadBtn: 'อัปโหลดรูปภาพ',
      cookiesTab: 'คุกกี้',
      petsTab: 'เพ็ท',
      treasuresTab: 'สมบัติ',
      selectAll: 'เลือกทั้งหมด',
      clearAll: 'ยกเลิกทั้งหมด',
      grade: 'ระดับ:',
      allGrades: 'ทุกระดับ',
      detailsAndStats: 'รายละเอียด & สเตตัส'
    },
    modal: {
      combiBreakdown: 'รายละเอียดการจัดทีม',
      mainRunner: 'คุกกี้ตัวหลัก',
      relayRunner: 'คุกกี้ไม้ 2',
      combiPet: 'เพ็ทคู่หู',
      equippedTreasures: 'สมบัติที่สวมใส่',
      strategyNotes: 'เทคนิค & กลยุทธ์การเล่น',
      shareSetup: 'แชร์ลิงก์เซ็ตนี้',
      copied: 'คัดลอกลิงก์แล้ว!',
      done: 'ตกลง',
      close: 'ปิด',
      missingTitle: 'สมบัติที่ขาด & สมบัติทดแทนที่คุณมี',
      noAlt: 'ไม่มีสมบัติที่มีเอฟเฟกต์ตรงกันในคลัง',
      useAlt: 'ใช้สมบัติที่มีแทน:'
    },
    ads: {
      advertisement: 'โฆษณา',
      sponsored: 'ได้รับการสนับสนุน',
      learnMore: 'ดูรายละเอียด',
      featuredPartner: 'พาร์ทเนอร์แนะนำ'
    }
  },
  kr: {
    nav: {
      home: '메타 추천',
      browse: '조합 탐색',
      inventory: '내 보물함',
      admin: '관리자 포털',
      signIn: '로그인',
      signOut: '로그아웃'
    },
    home: {
      badge: '쿠키런 클래식 맞춤 조합 검색기',
      titlePrefix: '맞춤 추천 조합:',
      heroDesc: '보유 중인 쿠키, 펫, 보물을 기반으로 최적의 고득점 및 코인 노가다 조합을 추천합니다.',
      manageProfile: '보물함 관리',
      browseAll: '전체 조합 보기',
      activeInventory: '보유 수량',
      cookiesOwned: '보유 쿠키',
      petsOwned: '보유 펫',
      treasuresOwned: '보유 보물',
      topRecommended: '추천 조합 (폭포수 뷰)',
      recommendedDesc: '보유한 아이템과 일치하는 실시간 폭포수 조합 스트림',
      readyToRun: '100% 준비 완료',
      matchScore: '% 보유 일치',
      boostedMeta: '추천 메타',
      missing: '부족:',
      substitute: '대체 가능 보물 보유:',
      targetScore: '목표 점수',
      coinsPerRun: '코인 / 판',
      viewDetails: '상세 보기',
      loadMore: '더 많은 메타 불러오기',
      streaming: '폭포수 불러오는 중...',
      showing: '표시 중'
    },
    combo: {
      badge: '쿠키런 클래식 폭포수 조합',
      title: '유저 공유 조합 & 메타',
      subtitle: '유저들이 직접 등록한 고득점 및 코인 노가다 조합을 폭포수 스트림으로 확인하세요.',
      submitSetup: '새 조합 등록',
      searchPlaceholder: '조합 이름, 전략, 태그 검색 (예: 손크로, 코인)...',
      selectEpisode: '1. 에피소드 선택:',
      selectGoal: '2. 목표 / 목적 선택:',
      allEpisodes: '전체 에피소드',
      allGoals: '전체 목표',
      highScore: '고득점',
      coinFarming: '코인 노가다',
      xpFarming: '경험치 노가다',
      semiAfk: '준손크로',
      fullManual: '손크로',
      treasureBox: '보물상자',
      inspectDetails: '상세정보 & 대체 보물',
      postSetup: '조합 등록하기',
      waterfallStream: '폭포수 스트림',
      ready: '준비 완료'
    },
    profile: {
      badge: '보물함 관리자',
      title: '내 보물함 관리',
      subtitle: '보유한 쿠키, 펫, 보물을 클릭하여 체크하거나 스크린샷을 업로드하여 자동 등록하세요!',
      aiScanner: 'AI 비전 스캐너',
      uploadScreenshots: '게임 보물함 스크린샷 업로드',
      uploadDesc: '보물함 스크린샷을 업로드하면 AI가 아이콘과 강화 단계(+0~+9)를 자동으로 인식합니다.',
      scanning: '스캔 중…',
      uploadBtn: '스크린샷 업로드',
      cookiesTab: '쿠키',
      petsTab: '펫',
      treasuresTab: '보물',
      selectAll: '전체 선택',
      clearAll: '전체 해제',
      grade: '등급:',
      allGrades: '전체 등급',
      detailsAndStats: '상세정보 & 스탯'
    },
    modal: {
      combiBreakdown: '조합 상세 정보',
      mainRunner: '선달 쿠키',
      relayRunner: '이달 쿠키',
      combiPet: '콤비 펫',
      equippedTreasures: '장착 보물',
      strategyNotes: '달리기 전략 & 팁',
      shareSetup: '조합 링크 공유',
      copied: '복사 완료!',
      done: '확인',
      close: '닫기',
      missingTitle: '부족한 보물 & 보유 대체 보물',
      noAlt: '보유한 보물 중 동일 효과 태그 없음',
      useAlt: '대체 보유 보물 사용:'
    },
    ads: {
      advertisement: '광고',
      sponsored: '스폰서',
      learnMore: '자세히 보기',
      featuredPartner: '추천 파트너'
    }
  },
  jp: {
    nav: {
      home: 'おすすめメタ',
      browse: '編成を探す',
      inventory: '持ち物リスト',
      admin: '管理者ポータル',
      signIn: 'ログイン',
      signOut: 'ログアウト'
    },
    home: {
      badge: 'クッキーランクラシック パーソナルメタ検索',
      titlePrefix: 'おすすめ編成:',
      heroDesc: '所持しているクッキー、ペット、宝物からスコア稼ぎやコイン稼ぎに最適な編成を自動検索します。',
      manageProfile: '持ち物を管理',
      browseAll: 'すべての編成を見る',
      activeInventory: '所持アイテム数',
      cookiesOwned: '所持クッキー',
      petsOwned: '所持ペット',
      treasuresOwned: '所持宝物',
      topRecommended: 'おすすめ編成 (ウォーターフォール表示)',
      recommendedDesc: '所持アイテムにマッチしたリアルタイムウォーターフォール表示',
      readyToRun: '100% 準備完了',
      matchScore: '% 所持一致率',
      boostedMeta: 'イチオシメタ',
      missing: '不足:',
      substitute: '代用可能な所持宝物:',
      targetScore: '目標スコア',
      coinsPerRun: 'コイン / 1ラン',
      viewDetails: '詳細を見る',
      loadMore: 'さらに読み込む',
      streaming: '読み込み中...',
      showing: '表示中'
    },
    combo: {
      badge: 'クッキーランクラシック編成一覧',
      title: 'コミュニティ編成 & メタ',
      subtitle: 'ハイスコア編成やコイン稼ぎ編成をウォーターフォール表示でチェックしましょう。',
      submitSetup: '編成を投稿する',
      searchPlaceholder: '編成名、戦略、タグで検索 (例: コイン稼ぎ, 磁力)...',
      selectEpisode: '1. エピソード選択:',
      selectGoal: '2. 目的選択:',
      allEpisodes: '全エピソード',
      allGoals: '全目的',
      highScore: 'ハイスコア',
      coinFarming: 'コイン稼ぎ',
      xpFarming: 'XP稼ぎ',
      semiAfk: 'セミ放置',
      fullManual: '手動プレイ',
      treasureBox: '宝箱稼ぎ',
      inspectDetails: '詳細 & 代用宝物',
      postSetup: '投稿する',
      waterfallStream: 'ウォーターフォール',
      ready: '準備完了'
    },
    profile: {
      badge: '持ち物インベントリ管理',
      title: 'コレクション管理',
      subtitle: '所持しているクッキー、ペット、宝物をチェックするか、スクリーンショットをアップロードしてAIで自動登録しましょう！',
      aiScanner: 'AIビジョン スキャナー',
      uploadScreenshots: 'ゲーム内スクリーンショットをアップロード',
      uploadDesc: 'スクリーンショットをアップロードすると、AIがアイコンと強化値 (+0〜+9) を自動読み込みします。',
      scanning: 'スキャン中…',
      uploadBtn: '画像をアップロード',
      cookiesTab: 'クッキー',
      petsTab: 'ペット',
      treasuresTab: '宝物',
      selectAll: 'すべて選択',
      clearAll: 'すべて clear',
      grade: 'レア度:',
      allGrades: '全レア度',
      detailsAndStats: '詳細 & ステータス'
    },
    modal: {
      combiBreakdown: 'チーム構成詳細',
      mainRunner: 'ファーストクッキー',
      relayRunner: 'バトンクッキー',
      combiPet: 'コンビペット',
      equippedTreasures: '装備中の宝物',
      strategyNotes: '走り方 & 攻略ノート',
      shareSetup: 'リンクを共有',
      copied: 'コピー完了！',
      done: '完了',
      close: '閉じる',
      missingTitle: '不足している宝物 & 代用所持宝物',
      noAlt: '代用可能な宝物がありません',
      useAlt: '所持代用宝物を使用:'
    },
    ads: {
      advertisement: '広告',
      sponsored: 'スポンサー',
      learnMore: '詳細を見る',
      featuredPartner: 'おすすめパートナー'
    }
  }
};

export type TranslationDict = typeof translations['en'];

interface LanguageContextType {
  lang: SupportedLanguage;
  setLang: (lang: SupportedLanguage) => void;
  t: TranslationDict;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'th',
  setLang: () => {},
  t: translations.th
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<SupportedLanguage>('th');

  useEffect(() => {
    const saved = localStorage.getItem('cookieweb_lang') as SupportedLanguage;
    if (saved && translations[saved]) {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: SupportedLanguage) => {
    setLangState(newLang);
    localStorage.setItem('cookieweb_lang', newLang);
  };

  const t = translations[lang] || translations.en;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
