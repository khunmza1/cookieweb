'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ScanVerificationModal from '@/components/ScanVerificationModal';
import { ScannedTileResult } from '@/lib/scannerEngine';
import { CatalogData, UserProfile, Cookie, Pet, Treasure, Grade } from '@/lib/types';

export default function ProfilePage() {
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

    // Sync with API asynchronously
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
      catalog.treasures.forEach(t => {
        copy.ownedTreasures[t.id] = { itemId: t.id, level: 9 };
      });
    }
    saveProfile(copy);
  };

  // AI Screenshot Scanner State
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanIsError, setScanIsError] = useState(false);
  const [scanRunId, setScanRunId] = useState(0);
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

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_SCAN_IMAGES);
    e.target.value = ''; // allow re-selecting the same file(s) next time
    if (files.length === 0) return;

    setScanning(true);
    setScanIsError(false);
    setScanResult(`Uploading ${files.length} screenshot${files.length !== 1 ? 's' : ''}…`);

    try {
      const dataUrls = await Promise.all(files.map(fileToDataUrl));

      setScanResult('AI Vision is reading your treasures & enhancement levels…');

      const res = await fetch('/api/inventory/scan-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: dataUrls.map((url, idx) => ({ imageBase64: url, filename: files[idx].name }))
        })
      });

      const data = await res.json();

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

  const deselectAllCategory = (category: 'cookie' | 'pet' | 'treasure') => {
    const copy = { ...profile };
    if (category === 'cookie') copy.ownedCookies = {};
    if (category === 'pet') copy.ownedPets = {};
    if (category === 'treasure') copy.ownedTreasures = {};
    saveProfile(copy);
  };

  if (loading || !catalog) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 font-medium">Loading Cookie Run Catalog...</p>
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
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-amber-500/10 via-zinc-900/40 to-zinc-950 border-b border-zinc-800/80 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
              <span>Runner Inventory Profile</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Manage Your Collection
            </h1>
            <p className="text-zinc-400 text-sm mt-1 max-w-xl">
              Toggle your owned Cookies, Pets, and Treasures or upload an in-game screenshot to auto-import your collection!
            </p>
          </div>

          {/* Quick Stats Cards */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 text-center min-w-[90px]">
              <span className="text-2xl font-black text-amber-400">{ownedCookieCount}</span>
              <span className="block text-[11px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">Cookies</span>
            </div>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 text-center min-w-[90px]">
              <span className="text-2xl font-black text-purple-400">{ownedPetCount}</span>
              <span className="block text-[11px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">Pets</span>
            </div>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 text-center min-w-[90px]">
              <span className="text-2xl font-black text-amber-300">{ownedTreasureCount}</span>
              <span className="block text-[11px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">Treasures</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        
        {/* AI Screenshot Importer Widget */}
        <div className="bg-gradient-to-r from-amber-500/10 via-zinc-900 to-purple-500/10 border border-amber-500/30 rounded-3xl p-5 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-wider">
                🤖 AI Vision
              </span>
              {scanResult && (
                <span className={`text-xs font-extrabold ${scanIsError ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {scanResult}
                </span>
              )}
            </div>
            <h2 className="text-lg font-black text-white">Upload In-Game Inventory Screenshot(s)</h2>
            <p className="text-xs text-zinc-400">
              Upload one or more screenshots of your treasure inventory (the &ldquo;Select a Treasure to equip&rdquo; screen) — AI Vision reads every icon and its +0 to +9 enhancement badge, then lets you verify before importing.
            </p>
          </div>

          <label className={`shrink-0 px-6 py-3 rounded-2xl font-black text-xs shadow-lg transition flex items-center gap-2 ${
            scanning
              ? 'bg-zinc-700 text-zinc-400 cursor-wait opacity-70'
              : 'bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-zinc-950 cursor-pointer'
          }`}>
            <span>{scanning ? '⏳ Scanning…' : '📸 Upload Screenshot(s)'}</span>
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
          <div className="flex items-center gap-2 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800">
            <button
              onClick={() => { setActiveTab('cookie'); setSelectedGrade('ALL'); }}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'cookie'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 shadow-lg shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>🍪 Cookies</span>
              <span className="px-1.5 py-0.5 rounded-full text-xs bg-zinc-950/20">{catalog.cookies.length}</span>
            </button>

            <button
              onClick={() => { setActiveTab('pet'); setSelectedGrade('ALL'); }}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'pet'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>🐾 Pets</span>
              <span className="px-1.5 py-0.5 rounded-full text-xs bg-zinc-950/20">{catalog.pets.length}</span>
            </button>

            <button
              onClick={() => { setActiveTab('treasure'); setSelectedGrade('ALL'); }}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'treasure'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 shadow-lg shadow-amber-400/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>💎 Treasures</span>
              <span className="px-1.5 py-0.5 rounded-full text-xs bg-zinc-950/20">{catalog.treasures.length}</span>
            </button>
          </div>

          {/* Batch Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => selectAllCategory(activeTab)}
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
            >
              Select All {activeTab.toUpperCase()}s
            </button>
            <button
              onClick={() => deselectAllCategory(activeTab)}
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Grade Filters */}
        <div className="flex items-center gap-2 my-6 overflow-x-auto pb-2">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mr-2">Grade:</span>
          <button
            onClick={() => setSelectedGrade('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              selectedGrade === 'ALL'
                ? 'bg-zinc-100 text-zinc-950'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            All Grades
          </button>
          {grades.map(g => (
            <button
              key={g}
              onClick={() => setSelectedGrade(g)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                selectedGrade === g
                  ? 'bg-amber-500 text-zinc-950'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              Grade {g}
            </button>
          ))}
        </div>

        {/* Item Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredItems.map(item => {
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
                key={item.id}
                className={`relative group rounded-2xl border transition-all p-3 flex flex-col items-center text-center cursor-pointer ${
                  isOwned
                    ? 'bg-zinc-900/90 border-amber-500/50 shadow-md shadow-amber-500/5 hover:border-amber-400'
                    : 'bg-zinc-900/30 border-zinc-800/60 opacity-60 hover:opacity-100 hover:border-zinc-700'
                }`}
              >
                {/* Owned Checkmark */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOwnership(item.id, activeTab, maxLvl);
                  }}
                  className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition ${
                    isOwned ? 'bg-amber-500 text-zinc-950 shadow-md' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                  }`}
                  title={isOwned ? "Click to remove from inventory" : "Click to mark as owned"}
                >
                  {isOwned ? '✓' : '+'}
                </button>

                {/* Grade Badge */}
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-black bg-zinc-950/80 text-amber-400 border border-zinc-800">
                  {item.grade}
                </div>

                {/* Image Icon */}
                <div 
                  onClick={() => setSelectedItem({ item, type: activeTab })}
                  className="w-20 h-20 my-2 relative flex items-center justify-center group-hover:scale-105 transition-transform"
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={80}
                    height={80}
                    unoptimized
                    className="object-contain drop-shadow-md"
                  />
                </div>

                {/* Name */}
                <h3 
                  onClick={() => setSelectedItem({ item, type: activeTab })}
                  className="font-bold text-xs text-white line-clamp-1 hover:text-amber-300"
                >
                  {item.name}
                </h3>

                {/* Level Controls if Owned */}
                {isOwned && (
                  <div className="mt-3 w-full bg-zinc-950/70 p-1.5 rounded-lg border border-zinc-800 flex items-center justify-between gap-1">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">
                      {activeTab === 'treasure' ? `+${currentLevel}` : `Lvl ${currentLevel}`}
                    </span>
                    <select
                      value={currentLevel}
                      onChange={(e) => updateItemLevel(item.id, activeTab, Number(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-zinc-900 border border-zinc-700 text-amber-400 text-xs font-bold rounded px-1 py-0.5 outline-none cursor-pointer"
                    >
                      {Array.from({ length: maxLvl }, (_, i) => i + 1).map(lvl => (
                        <option key={lvl} value={lvl}>
                          {activeTab === 'treasure' ? `+${lvl}` : `Lvl ${lvl}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Info Button */}
                <button
                  onClick={() => setSelectedItem({ item, type: activeTab })}
                  className="mt-2 text-[10px] font-semibold text-zinc-400 hover:text-amber-400 transition"
                >
                  View Details & Stats
                </button>
              </div>
            );
          })}
        </div>

      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 relative text-zinc-100 shadow-2xl">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold"
            >
              ✕
            </button>

            <div className="flex items-center gap-4 border-b border-zinc-800 pb-4">
              <div className="w-16 h-16 relative bg-zinc-950 rounded-xl p-2 border border-zinc-800 flex items-center justify-center">
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
                  <span className="px-2 py-0.5 rounded text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    Grade {selectedItem.item.grade}
                  </span>
                  <span className="text-xs text-zinc-400 capitalize">{selectedItem.type}</span>
                </div>
                <h2 className="text-xl font-black text-white mt-1">{selectedItem.item.name}</h2>
              </div>
            </div>

            <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Description & Effect</h4>
                <p className="text-sm text-zinc-300">
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
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Combi Bonus</h4>
                  <p className="text-xs text-zinc-200 mt-0.5">{(selectedItem.item as Cookie | Pet).combiBonus}</p>
                </div>
              )}

              {selectedItem.type === 'treasure' && (selectedItem.item as Treasure).enhancementStats && (
                <div className="space-y-2 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Enhancement Progression</h4>
                  <p className="text-xs text-zinc-300">
                    <strong className="text-zinc-400">Base (+0):</strong> {(selectedItem.item as Treasure).enhancementStats.baseEffect}
                  </p>
                  <p className="text-xs text-amber-300">
                    <strong className="text-amber-400">Max (+9):</strong> {(selectedItem.item as Treasure).enhancementStats.plus9Effect}
                  </p>
                </div>
              )}

              {/* HP Stats Table */}
              {selectedItem.item.hpStats && selectedItem.item.hpStats.length > 0 && !selectedItem.item.hpStats[0].effect.includes('placeholder') && (
                <div>
                  <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">❤️ Energy / HP Progression</h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {selectedItem.item.hpStats.map((st, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-zinc-950 p-2 rounded border border-zinc-800/60">
                        <span className="font-bold text-zinc-400">Lvl {st.level}</span>
                        <span className="font-semibold text-red-300">{st.effect} HP</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skill Stats Table */}
              {selectedItem.item.skillStats && selectedItem.item.skillStats.length > 0 && !selectedItem.item.skillStats[0].effect.includes('placeholder') && (
                <div>
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">⚡ Skill Improvements Per Level</h4>
                  <div className="space-y-1.5">
                    {selectedItem.item.skillStats.map((st, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-zinc-950 p-2.5 rounded border border-zinc-800/60">
                        <span className="font-bold text-amber-400 min-w-[55px]">Level {st.level}</span>
                        <span className="text-zinc-200 text-right">{st.effect}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCAN VERIFICATION MODAL */}
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
