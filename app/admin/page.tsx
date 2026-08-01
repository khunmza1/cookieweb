'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ItemPickerModal from '@/components/ItemPickerModal';
import { CatalogData, Cookie, Pet, Treasure, ComboSetup, Grade, ItemCategory, ComboCategory } from '@/lib/types';
import PaginationControls, { PageSizeOption } from '@/components/PaginationControls';
import { 
  AdminIcon, 
  CookieIcon, 
  PetIcon, 
  TreasureIcon, 
  VideoIcon, 
  CameraIcon, 
  EditIcon, 
  EyeIcon, 
  EyeOffIcon, 
  PlusIcon, 
  StarIcon, 
  TrashIcon,
  FlaskIcon, 
  LightningIcon, 
  RocketIcon, 
  DiceIcon, 
  SparklesIcon, 
  SearchIcon 
} from '@/components/icons';

export default function AdminPage() {
  const router = useRouter();
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [combos, setCombos] = useState<ComboSetup[]>([]);
  const [activeTab, setActiveTab] = useState<'catalog' | 'boost'>('catalog');
  const [catalogCategory, setCatalogCategory] = useState<ItemCategory>('cookie');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(20);

  // Combo List Search & Pagination State
  const [comboSearchTerm, setComboSearchTerm] = useState('');
  const [comboCurrentPage, setComboCurrentPage] = useState(1);
  const [comboPageSize, setComboPageSize] = useState<PageSizeOption>(20);
  const [editingComboId, setEditingComboId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Edit / Add Item Modal State (Cookies, Pets, Treasures)
  const [editItem, setEditItem] = useState<{
    id: string;
    name: string;
    grade: Grade;
    category: ItemCategory;
    description: string;
    skill: string;
    maxLevel: number;
    imageUrl: string;
  } | null>(null);

  const [isNew, setIsNew] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Combo Creator Modal & AI Video Subfunction State
  const [showComboModal, setShowComboModal] = useState(false);
  const [comboModalMode, setComboModalMode] = useState<'manual' | 'ai-video'>('manual');
  const [aiVideoUrl, setAiVideoUrl] = useState('');
  const [aiFramePreview, setAiFramePreview] = useState<string | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnalyzeMessage, setAiAnalyzeMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const [comboForm, setComboForm] = useState<{
    title: string;
    author: string;
    category: ComboCategory;
    cookieId: string;
    relayCookieId: string;
    petId: string;
    t1: string;
    t2: string;
    t3: string;
    targetScore: number;
    coinsPerRun: number;
    description: string;
    hpExtension: boolean;
    powerJellyBoost: boolean;
    doubleXp: boolean;
    fastStart: boolean;
    randomBoost: string;
  }>({
    title: '',
    author: 'ClassicPro',
    category: 'High Score (Points)',
    cookieId: '',
    relayCookieId: '',
    petId: '',
    t1: '',
    t2: '',
    t3: '',
    targetScore: 85000000,
    coinsPerRun: 35000,
    description: '',
    hpExtension: true,
    powerJellyBoost: true,
    doubleXp: false,
    fastStart: true,
    randomBoost: 'Double Coins'
  });

  // Visual Item Picker Modal State
  const [pickerModal, setPickerModal] = useState<{
    isOpen: boolean;
    title: string;
    category: ItemCategory;
    slot: 'cookie' | 'relay' | 'pet' | 't1' | 't2' | 't3';
    allowNone?: boolean;
  }>({
    isOpen: false,
    title: '',
    category: 'cookie',
    slot: 'cookie'
  });

  useEffect(() => {
    async function checkAdmin() {
      try {
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();

        if (!authData.profile || authData.profile.role !== 'admin') {
          router.push('/login');
          return;
        }

        setIsAdmin(true);

        const [catRes, comboRes] = await Promise.all([
          fetch('/api/catalog'),
          fetch('/api/setups')
        ]);

        const catData: CatalogData = await catRes.json();
        const comboData: ComboSetup[] = await comboRes.json();

        setCatalog(catData);
        setCombos(comboData);

        if (catData.cookies.length > 0) {
          setComboForm(prev => ({
            ...prev,
            cookieId: catData.cookies[0].id,
            petId: catData.pets[0]?.id || '',
            t1: catData.treasures[0]?.id || '',
            t2: catData.treasures[1]?.id || '',
            t3: catData.treasures[2]?.id || ''
          }));
        }
      } catch (e) {
        console.error(e);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    checkAdmin();
  }, [router]);

  // Handle Item Save (Add/Edit)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    if (!editItem || !editItem.id || !editItem.name) {
      setSaveError("Please fill in ID and Name.");
      return;
    }

    try {
      const payloadItem = {
        id: editItem.id,
        name: editItem.name,
        grade: editItem.grade,
        category: editItem.category,
        description: editItem.description,
        skill: editItem.skill,
        maxLevel: Number(editItem.maxLevel),
        imageUrl: editItem.imageUrl || `/images/${editItem.category}s/${editItem.id}.png`,
        hpStats: editItem.category !== 'treasure' ? [
          { level: 1, effect: "Base HP" },
          { level: Number(editItem.maxLevel), effect: "Max HP" }
        ] : undefined,
        skillStats: [
          { level: 1, effect: "Base Skill" },
          { level: Number(editItem.maxLevel), effect: "Max Skill" }
        ],
        obtainedFrom: editItem.category === 'treasure' ? "Supreme Chest" : undefined,
        effect: editItem.category === 'treasure' ? editItem.description : undefined,
        enhancementStats: editItem.category === 'treasure' ? { baseEffect: "Base", plus9Effect: "Max" } : undefined
      };

      const res = await fetch('/api/admin/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: editItem.category, item: payloadItem })
      });

      if (res.ok) {
        const data = await res.json();
        setCatalog(data.catalog);
        setEditItem(null);
      } else {
        const err = await res.json();
        setSaveError(err.error || "Failed to save item.");
      }
    } catch (e) {
      console.error(e);
      setSaveError("Save failed.");
    }
  };

  // Handle Item Hide / Unhide
  const handleToggleHideItem = async (category: ItemCategory, id: string) => {
    try {
      const res = await fetch('/api/admin/catalog/toggle-hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, id })
      });

      if (res.ok) {
        const data = await res.json();
        setCatalog(data.catalog);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Combo Boost Toggle
  const handleToggleBoost = async (comboId: string, currentBoosted: boolean) => {
    try {
      const res = await fetch('/api/admin/combos/boost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comboId, isBoosted: !currentBoosted })
      });

      if (res.ok) {
        setCombos(combos.map(c => c.id === comboId ? { ...c, isBoosted: !currentBoosted } : c));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open Edit Combo Modal
  const openEditComboModal = (combo: ComboSetup) => {
    setEditingComboId(combo.id);
    setComboModalMode('manual');
    setComboForm({
      title: combo.title,
      author: combo.author || 'Admin',
      category: combo.category || 'High Score (Points)',
      cookieId: combo.cookieId || '',
      relayCookieId: combo.relayCookieId || '',
      petId: combo.petId || '',
      t1: combo.treasureIds?.[0] || '',
      t2: combo.treasureIds?.[1] || '',
      t3: combo.treasureIds?.[2] || '',
      targetScore: combo.targetScore || 85000000,
      coinsPerRun: combo.coinsPerRun || 35000,
      description: combo.description || '',
      hpExtension: combo.boosts?.hpExtension ?? true,
      powerJellyBoost: combo.boosts?.powerJellyBoost ?? true,
      doubleXp: combo.boosts?.doubleXp ?? false,
      fastStart: combo.boosts?.fastStart ?? true,
      randomBoost: combo.boosts?.randomBoost || 'Double Coins'
    });
    setShowComboModal(true);
  };

  // Open Create Combo Modal
  const openCreateComboModal = () => {
    setEditingComboId(null);
    setComboModalMode('manual');
    setComboForm({
      title: '',
      author: 'ClassicPro',
      category: 'High Score (Points)',
      cookieId: catalog?.cookies[0]?.id || '',
      relayCookieId: '',
      petId: catalog?.pets[0]?.id || '',
      t1: catalog?.treasures[0]?.id || '',
      t2: catalog?.treasures[1]?.id || '',
      t3: catalog?.treasures[2]?.id || '',
      targetScore: 85000000,
      coinsPerRun: 35000,
      description: '',
      hpExtension: true,
      powerJellyBoost: true,
      doubleXp: false,
      fastStart: true,
      randomBoost: 'Double Coins'
    });
    setShowComboModal(true);
  };

  // Handle Delete Combo
  const handleDeleteCombo = async (comboId: string) => {
    if (!confirm("Are you sure you want to delete this combo setup?")) return;
    try {
      const res = await fetch(`/api/setups?id=${comboId}`, { method: 'DELETE' });
      if (res.ok) {
        setCombos(combos.filter(c => c.id !== comboId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Save Combo (Create or Edit)
  const handleSaveCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comboForm.title || !comboForm.cookieId || !comboForm.petId || !comboForm.t1) {
      alert("Please fill in title, main cookie, pet, and at least 1 treasure.");
      return;
    }

    const payload = {
      id: editingComboId || undefined,
      title: comboForm.title,
      author: comboForm.author,
      category: comboForm.category,
      cookieId: comboForm.cookieId,
      relayCookieId: comboForm.relayCookieId || undefined,
      petId: comboForm.petId,
      treasureIds: [comboForm.t1, comboForm.t2, comboForm.t3].filter(Boolean),
      targetScore: Number(comboForm.targetScore),
      coinsPerRun: Number(comboForm.coinsPerRun),
      description: comboForm.description,
      tags: [comboForm.category, "Admin Setup"],
      boosts: {
        hpExtension: comboForm.hpExtension,
        powerJellyBoost: comboForm.powerJellyBoost,
        doubleXp: comboForm.doubleXp,
        fastStart: comboForm.fastStart,
        randomBoost: comboForm.randomBoost as any
      }
    };

    try {
      const method = editingComboId ? 'PUT' : 'POST';
      const res = await fetch('/api/setups', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updated = await res.json();
        if (editingComboId) {
          setCombos(combos.map(c => c.id === editingComboId ? updated : c));
        } else {
          setCombos([updated, ...combos]);
        }
        setShowComboModal(false);
      } else {
        alert("Failed to save combo.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // AI Video Frame Extractor Subfunction
  const handleFrameFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    setAiFramePreview(dataUrl);
    setAiAnalyzeMessage(null);
  };

  const handleAnalyzeVideo = async () => {
    if (!aiFramePreview) {
      setAiAnalyzeMessage({ text: 'Upload a frame/screenshot from the video first — AI Vision needs to see the lineup.', isError: true });
      return;
    }

    setAiAnalyzing(true);
    setAiAnalyzeMessage(null);

    try {
      const res = await fetch('/api/admin/combos/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: aiVideoUrl || undefined, imageBase64: aiFramePreview })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const s = data.extractedSetup;
        setComboForm(prev => ({
          ...prev,
          title: s.title,
          author: s.author,
          category: s.category || 'High Score (Points)',
          cookieId: s.cookieId || prev.cookieId,
          relayCookieId: s.relayCookieId || '',
          petId: s.petId || prev.petId,
          t1: s.treasureIds[0] || '',
          t2: s.treasureIds[1] || '',
          t3: s.treasureIds[2] || '',
          targetScore: s.targetScore,
          coinsPerRun: s.coinsPerRun,
          description: s.description,
          hpExtension: s.boosts?.hpExtension ?? true,
          powerJellyBoost: s.boosts?.powerJellyBoost ?? true,
          doubleXp: s.boosts?.doubleXp ?? false,
          fastStart: s.boosts?.fastStart ?? true,
          randomBoost: prev.randomBoost
        }));
        setComboModalMode('manual');
        setAiAnalyzeMessage({
          text: data.warning
            ? `AI Vision extracted setup at ${data.confidenceScore}% confidence — ${data.warning}`
            : `AI Vision extracted setup with ${data.confidenceScore}% confidence! Form auto-populated below — double-check target score & coins per run.`,
          isError: Boolean(data.warning)
        });
      } else {
        setAiAnalyzeMessage({ text: data.error || 'AI Video Analysis failed.', isError: true });
      }
    } catch (e) {
      console.error(e);
      setAiAnalyzeMessage({ text: 'Server error during AI video frame analysis.', isError: true });
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Handle Publishing Combo
  const handlePublishCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comboForm.title || !comboForm.cookieId || !comboForm.petId) {
      setAiAnalyzeMessage({ text: "Please select main cookie and pet!", isError: true });
      return;
    }

    try {
      const treasures = [comboForm.t1, comboForm.t2, comboForm.t3].filter(Boolean);
      const res = await fetch('/api/setups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: comboForm.title,
          author: comboForm.author || 'ClassicPro',
          category: comboForm.category || 'High Score (Points)',
          cookieId: comboForm.cookieId,
          relayCookieId: comboForm.relayCookieId || undefined,
          petId: comboForm.petId,
          treasureIds: treasures,
          targetScore: Number(comboForm.targetScore),
          coinsPerRun: Number(comboForm.coinsPerRun),
          description: comboForm.description || 'Meta strategy setup.',
          tags: [comboForm.category || 'High Score (Points)', 'Admin Meta'],
          boosts: {
            hpExtension: comboForm.hpExtension,
            powerJellyBoost: comboForm.powerJellyBoost,
            doubleXp: comboForm.doubleXp,
            fastStart: comboForm.fastStart,
            randomBoost: comboForm.randomBoost as any
          }
        })
      });

      if (res.ok) {
        const created = await res.json();
        await fetch('/api/admin/combos/boost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comboId: created.id, isBoosted: true })
        });
        setCombos([{ ...created, isBoosted: true }, ...combos]);
        setShowComboModal(false);
      } else {
        setAiAnalyzeMessage({ text: "Failed to publish combo.", isError: true });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openAddModal = (cat: ItemCategory) => {
    setIsNew(true);
    setSaveError('');
    setEditItem({
      id: `new-${cat}-${Date.now()}`,
      name: '',
      grade: 'S',
      category: cat,
      description: '',
      skill: '',
      maxLevel: cat === 'treasure' ? 9 : 8,
      imageUrl: `/images/${cat}s/placeholder.png`
    });
  };

  const openEditModal = (item: Cookie | Pet | Treasure, cat: ItemCategory) => {
    setIsNew(false);
    setSaveError('');
    const descText = (item as Cookie | Pet).description || (item as Treasure).effect || '';
    const skillText = (item as Cookie | Pet).skill || descText;
    setEditItem({
      id: item.id,
      name: item.name,
      grade: item.grade,
      category: cat,
      description: descText,
      skill: skillText,
      maxLevel: (item as Cookie | Pet).maxLevel || 8,
      imageUrl: item.imageUrl
    });
  };

  if (loading || !catalog || !isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 font-medium text-sm">Verifying Admin Access...</p>
        </div>
      </div>
    );
  }

  const cookieMap = new Map(catalog.cookies.map(c => [c.id, c]));
  const petMap = new Map(catalog.pets.map(p => [p.id, p]));
  const treasureMap = new Map(catalog.treasures.map(t => [t.id, t]));

  const currentList = catalogCategory === 'cookie'
    ? catalog.cookies
    : catalogCategory === 'pet'
      ? catalog.pets
      : catalog.treasures;

  const filteredItems = currentList.filter(item => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return item.name.toLowerCase().includes(t) || item.id.toLowerCase().includes(t);
  });

  const selectedMainCookie = cookieMap.get(comboForm.cookieId);
  const selectedRelayCookie = comboForm.relayCookieId ? cookieMap.get(comboForm.relayCookieId) : null;
  const selectedPet = petMap.get(comboForm.petId);
  const selectedT1 = treasureMap.get(comboForm.t1);
  const selectedT2 = treasureMap.get(comboForm.t2);
  const selectedT3 = treasureMap.get(comboForm.t3);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-purple-500/20 via-zinc-900/40 to-zinc-950 border-b border-zinc-800/80 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-black uppercase tracking-wider mb-2">
              <AdminIcon className="w-4 h-4" />
              <span>Admin Management Portal</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Catalog Control, Visual Combo Maker & Meta Boosting
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              Add or edit catalog items, build meta combos with visual image selectors, auto-extract setups from videos, and boost recommendations.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 flex-wrap">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Catalog Items ({catalog.cookies.length + catalog.pets.length + catalog.treasures.length})
            </button>
            <button
              onClick={() => setActiveTab('boost')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'boost'
                  ? 'bg-amber-500 text-zinc-950 shadow-lg font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Manage Meta Combos ({combos.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        
        {/* TAB 1: CATALOG CRUD */}
        {activeTab === 'catalog' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-6">
              
              {/* Category Selector */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setCatalogCategory('cookie'); setSearchTerm(''); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    catalogCategory === 'cookie'
                      ? 'bg-amber-500 text-zinc-950 font-black'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                  }`}
                >
                  <CookieIcon className="w-3.5 h-3.5" />
                  <span>Cookies ({catalog.cookies.length})</span>
                </button>

                <button
                  onClick={() => { setCatalogCategory('pet'); setSearchTerm(''); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    catalogCategory === 'pet'
                      ? 'bg-purple-500 text-white font-black'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                  }`}
                >
                  <PetIcon className="w-3.5 h-3.5" />
                  <span>Pets ({catalog.pets.length})</span>
                </button>

                <button
                  onClick={() => { setCatalogCategory('treasure'); setSearchTerm(''); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    catalogCategory === 'treasure'
                      ? 'bg-amber-400 text-zinc-950 font-black'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                  }`}
                >
                  <TreasureIcon className="w-3.5 h-3.5" />
                  <span>Treasures ({catalog.treasures.length})</span>
                </button>
              </div>

              {/* Add & Search Controls */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <SearchIcon className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={`Search ${catalogCategory}s...`}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-500 transition"
                  />
                </div>

                <button
                  onClick={() => openAddModal(catalogCategory)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusIcon className="w-4 h-4 stroke-[3]" />
                  <span>Add New {catalogCategory.toUpperCase()}</span>
                </button>
              </div>

            </div>

            {/* Top Pagination Controls */}
            <PaginationControls
              currentPage={currentPage}
              totalItems={filteredItems.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              className="mb-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4"
            />

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(pageSize === 'ALL'
                ? filteredItems
                : filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)
              ).map(item => (
                <div
                  key={item.id}
                  className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between hover:border-zinc-700 transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        Grade {item.grade}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">ID: {item.id}</span>
                    </div>

                    <div className="flex items-center gap-3 my-2">
                      <div className="w-14 h-14 relative bg-zinc-950 rounded-xl p-1 border border-zinc-800 flex items-center justify-center shrink-0">
                        <Image src={item.imageUrl} alt={item.name} width={48} height={48} unoptimized className="object-contain" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white line-clamp-1">{item.name}</h3>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">
                          {(item as Cookie | Pet).skill || (item as Cookie | Pet).description || (item as Treasure).effect}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-2 border-t border-zinc-800 flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(item, catalogCategory)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition flex items-center gap-1 cursor-pointer"
                    >
                      <EditIcon className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleToggleHideItem(catalogCategory, item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        item.isHidden
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {item.isHidden ? (
                        <>
                          <EyeIcon className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Unhide</span>
                        </>
                      ) : (
                        <>
                          <EyeOffIcon className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Hide</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Pagination Controls */}
            <PaginationControls
              currentPage={currentPage}
              totalItems={filteredItems.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              className="mt-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4"
            />
          </div>
        )}

        {/* TAB 2: META COMBOS & BOOSTING */}
        {activeTab === 'boost' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5">
              <div>
                <h2 className="text-xl font-black text-white">Manage & Edit Meta Combos ({combos.length})</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Search, edit details, boost visibility, or delete setups directly from the database.</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <SearchIcon className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search setups by title, ID, tag..."
                    value={comboSearchTerm}
                    onChange={(e) => { setComboSearchTerm(e.target.value); setComboCurrentPage(1); }}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-500 transition"
                  />
                </div>

                <button
                  onClick={openCreateComboModal}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <PlusIcon className="w-4 h-4 stroke-[3]" />
                  <span>Create New Combo</span>
                </button>
              </div>
            </div>

            {/* Pagination & Filtered Combos List */}
            {(() => {
              const filteredCombosList = combos.filter(c => {
                if (!comboSearchTerm) return true;
                const term = comboSearchTerm.toLowerCase();
                return c.title.toLowerCase().includes(term) ||
                  c.id.toLowerCase().includes(term) ||
                  c.description.toLowerCase().includes(term) ||
                  (c.episode && c.episode.toLowerCase().includes(term)) ||
                  c.tags.some(t => t.toLowerCase().includes(term));
              });

              const paginatedCombos = comboPageSize === 'ALL'
                ? filteredCombosList
                : filteredCombosList.slice((comboCurrentPage - 1) * comboPageSize, comboCurrentPage * comboPageSize);

              return (
                <div className="space-y-4">
                  <PaginationControls
                    currentPage={comboCurrentPage}
                    totalItems={filteredCombosList.length}
                    pageSize={comboPageSize}
                    onPageChange={setComboCurrentPage}
                    onPageSizeChange={setComboPageSize}
                    className="bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4 py-2"
                  />

                  <div className="space-y-3">
                    {paginatedCombos.map(combo => (
                      <div
                        key={combo.id}
                        className={`bg-zinc-900/90 border rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition ${
                          combo.isBoosted ? 'border-amber-500/80 ring-1 ring-amber-500/30' : 'border-zinc-800'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-950 text-amber-400 border border-amber-500/30">
                              {combo.id}
                            </span>
                            {combo.isBoosted && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-zinc-950 shadow-md uppercase tracking-wider flex items-center gap-1">
                                <StarIcon className="w-3 h-3 fill-zinc-950" />
                                <span>BOOSTED</span>
                              </span>
                            )}
                            {combo.episode && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                {combo.episode}
                              </span>
                            )}
                            {combo.category && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                {combo.category}
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-black text-white truncate mt-1">{combo.title}</h3>
                          <p className="text-xs text-zinc-300 line-clamp-2 mt-1 leading-relaxed">{combo.description}</p>
                          <span className="text-[10px] text-zinc-500 mt-1.5 block">Author: {combo.author} • Score: {combo.targetScore.toLocaleString()} • Coins: {combo.coinsPerRun?.toLocaleString() || 0}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => openEditComboModal(combo)}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <EditIcon className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleToggleBoost(combo.id, Boolean(combo.isBoosted))}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                              combo.isBoosted
                                ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                            }`}
                          >
                            <StarIcon className={`w-3.5 h-3.5 ${combo.isBoosted ? 'fill-zinc-950' : 'fill-none stroke-current'}`} />
                            <span>{combo.isBoosted ? 'Boosted' : 'Boost'}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteCombo(combo.id)}
                            className="px-3 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-zinc-700 hover:border-rose-500/40 transition flex items-center gap-1 cursor-pointer"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <PaginationControls
                    currentPage={comboCurrentPage}
                    totalItems={filteredCombosList.length}
                    pageSize={comboPageSize}
                    onPageChange={setComboCurrentPage}
                    onPageSizeChange={setComboPageSize}
                    className="bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4 py-2"
                  />
                </div>
              );
            })()}
          </div>
        )}

      </div>

      {/* CREATE / EDIT META COMBO MODAL (WITH VISUAL PICKER & AI VIDEO EXTRACTOR SUBFUNCTION) */}
      {showComboModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 relative text-zinc-100 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setShowComboModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-sm cursor-pointer"
            >
              ✕
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <PlusIcon className="w-6 h-6 text-amber-400 stroke-[3]" />
                <span>{editingComboId ? 'Edit & Update Combo Setup' : 'Create & Publish Meta Combo'}</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Use the visual asset pickers or extract setup from TikTok/YouTube video frames.</p>
            </div>

            {/* Subfunction Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 mb-6">
              <button
                type="button"
                onClick={() => setComboModalMode('manual')}
                className={`py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
                  comboModalMode === 'manual'
                    ? 'bg-amber-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <EditIcon className="w-4 h-4" />
                <span>Visual Setup Builder</span>
              </button>

              <button
                type="button"
                onClick={() => setComboModalMode('ai-video')}
                className={`py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
                  comboModalMode === 'ai-video'
                    ? 'bg-emerald-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <VideoIcon className="w-4 h-4" />
                <span>AI Video Frame Extractor</span>
              </button>
            </div>

            {/* SUBFUNCTION: AI VIDEO FRAME EXTRACTOR */}
            {comboModalMode === 'ai-video' && (
              <div className="bg-zinc-950 p-5 rounded-2xl border border-emerald-500/40 space-y-4 mb-6">
                <div className="flex items-center gap-2">
                  <VideoIcon className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">AI Vision Frame Analyzer</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  AI Vision can&apos;t watch a video directly — pause the TikTok/YouTube video at the frame that shows
                  the Cookie / Pet / Treasure lineup, take a screenshot, and upload it below.
                </p>

                <div className="flex gap-3 items-start flex-wrap">
                  <label className={`shrink-0 px-4 py-2.5 rounded-xl font-black text-xs shadow-md transition flex items-center gap-2 cursor-pointer ${
                    aiFramePreview ? 'bg-zinc-800 text-emerald-300 border border-emerald-500/40' : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
                  }`}>
                    <CameraIcon className="w-4 h-4" />
                    <span>{aiFramePreview ? 'Change Frame' : 'Upload Video Frame'}</span>
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFrameFileSelected} className="hidden" />
                  </label>

                  {aiFramePreview && (
                    <div className="w-24 h-24 relative rounded-xl overflow-hidden border border-zinc-800 bg-black shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={aiFramePreview} alt="Uploaded frame preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="Optional: paste the TikTok/YouTube link for context..."
                    value={aiVideoUrl}
                    onChange={(e) => setAiVideoUrl(e.target.value)}
                    className="flex-1 min-w-[220px] bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleAnalyzeVideo()}
                  disabled={aiAnalyzing || !aiFramePreview}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-black text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <SparklesIcon className="w-4 h-4" />
                  <span>{aiAnalyzing ? 'Analyzing frame...' : 'Analyze Frame with AI Vision'}</span>
                </button>

                {aiAnalyzeMessage && (
                  <p className={`text-xs font-bold ${aiAnalyzeMessage.isError ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {aiAnalyzeMessage.text}
                  </p>
                )}
              </div>
            )}

            {/* COMBO PUBLISH FORM WITH VISUAL IMAGE TILES */}
            <form onSubmit={handlePublishCombo} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Setup Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Supreme Coin Farming Meta"
                    value={comboForm.title}
                    onChange={(e) => setComboForm({ ...comboForm, title: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Combo Category / Purpose</label>
                  <select
                    value={comboForm.category}
                    onChange={(e) => setComboForm({ ...comboForm, category: e.target.value as ComboCategory })}
                    className="w-full bg-zinc-950 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none cursor-pointer"
                  >
                    <option value="High Score (Points)">High Score (Points)</option>
                    <option value="XP Farming">XP Farming</option>
                    <option value="Coin Farming">Coin Farming</option>
                    <option value="Treasure Box Farming">Treasure Box Farming</option>
                    <option value="AFK Coin Farming">AFK Coin Farming</option>
                    <option value="AFK Treasure Box Farming">AFK Treasure Box Farming</option>
                  </select>
                </div>
              </div>

              {/* VISUAL IMAGE SELECTORS FOR CHARACTERS & PET */}
              <div>
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Lineup (Click Image Tile To Change)</label>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Main Cookie Visual Tile */}
                  <div
                    onClick={() => setPickerModal({ isOpen: true, title: 'Select Main Cookie', category: 'cookie', slot: 'cookie' })}
                    className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/60 p-3 rounded-2xl cursor-pointer transition flex flex-col items-center text-center group"
                  >
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Main Cookie</span>
                    <div className="w-16 h-16 relative bg-zinc-900 rounded-xl p-1 border border-zinc-800 flex items-center justify-center my-1 group-hover:scale-105 transition-transform">
                      {selectedMainCookie ? (
                        <Image src={selectedMainCookie.imageUrl} alt="Main Cookie" width={52} height={52} unoptimized className="object-contain" />
                      ) : (
                        <span className="text-xs text-zinc-600 font-bold">Select</span>
                      )}
                    </div>
                    <span className="text-xs font-extrabold text-white mt-1 line-clamp-1">{selectedMainCookie?.name || 'Select Cookie'}</span>
                    <span className="text-[10px] text-amber-400 font-bold mt-0.5">Click to Change</span>
                  </div>

                  {/* Relay Cookie Visual Tile */}
                  <div
                    onClick={() => setPickerModal({ isOpen: true, title: 'Select Relay Cookie (Optional)', category: 'cookie', slot: 'relay', allowNone: true })}
                    className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/60 p-3 rounded-2xl cursor-pointer transition flex flex-col items-center text-center group"
                  >
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider mb-1">Relay Cookie</span>
                    <div className="w-16 h-16 relative bg-zinc-900 rounded-xl p-1 border border-zinc-800 flex items-center justify-center my-1 group-hover:scale-105 transition-transform">
                      {selectedRelayCookie ? (
                        <Image src={selectedRelayCookie.imageUrl} alt="Relay Cookie" width={52} height={52} unoptimized className="object-contain" />
                      ) : (
                        <span className="text-xs text-zinc-500 font-bold">No Relay</span>
                      )}
                    </div>
                    <span className="text-xs font-extrabold text-white mt-1 line-clamp-1">{selectedRelayCookie?.name || 'No Relay'}</span>
                    <span className="text-[10px] text-amber-400 font-bold mt-0.5">Click to Change</span>
                  </div>

                  {/* Pet Visual Tile */}
                  <div
                    onClick={() => setPickerModal({ isOpen: true, title: 'Select Combi Pet', category: 'pet', slot: 'pet' })}
                    className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/60 p-3 rounded-2xl cursor-pointer transition flex flex-col items-center text-center group"
                  >
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">Combi Pet</span>
                    <div className="w-16 h-16 relative bg-zinc-900 rounded-xl p-1 border border-zinc-800 flex items-center justify-center my-1 group-hover:scale-105 transition-transform">
                      {selectedPet ? (
                        <Image src={selectedPet.imageUrl} alt="Pet" width={52} height={52} unoptimized className="object-contain" />
                      ) : (
                        <span className="text-xs text-zinc-600 font-bold">Select</span>
                      )}
                    </div>
                    <span className="text-xs font-extrabold text-white mt-1 line-clamp-1">{selectedPet?.name || 'Select Pet'}</span>
                    <span className="text-[10px] text-amber-400 font-bold mt-0.5">Click to Change</span>
                  </div>

                </div>
              </div>

              {/* VISUAL IMAGE SELECTORS FOR TREASURES */}
              <div>
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">Treasures (Click Image Tile To Change)</label>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Treasure 1 */}
                  <div
                    onClick={() => setPickerModal({ isOpen: true, title: 'Select Treasure 1 (Optional)', category: 'treasure', slot: 't1', allowNone: true })}
                    className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/60 p-3 rounded-2xl cursor-pointer transition flex flex-col items-center text-center group"
                  >
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider mb-1">Treasure 1</span>
                    <div className="w-14 h-14 relative bg-zinc-900 rounded-xl p-1 border border-zinc-800 flex items-center justify-center my-1 group-hover:scale-105 transition-transform">
                      {selectedT1 ? (
                        <Image src={selectedT1.imageUrl} alt="Treasure 1" width={44} height={44} unoptimized className="object-contain" />
                      ) : (
                        <span className="text-xs text-zinc-500 font-bold">None</span>
                      )}
                    </div>
                    <span className="text-xs font-extrabold text-white mt-1 line-clamp-1">{selectedT1?.name || 'No Treasure'}</span>
                    <span className="text-[10px] text-amber-400 font-bold mt-0.5">Click to Change</span>
                  </div>

                  {/* Treasure 2 */}
                  <div
                    onClick={() => setPickerModal({ isOpen: true, title: 'Select Treasure 2', category: 'treasure', slot: 't2', allowNone: true })}
                    className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/60 p-3 rounded-2xl cursor-pointer transition flex flex-col items-center text-center group"
                  >
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider mb-1">Treasure 2</span>
                    <div className="w-14 h-14 relative bg-zinc-900 rounded-xl p-1 border border-zinc-800 flex items-center justify-center my-1 group-hover:scale-105 transition-transform">
                      {selectedT2 ? (
                        <Image src={selectedT2.imageUrl} alt="Treasure 2" width={44} height={44} unoptimized className="object-contain" />
                      ) : (
                        <span className="text-xs text-zinc-500 font-bold">None</span>
                      )}
                    </div>
                    <span className="text-xs font-extrabold text-white mt-1 line-clamp-1">{selectedT2?.name || 'No Treasure'}</span>
                    <span className="text-[10px] text-amber-400 font-bold mt-0.5">Click to Change</span>
                  </div>

                  {/* Treasure 3 */}
                  <div
                    onClick={() => setPickerModal({ isOpen: true, title: 'Select Treasure 3', category: 'treasure', slot: 't3', allowNone: true })}
                    className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/60 p-3 rounded-2xl cursor-pointer transition flex flex-col items-center text-center group"
                  >
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider mb-1">Treasure 3</span>
                    <div className="w-14 h-14 relative bg-zinc-900 rounded-xl p-1 border border-zinc-800 flex items-center justify-center my-1 group-hover:scale-105 transition-transform">
                      {selectedT3 ? (
                        <Image src={selectedT3.imageUrl} alt="Treasure 3" width={44} height={44} unoptimized className="object-contain" />
                      ) : (
                        <span className="text-xs text-zinc-500 font-bold">None</span>
                      )}
                    </div>
                    <span className="text-xs font-extrabold text-white mt-1 line-clamp-1">{selectedT3?.name || 'No Treasure'}</span>
                    <span className="text-[10px] text-amber-400 font-bold mt-0.5">Click to Change</span>
                  </div>

                </div>
              </div>

              {/* Target Score & Coins */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Target Score</label>
                  <input
                    type="number"
                    value={comboForm.targetScore}
                    onChange={(e) => setComboForm({ ...comboForm, targetScore: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Coins Per Run</label>
                  <input
                    type="number"
                    value={comboForm.coinsPerRun}
                    onChange={(e) => setComboForm({ ...comboForm, coinsPerRun: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Strategy Description</label>
                <textarea
                  rows={2}
                  value={comboForm.description}
                  onChange={(e) => setComboForm({ ...comboForm, description: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                ></textarea>
              </div>

              {/* Pre-Run Boosts & Random Boost Selection */}
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <LightningIcon className="w-4 h-4 text-amber-400" />
                  <span>Pre-Run Boosts & Random Boost</span>
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <label className="flex items-center gap-2 text-xs text-zinc-300 font-semibold cursor-pointer bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                    <input
                      type="checkbox"
                      checked={comboForm.hpExtension}
                      onChange={(e) => setComboForm({ ...comboForm, hpExtension: e.target.checked })}
                      className="rounded text-amber-500 bg-zinc-950 border-zinc-700"
                    />
                    <span>HP Extension</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-zinc-300 font-semibold cursor-pointer bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                    <input
                      type="checkbox"
                      checked={comboForm.powerJellyBoost}
                      onChange={(e) => setComboForm({ ...comboForm, powerJellyBoost: e.target.checked })}
                      className="rounded text-amber-500 bg-zinc-950 border-zinc-700"
                    />
                    <span>Power Jelly</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-zinc-300 font-semibold cursor-pointer bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                    <input
                      type="checkbox"
                      checked={comboForm.doubleXp}
                      onChange={(e) => setComboForm({ ...comboForm, doubleXp: e.target.checked })}
                      className="rounded text-amber-500 bg-zinc-950 border-zinc-700"
                    />
                    <span>Double XP</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-zinc-300 font-semibold cursor-pointer bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                    <input
                      type="checkbox"
                      checked={comboForm.fastStart}
                      onChange={(e) => setComboForm({ ...comboForm, fastStart: e.target.checked })}
                      className="rounded text-amber-500 bg-zinc-950 border-zinc-700"
                    />
                    <span>Fast Start</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">Required Random Boost</label>
                  <select
                    value={comboForm.randomBoost}
                    onChange={(e) => setComboForm({ ...comboForm, randomBoost: e.target.value })}
                    className="w-full bg-zinc-900 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none cursor-pointer"
                  >
                    <option value="Energy Drains 15% slower">Energy Drains 15% slower</option>
                    <option value="30% less energy drain when colliding with obstacles">30% less energy drain when colliding with obstacles</option>
                    <option value="Revives with 80 Energy 1 time">Revives with 80 Energy 1 time</option>
                    <option value="17% Base speed increase">17% Base speed increase</option>
                    <option value="Invincibility rate of 70% to collisions">Invincibility rate of 70% to collisions</option>
                    <option value="Gold Coins Boost">Gold Coins Boost</option>
                    <option value="15% Points Bonus">15% Points Bonus</option>
                    <option value="Magnetic Aura">Magnetic Aura</option>
                    <option value="Lifts from hole 2 times">Lifts from hole 2 times</option>
                    <option value="Potion restores 20% more Energy">Potion restores 20% more Energy</option>
                    <option value="Double Coins">Double Coins</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowComboModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  Publish Meta Combo
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ITEM EDIT MODAL (FOR CATALOG ITEMS) */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 relative text-zinc-100 shadow-2xl">
            <button
              onClick={() => setEditItem(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-sm cursor-pointer"
            >
              ✕
            </button>

            <h2 className="text-xl font-black text-white mb-4">
              {isNew ? `Add New ${editItem.category.toUpperCase()}` : `Edit ${editItem.name}`}
            </h2>

            {saveError && (
              <div className="mb-4 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl">
                ⚠️ {saveError}
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Item ID / Slug</label>
                <input
                  type="text"
                  required
                  disabled={!isNew}
                  placeholder="e.g. cherry-cookie"
                  value={editItem.id}
                  onChange={(e) => setEditItem({ ...editItem, id: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cherry Cookie"
                  value={editItem.name}
                  onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Grade</label>
                  <select
                    value={editItem.grade}
                    onChange={(e) => setEditItem({ ...editItem, grade: e.target.value as Grade })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none font-bold cursor-pointer"
                  >
                    <option value="C">Grade C</option>
                    <option value="B">Grade B</option>
                    <option value="A">Grade A</option>
                    <option value="S">Grade S</option>
                    <option value="S+">Grade S+</option>
                    <option value="L">Grade L</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Max Level</label>
                  <input
                    type="number"
                    value={editItem.maxLevel}
                    onChange={(e) => setEditItem({ ...editItem, maxLevel: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Image URL Path</label>
                <input
                  type="text"
                  placeholder={`/images/${editItem.category}s/filename.png`}
                  value={editItem.imageUrl}
                  onChange={(e) => setEditItem({ ...editItem, imageUrl: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Ability & Description</label>
                <textarea
                  rows={3}
                  value={editItem.description}
                  onChange={(e) => setEditItem({ ...editItem, description: e.target.value, skill: e.target.value })}
                  placeholder="Skill effect and description..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg cursor-pointer"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VISUAL ASSET PICKER MODAL */}
      {catalog && (
        <ItemPickerModal
          isOpen={pickerModal.isOpen}
          onClose={() => setPickerModal(prev => ({ ...prev, isOpen: false }))}
          title={pickerModal.title}
          category={pickerModal.category}
          items={
            pickerModal.category === 'cookie'
              ? catalog.cookies
              : pickerModal.category === 'pet'
                ? catalog.pets
                : catalog.treasures
          }
          selectedId={
            pickerModal.slot === 'cookie'
              ? comboForm.cookieId
              : pickerModal.slot === 'relay'
                ? comboForm.relayCookieId
                : pickerModal.slot === 'pet'
                  ? comboForm.petId
                  : pickerModal.slot === 't1'
                    ? comboForm.t1
                    : pickerModal.slot === 't2'
                      ? comboForm.t2
                      : comboForm.t3
          }
          allowNone={pickerModal.allowNone}
          onSelectItem={(selectedId) => {
            if (pickerModal.slot === 'cookie') setComboForm({ ...comboForm, cookieId: selectedId });
            else if (pickerModal.slot === 'relay') setComboForm({ ...comboForm, relayCookieId: selectedId });
            else if (pickerModal.slot === 'pet') setComboForm({ ...comboForm, petId: selectedId });
            else if (pickerModal.slot === 't1') setComboForm({ ...comboForm, t1: selectedId });
            else if (pickerModal.slot === 't2') setComboForm({ ...comboForm, t2: selectedId });
            else if (pickerModal.slot === 't3') setComboForm({ ...comboForm, t3: selectedId });
          }}
        />
      )}

    </div>
  );
}
