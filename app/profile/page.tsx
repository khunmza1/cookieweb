'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ScanVerificationModal from '@/components/ScanVerificationModal';
import { ScannedTileResult } from '@/lib/scannerEngine';
import { CatalogData, UserProfile, Cookie, Pet, Treasure, Grade } from '@/lib/types';
import PaginationControls, { PageSizeOption } from '@/components/PaginationControls';
import AdSenseBanner from '@/components/AdSenseBanner';
import PortalModal from '@/components/PortalModal';
import { CookieDetailWikiModal } from '@/components/CookieDetailWikiModal';
import { PetDetailWikiModal } from '@/components/PetDetailWikiModal';
import { useLanguage } from '@/lib/i18nContext';
import { 
  CookieIcon, 
  PetIcon, 
  TreasureIcon, 
  SparklesIcon, 
  CameraIcon, 
  CheckIcon, 
  PlusIcon, 
  SearchIcon, 
  EyeIcon,
  CloseIcon
} from '@/components/icons';

export default function ProfilePage() {
  const { t } = useLanguage();
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    id: "default-user",
    username: "guest",
    name: "Classic Runner",
    role: "user",
    ownedCookies: {},
    ownedPets: {},
    ownedTreasures: {},
    updatedAt: new Date().toISOString()
  });
  const [activeTab, setActiveTab] = useState<'cookie' | 'pet' | 'treasure'>('cookie');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // PAGINATION KEPT FOR MY INVENTORY
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(24);
  const [selectedItem, setSelectedItem] = useState<{ item: Cookie | Pet | Treasure; type: 'cookie' | 'pet' | 'treasure' } | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch catalog & initial profile
  useEffect(() => {
    async function loadData() {
      try {
        const catRes = await fetch('/api/catalog');
        const catData: CatalogData = await catRes.json();
        setCatalog(catData);

        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();

        if (authData.profile) {
          setProfile(authData.profile);
        } else {
          const profRes = await fetch('/api/inventory');
          const profData: UserProfile = await profRes.json();
          setProfile(profData);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const saveProfile = (updated: UserProfile) => {
    setProfile(updated);
    window.dispatchEvent(new Event('profile_updated'));

    fetch('/api/inventory', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(err => console.error(err));
  };

  const toggleOwnership = (id: string, category: 'cookie' | 'pet' | 'treasure', maxLevel: number = 8) => {
    const copy = { ...profile };
    if (category === 'cookie') {
      const exists = copy.ownedCookies[id];
      if (exists) {
        delete copy.ownedCookies[id];
      } else {
        copy.ownedCookies[id] = { itemId: id, level: maxLevel };
      }
    } else if (category === 'pet') {
      const exists = copy.ownedPets[id];
      if (exists) {
        delete copy.ownedPets[id];
      } else {
        copy.ownedPets[id] = { itemId: id, level: maxLevel };
      }
    } else if (category === 'treasure') {
      const exists = copy.ownedTreasures[id];
      if (exists) {
        delete copy.ownedTreasures[id];
      } else {
        copy.ownedTreasures[id] = { itemId: id, level: 9 };
      }
    }
    saveProfile(copy);
  };

  const updateItemLevel = (id: string, category: 'cookie' | 'pet' | 'treasure', level: number) => {
    const copy = { ...profile };
    if (category === 'cookie' && copy.ownedCookies[id]) {
      copy.ownedCookies[id].level = level;
    } else if (category === 'pet' && copy.ownedPets[id]) {
      copy.ownedPets[id].level = level;
    } else if (category === 'treasure' && copy.ownedTreasures[id]) {
      copy.ownedTreasures[id].level = level;
    }
    saveProfile(copy);
  };

  const selectAllCategory = (category: 'cookie' | 'pet' | 'treasure') => {
    if (!catalog) return;
    const copy = { ...profile };
    if (category === 'cookie') {
      catalog.cookies.forEach(c => {
        copy.ownedCookies[c.id] = { itemId: c.id, level: c.maxLevel };
      });
    } else if (category === 'pet') {
      catalog.pets.forEach(p => {
        copy.ownedPets[p.id] = { itemId: p.id, level: p.maxLevel };
      });
    } else if (category === 'treasure') {
      catalog.treasures.forEach(tItem => {
        copy.ownedTreasures[tItem.id] = { itemId: tItem.id, level: 9 };
      });
    }
    saveProfile(copy);
  };

  const deselectAllCategory = (category: 'cookie' | 'pet' | 'treasure') => {
    const copy = { ...profile };
    if (category === 'cookie') copy.ownedCookies = {};
    if (category === 'pet') copy.ownedPets = {};
    if (category === 'treasure') copy.ownedTreasures = {};
    saveProfile(copy);
  };

  // AI Screenshot Scanner State
  const [scanning, setScanning] = useState(false);
  const [scanElapsedMs, setScanElapsedMs] = useState(0);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanIsError, setScanIsError] = useState(false);
  const [scanRunId, setScanRunId] = useState(0);
  const [debugPayloadModal, setDebugPayloadModal] = useState<{
    isOpen: boolean;
    info: any;
  }>({
    isOpen: false,
    info: null
  });
  const [verificationModal, setVerificationModal] = useState<{
    isOpen: boolean;
    screenshotUrls: string[];
    tiles: ScannedTileResult[];
  }>({
    isOpen: false,
    screenshotUrls: [],
    tiles: []
  });

  const MAX_SCAN_IMAGES = 8;

  // Live Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (scanning) {
      const start = Date.now();
      setScanElapsedMs(0);
      timer = setInterval(() => {
        setScanElapsedMs(Date.now() - start);
      }, 100);
    }
    return () => clearInterval(timer);
  }, [scanning]);

  // Client-Side Canvas Image Compression: Resizes 4K phone screenshots to 1080p JPEG (drops payload size from 6MB to 120KB)
  const compressAndResizeScreenshot = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1080;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Convert to high quality compressed JPEG (0.82)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(compressedDataUrl);
      };

      img.onerror = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_SCAN_IMAGES);
    e.target.value = '';
    if (files.length === 0) return;

    setScanning(true);
    setScanIsError(false);
    setScanResult(`Compressing & Uploading ${files.length} screenshot${files.length !== 1 ? 's' : ''}…`);

    try {
      // Compress and resize screenshots client-side (98% byte size reduction)
      const dataUrls = await Promise.all(files.map(compressAndResizeScreenshot));
      setScanResult('AI Vision is reading your treasures & enhancement levels…');

      const res = await fetch('/api/inventory/scan-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: dataUrls.map((url, idx) => ({ imageBase64: url, filename: files[idx].name }))
        })
      });

      const data = await res.json();

      if (data.debugPayloadInfo) {
        setDebugPayloadModal(prev => ({ ...prev, info: data.debugPayloadInfo }));
      }

      if (!res.ok || !data.success) {
        setScanIsError(true);
        setScanResult(data.error || 'Failed to analyze screenshot(s).');
        return;
      }

      setScanRunId(id => id + 1);
      setVerificationModal({
        isOpen: true,
        screenshotUrls: data.screenshotUrls,
        tiles: data.scannedTiles
      });
      setScanResult(
        `Found ${data.totalDetected} treasure${data.totalDetected !== 1 ? 's' : ''}` +
        (data.conflictCount > 0 ? ` (${data.conflictCount} need review)` : '') +
        ' — review below.'
      );
    } catch (err) {
      console.error(err);
      setScanIsError(true);
      setScanResult('Network error while scanning screenshot(s). Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleConfirmImport = async (verifiedTiles: ScannedTileResult[]) => {
    try {
      const res = await fetch('/api/inventory/scan-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', tiles: verifiedTiles })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProfile(data.profile);
        setScanIsError(false);
        setScanResult(data.message);
        setActiveTab('treasure');
        setVerificationModal({ isOpen: false, screenshotUrls: [], tiles: [] });
        window.dispatchEvent(new Event('profile_updated'));
      } else {
        setScanIsError(true);
        setScanResult('Failed to import confirmed collection.');
      }
    } catch (e) {
      console.error(e);
      setScanIsError(true);
      setScanResult('Network error while importing collection.');
    }
  };

  if (loading || !catalog) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 font-medium text-sm">Loading Cookie Run Catalog...</p>
        </div>
      </div>
    );
  }

  const grades: Grade[] = ['C', 'B', 'A', 'S', 'S+', 'L'];
  const ownedCookieCount = Object.keys(profile.ownedCookies).length;
  const ownedPetCount = Object.keys(profile.ownedPets).length;
  const ownedTreasureCount = Object.keys(profile.ownedTreasures).length;

  const currentList = activeTab === 'cookie' 
    ? catalog.cookies 
    : activeTab === 'pet' 
      ? catalog.pets 
      : catalog.treasures;

  const filteredItems = currentList.filter(item => {
    if (selectedGrade !== 'ALL' && item.grade !== selectedGrade) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return item.name.toLowerCase().includes(term) || item.id.toLowerCase().includes(term);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-amber-500/10 via-zinc-900/40 to-zinc-950 border-b border-zinc-800/80 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider mb-3">
              <SparklesIcon className="w-4 h-4" />
              <span>{t.profile.badge}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {t.profile.title}
            </h1>
            <p className="text-zinc-400 text-sm mt-1 max-w-xl">
              {t.profile.subtitle}
            </p>
          </div>

          {/* Quick Stats Cards */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 text-center min-w-[100px] shadow-lg">
              <span className="text-2xl font-black text-amber-400 flex items-center justify-center gap-1">
                <CookieIcon className="w-5 h-5 text-amber-400" />
                <span>{ownedCookieCount}</span>
              </span>
              <span className="block text-[11px] text-zinc-400 font-bold uppercase tracking-wider mt-1">{t.home.cookiesOwned}</span>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 text-center min-w-[100px] shadow-lg">
              <span className="text-2xl font-black text-purple-400 flex items-center justify-center gap-1">
                <PetIcon className="w-5 h-5 text-purple-400" />
                <span>{ownedPetCount}</span>
              </span>
              <span className="block text-[11px] text-zinc-400 font-bold uppercase tracking-wider mt-1">{t.home.petsOwned}</span>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 text-center min-w-[100px] shadow-lg">
              <span className="text-2xl font-black text-amber-300 flex items-center justify-center gap-1">
                <TreasureIcon className="w-5 h-5 text-amber-300" />
                <span>{ownedTreasureCount}</span>
              </span>
              <span className="block text-[11px] text-zinc-400 font-bold uppercase tracking-wider mt-1">{t.home.treasuresOwned}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        
        {/* AI Screenshot Importer Widget */}
        <div className="bg-gradient-to-r from-amber-500/10 via-zinc-900 to-purple-500/10 border border-amber-500/30 rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-wider flex items-center gap-1">
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>{t.profile.aiScanner}</span>
              </span>
              
              {/* LIVE PROCESSING TIMER */}
              {scanning && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider flex items-center gap-1 font-mono animate-pulse">
                  <span>⏱️ Processing AI Vision... {(scanElapsedMs / 1000).toFixed(1)}s</span>
                </span>
              )}

              {scanResult && (
                <span className={`text-xs font-extrabold ${scanIsError ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {scanResult}
                </span>
              )}
            </div>
            
            <h2 className="text-xl font-black text-white">{t.profile.uploadScreenshots}</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {t.profile.uploadDesc}
            </p>

            {/* ALWAYS VISIBLE MONITOR PAYLOAD BUTTON */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setDebugPayloadModal(prev => ({ ...prev, isOpen: true }))}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/40 text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>🔍 Inspect AI Request Body & Payload Monitor {debugPayloadModal.info ? `(${debugPayloadModal.info.payloadSizeKb})` : ''}</span>
              </button>
            </div>
          </div>

          <label className={`shrink-0 px-6 py-3.5 rounded-2xl font-black text-xs shadow-xl transition-all flex items-center gap-2 cursor-pointer ${
            scanning
              ? 'bg-zinc-700 text-zinc-400 cursor-wait opacity-70'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 hover:from-amber-400 hover:to-emerald-300 text-zinc-950 transform hover:-translate-y-0.5'
          }`}>
            <CameraIcon className="w-4 h-4 stroke-[2.5]" />
            <span>{scanning ? `${t.profile.scanning} (${(scanElapsedMs / 1000).toFixed(1)}s)` : t.profile.uploadBtn}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              disabled={scanning}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2 p-1.5 bg-zinc-900/90 rounded-2xl border border-zinc-800">
            <button
              onClick={() => { setActiveTab('cookie'); setSelectedGrade('ALL'); setSearchTerm(''); setCurrentPage(1); }}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'cookie'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 shadow-lg shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <CookieIcon className="w-4 h-4" />
              <span>{t.profile.cookiesTab}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-zinc-950/40">{catalog.cookies.length}</span>
            </button>

            <button
              onClick={() => { setActiveTab('pet'); setSelectedGrade('ALL'); setSearchTerm(''); setCurrentPage(1); }}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'pet'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <PetIcon className="w-4 h-4" />
              <span>{t.profile.petsTab}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-zinc-950/40">{catalog.pets.length}</span>
            </button>

            <button
              onClick={() => { setActiveTab('treasure'); setSelectedGrade('ALL'); setSearchTerm(''); setCurrentPage(1); }}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'treasure'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 shadow-lg shadow-amber-400/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <TreasureIcon className="w-4 h-4" />
              <span>{t.profile.treasuresTab}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-zinc-950/40">{catalog.treasures.length}</span>
            </button>
          </div>

          {/* Batch Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => selectAllCategory(activeTab)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition cursor-pointer"
            >
              {t.profile.selectAll}
            </button>
            <button
              onClick={() => deselectAllCategory(activeTab)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition cursor-pointer"
            >
              {t.profile.clearAll}
            </button>
          </div>
        </div>

        {/* Search Bar & Grade Filters */}
        <div className="my-6 space-y-3">
          <div className="relative max-w-md">
            <SearchIcon className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeTab}s...`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mr-2">{t.profile.grade}</span>
            <button
              onClick={() => { setSelectedGrade('ALL'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                selectedGrade === 'ALL'
                  ? 'bg-zinc-100 text-zinc-950 shadow-md'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              {t.profile.allGrades}
            </button>
            {grades.map(g => (
              <button
                key={g}
                onClick={() => { setSelectedGrade(g); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  selectedGrade === g
                    ? 'bg-amber-500 text-zinc-950 shadow-md'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                }`}
              >
                Grade {g}
              </button>
            ))}
          </div>
        </div>

        {/* Top Pagination Controls */}
        <PaginationControls
          currentPage={currentPage}
          totalItems={filteredItems.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[12, 24, 48, 96, 'ALL']}
          className="mb-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4"
        />

        {/* Item Grid with Pagination */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {(pageSize === 'ALL'
            ? filteredItems
            : filteredItems.slice((currentPage - 1) * (typeof pageSize === 'number' ? pageSize : filteredItems.length), currentPage * (typeof pageSize === 'number' ? pageSize : filteredItems.length))
          ).map(item => {
            const isOwned = activeTab === 'cookie' 
              ? Boolean(profile.ownedCookies[item.id]) 
              : activeTab === 'pet' 
                ? Boolean(profile.ownedPets[item.id]) 
                : Boolean(profile.ownedTreasures[item.id]);

            const currentLevel = activeTab === 'cookie'
              ? profile.ownedCookies[item.id]?.level || (item as Cookie).maxLevel
              : activeTab === 'pet'
                ? profile.ownedPets[item.id]?.level || (item as Pet).maxLevel
                : profile.ownedTreasures[item.id]?.level || 9;

            const maxLvl = activeTab === 'treasure' ? 9 : (item as Cookie | Pet).maxLevel || 8;

            return (
              <div
                key={`${activeTab}-${item.id}`}
                className={`relative group rounded-2xl border transition-all duration-300 p-3.5 flex flex-col items-center text-center cursor-pointer hover:-translate-y-1 ${
                  isOwned
                    ? 'bg-zinc-900/95 border-amber-500/50 shadow-md shadow-amber-500/10 hover:border-amber-400'
                    : 'bg-zinc-900/30 border-zinc-800/60 opacity-60 hover:opacity-100 hover:border-zinc-700'
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOwnership(item.id, activeTab, maxLvl);
                  }}
                  className={`absolute top-2.5 left-2.5 w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isOwned ? 'bg-amber-500 text-zinc-950 shadow-md scale-105' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                  title={isOwned ? "Click to remove" : "Click to mark as owned"}
                >
                  {isOwned ? <CheckIcon className="w-3.5 h-3.5 stroke-[3]" /> : <PlusIcon className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[9px] font-black bg-zinc-950/90 text-amber-400 border border-zinc-800">
                  {item.grade}
                </span>

                <div
                  onClick={() => toggleOwnership(item.id, activeTab, maxLvl)}
                  className="w-16 h-16 relative my-3 group-hover:scale-105 transition-transform flex items-center justify-center"
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={56}
                    height={56}
                    unoptimized
                    className="object-contain"
                  />
                </div>

                <span className="text-xs font-extrabold text-zinc-200 line-clamp-1 w-full">{item.name}</span>

                {isOwned && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[10px] text-zinc-500 font-bold">Lvl:</span>
                    <select
                      value={currentLevel}
                      onChange={(e) => updateItemLevel(item.id, activeTab, Number(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-zinc-900 border border-amber-500/40 text-amber-400 text-xs font-bold rounded-lg px-2 py-0.5 outline-none cursor-pointer"
                    >
                      {Array.from({ length: maxLvl }, (_, i) => i + 1).map(lvl => (
                        <option key={lvl} value={lvl}>
                          {activeTab === 'treasure' ? `+${lvl}` : `Lvl ${lvl}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem({ item, type: activeTab });
                  }}
                  className="mt-2.5 text-[10px] font-bold text-zinc-400 hover:text-amber-400 transition flex items-center gap-1 cursor-pointer"
                >
                  <EyeIcon className="w-3 h-3" />
                  <span>{t.profile.detailsAndStats}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Pagination Controls */}
        <PaginationControls
          currentPage={currentPage}
          totalItems={filteredItems.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[12, 24, 48, 96, 'ALL']}
          className="mt-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4"
        />

        {/* Google AdSense Banner Placement */}
        <div className="mt-12">
          <AdSenseBanner
            type="leaderboard"
            slot="inventory-bottom-ad"
          />
        </div>

      </div>

      {/* Item Detail Modal Popup */}
      {selectedItem && selectedItem.type === 'cookie' ? (
        <CookieDetailWikiModal
          cookie={selectedItem.item as Cookie}
          catalog={catalog}
          onClose={() => setSelectedItem(null)}
        />
      ) : selectedItem && selectedItem.type === 'pet' ? (
        <PetDetailWikiModal
          pet={selectedItem.item as Pet}
          catalog={catalog}
          onClose={() => setSelectedItem(null)}
        />
      ) : selectedItem && (
        <PortalModal>
          <div className="modal-backdrop animate-fade-in">
            <div className="absolute inset-0" onClick={() => setSelectedItem(null)}></div>
            <div className="bg-zinc-900 border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 relative text-zinc-100 shadow-2xl animate-modal-pop z-10">
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4 border-b border-zinc-800 pb-4">
                <div className="w-16 h-16 relative bg-zinc-950 rounded-2xl p-2 border border-zinc-800 flex items-center justify-center shrink-0">
                  <Image
                    src={selectedItem.item.imageUrl}
                    alt={selectedItem.item.name}
                    width={60}
                    height={60}
                    unoptimized
                    className="object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">
                      Grade {selectedItem.item.grade}
                    </span>
                    <span className="text-xs text-zinc-400 font-bold capitalize">{selectedItem.type}</span>
                  </div>
                  <h2 className="text-xl font-black text-white mt-1">{selectedItem.item.name}</h2>
                </div>
              </div>

              <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Description & Effect</h4>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {selectedItem.type === 'treasure' 
                      ? (selectedItem.item as Treasure).effect 
                      : (selectedItem.item as Cookie | Pet).description}
                  </p>
                </div>

                {selectedItem.type !== 'treasure' && (selectedItem.item as Cookie | Pet).skill && (
                  <div>
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Skill Power</h4>
                    <p className="text-sm text-amber-100/90 font-medium">{(selectedItem.item as Cookie | Pet).skill}</p>
                  </div>
                )}

                {selectedItem.type !== 'treasure' && (selectedItem.item as Cookie | Pet).combiBonus && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Combi Bonus</h4>
                    <p className="text-xs text-zinc-200 mt-1 font-semibold">{(selectedItem.item as Cookie | Pet).combiBonus}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition cursor-pointer"
                >
                  {t.modal.close}
                </button>
              </div>
            </div>
          </div>
        </PortalModal>
      )}

      {/* Debug AI Request Body & Payload Monitor Modal */}
      {debugPayloadModal.isOpen && (
        <PortalModal>
          <div className="modal-backdrop animate-fade-in">
            <div className="absolute inset-0" onClick={() => setDebugPayloadModal(prev => ({ ...prev, isOpen: false }))}></div>
            <div className="bg-zinc-900 border border-emerald-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 relative text-zinc-100 shadow-2xl animate-modal-pop z-10 font-mono text-xs">
              <button
                onClick={() => setDebugPayloadModal(prev => ({ ...prev, isOpen: false }))}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 mb-4">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <SparklesIcon className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-white font-sans">🔍 AI Request Body & Payload Inspector</h3>
                  <p className="text-[11px] text-zinc-400 font-sans">Real-time HTTP request body monitoring & payload size diagnostics</p>
                </div>
              </div>

              {debugPayloadModal.info ? (
                <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
                  <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Target Provider API Endpoint:</span>
                      <span className="text-emerald-400 font-bold break-all">{debugPayloadModal.info.endpoint}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Configured Model:</span>
                      <span className="text-amber-400 font-bold">{debugPayloadModal.info.modelName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Total HTTP Body Size:</span>
                      <span className="text-emerald-300 font-black text-sm">{debugPayloadModal.info.payloadSizeKb} ({debugPayloadModal.info.payloadSizeBytes.toLocaleString()} bytes)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Compression Status:</span>
                      <span className="text-emerald-400 font-bold">✅ 1080p Canvas Compressed JPEG (~120KB/img)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">Full Prompt Text ({debugPayloadModal.info.promptLengthChars?.toLocaleString()} chars):</span>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(debugPayloadModal.info.fullPromptText || debugPayloadModal.info.promptTextSnippet)}
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-amber-400 font-bold border border-zinc-700 cursor-pointer font-sans"
                      >
                        📋 Copy Full Prompt
                      </button>
                    </div>
                    <pre className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-[11px] text-zinc-300 whitespace-pre-wrap font-mono max-h-[300px] overflow-y-auto select-all border-amber-500/20">
                      {debugPayloadModal.info.fullPromptText || debugPayloadModal.info.promptTextSnippet}
                    </pre>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Timestamp:</span>
                    <span className="text-zinc-500">{debugPayloadModal.info.timestamp}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2 text-zinc-300 font-sans">
                  <p className="font-bold text-amber-400">ℹ️ No scan payload recorded yet in current session.</p>
                  <p className="text-xs text-zinc-400">
                    Upload an inventory screenshot above. Once uploaded, this inspector will capture and display the exact JSON payload, total HTTP body byte size, target API endpoint URL, and prompt snippet sent to your AI provider!
                  </p>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={() => setDebugPayloadModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition cursor-pointer font-sans"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        </PortalModal>
      )}

      {catalog && (
        <ScanVerificationModal
          key={scanRunId}
          isOpen={verificationModal.isOpen}
          onClose={() => setVerificationModal({ isOpen: false, screenshotUrls: [], tiles: [] })}
          screenshotUrls={verificationModal.screenshotUrls}
          initialTiles={verificationModal.tiles}
          catalogTreasures={catalog.treasures}
          onConfirmImport={handleConfirmImport}
        />
      )}
    </div>
  );
}
