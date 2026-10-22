import { ThemeSelector } from '../ThemeSelector';
import React, { useState } from 'react';
import { ChevronDown, Trophy, TrendingUp, Zap, Crown, ClipboardList, Archive, PackageCheck, Truck, BoxIcon, User, MapPin, Globe, LogOut, RefreshCw, ShieldCheck, Lock, AlertTriangle, X } from 'lucide-react';
import { formatRole } from '../../utils/formatting';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';
import { canSwitchCountry } from '../../utils/permissions';
import { getCountryProfile, getRegisteredCountries, Country } from '../../utils/localization';
import { evaluateGeofence } from '../../utils/geofence';

interface UserMenuProps {
   user: any;
   isUserMenuOpen: boolean;
   setIsUserMenuOpen: (val: boolean) => void;
   currentUserPoints: any;
   todayJobs: any[];
   todayJobsTotal: number;
   logout: () => void;
   navigate: (path: string) => void;
   language: string;
   setLanguage: (lang: any) => void;
   dropdownRef: React.RefObject<HTMLDivElement | null>;
   theme?: string;
   toggleTheme?: () => void;
   onRefresh?: () => void;
}

export function UserMenu({
   user,
   isUserMenuOpen,
   setIsUserMenuOpen,
   currentUserPoints,
   todayJobs,
   todayJobsTotal,
   logout,
   navigate,
   language,
   setLanguage,
   dropdownRef,
   theme,
   toggleTheme,
   onRefresh
}: UserMenuProps) {
   const { availableLanguages, countryProfile, isKenya } = useLanguage();
   const { settings, updateSettings, effectiveCountry: ctxEffectiveCountry, isCeo: ctxIsCeo } = useData();
   const [isSwitchingMarket, setIsSwitchingMarket] = useState(false);

   const isCeoUser = ctxIsCeo ?? canSwitchCountry(user);
   const currentMarket: Country = (ctxEffectiveCountry || settings?.country || 'ET') as Country;
   const currentMarketProfile = getCountryProfile(currentMarket);

   const handleSwitchMarket = async (targetCountry: Country) => {
      if (targetCountry === currentMarket || !updateSettings || isSwitchingMarket) return;
      setIsSwitchingMarket(true);
      const profile = getCountryProfile(targetCountry);
      try {
         await updateSettings({
            country: targetCountry,
            currency: profile.currency,
            timezone: profile.timezone,
            dateFormat: profile.dateFormat,
            taxRate: profile.taxRate,
            defaultVatRate: profile.taxRate,
            taxAuthority: profile.taxAuthority,
            complianceStandard: profile.complianceStandard,
            language: profile.supportedLanguages.some(l => l.code === settings?.language)
               ? (settings?.language || 'en')
               : (profile.supportedLanguages[0]?.code || 'en')
         }, user?.name || 'CEO');

         // Automatically refresh the application so the entire national tenant context re-hydrates cleanly
         if (typeof window !== 'undefined') {
            window.location.reload();
         }
      } catch (err) {
         console.error('Failed to switch market:', err);
         setIsSwitchingMarket(false);
      }
   };

   if (!user) return null;

   return (
      <div className="relative flex-shrink-0" ref={dropdownRef}>
         <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            aria-label="User Profile and Menu"
            aria-expanded={isUserMenuOpen}
            aria-haspopup="true"
            className={`flex items-center gap-1.5 sm:gap-2 md:gap-3 px-2 sm:px-2 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full border transition-all duration-300 cursor-pointer flex-shrink-0 touch-manipulation min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${isUserMenuOpen
               ? 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border-focus)]'
               : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)] hover:border-[var(--theme-border-focus)]'
            }`}
         >
            <div className="relative">
               <div className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-[var(--theme-primary)] text-[var(--theme-primary-text)] flex items-center justify-center font-black text-xs md:text-sm shadow-md transition-transform overflow-hidden border border-white/20">
                  {user.avatar ? (
                     <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                           e.currentTarget.style.display = 'none';
                           e.currentTarget.parentElement!.innerHTML = user.name.charAt(0).toUpperCase();
                        }}
                     />
                  ) : (
                     user.name.charAt(0).toUpperCase()
                  )}
               </div>
               <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 md:w-3 md:h-3 bg-emerald-500 border-2 border-[var(--theme-bg-panel)] rounded-full animate-pulse"></div>
            </div>

            <div className="hidden md:flex flex-col text-left">
               <span className="text-sm font-bold text-[var(--theme-text-primary)] leading-none">{user.name}</span>
               <span className="text-[10px] font-mono text-[var(--theme-text-secondary)] uppercase tracking-wider mt-0.5 leading-none">{formatRole(user.role)}</span>
            </div>

            <ChevronDown size={13} className={`text-[var(--theme-text-secondary)] transition-transform duration-300 md:h-[14px] md:w-[14px] ${isUserMenuOpen ? 'rotate-180' : ''}`} />
         </button>

         {/* Dropdown Menu */}
         {isUserMenuOpen && (
            <div
               className="fixed inset-x-2 top-[calc(env(safe-area-inset-top)+3.5rem)] z-[150] mx-auto w-auto max-w-[26rem] overflow-y-auto overscroll-contain rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-bg-panel)] shadow-[0_20px_50px_rgba(0,0,0,0.28)] animate-in fade-in slide-in-from-top-2 max-h-[calc(100dvh-env(safe-area-inset-top)-4.25rem)] custom-scrollbar sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mx-0 sm:mt-2 sm:w-80 sm:max-h-[calc(100vh-5rem)] sm:rounded-2xl"
               onClick={() => setIsUserMenuOpen(false)}
               role="dialog"
               aria-modal="false"
               aria-label="User menu"
            >
                  <div className="p-4 border-b border-[var(--theme-border)] bg-[var(--theme-bg-subtle)]" onClick={(e) => e.stopPropagation()}>
                     <div className="flex items-start gap-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-primary)] text-[var(--theme-primary-text)] flex items-center justify-center text-lg font-bold">
                           {user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : user.name.charAt(0).toUpperCase()}
                           <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-[var(--theme-bg-panel)] bg-emerald-500" />
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                           <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--theme-text-muted)]">Signed in as</p>
                           <p className="mt-0.5 truncate text-base font-bold text-[var(--theme-text-primary)]">{user.name}</p>
                           <p className="mt-0.5 truncate text-xs font-medium text-[var(--theme-primary)]">{formatRole(user.role)}</p>
                        </div>
                        <button type="button" onClick={() => setIsUserMenuOpen(false)} aria-label="Close user menu" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] sm:hidden">
                           <X size={18} />
                        </button>
                     </div>
                     
                     {user.loginLocation && (() => {
                        const geofence = evaluateGeofence(user.loginLocation, currentMarket);
                        return (
                              <div className={`flex items-center gap-1.5 mt-3 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border max-w-full w-fit ${
                              geofence.isForeignAnomaly
                                 ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                                 : geofence.isOffPremise
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                    : 'text-[var(--theme-text-secondary)] bg-[var(--theme-bg-card)] border-[var(--theme-border)]'
                           }`}>
                              {geofence.isForeignAnomaly ? (
                                 <AlertTriangle size={13} className="text-red-500 shrink-0" />
                              ) : (
                                 <MapPin size={13} className="text-[var(--theme-primary)] shrink-0" />
                              )}
                              <span className="truncate max-w-[230px]" title={geofence.anomalyReason || user.loginLocation}>
                                 {geofence.isForeignAnomaly ? `Foreign: ${geofence.displayLocation}` : user.loginLocation}
                              </span>
                           </div>
                        );
                     })()}

                     {/* Performance Highlights */}
                     {currentUserPoints && (
                        <div className="grid grid-cols-2 gap-2.5 mt-4">
                           <div className="bg-[var(--theme-bg-card)] rounded-xl p-3 border border-[var(--theme-border)]">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                 <Trophy size={14} className="text-amber-500" />
                                 <span className="text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wide">Points</span>
                              </div>
                              <p className="text-base font-bold tabular-nums text-[var(--theme-text-primary)]">{currentUserPoints.totalPoints?.toLocaleString() || 0}</p>
                           </div>
                           <div className="bg-[var(--theme-bg-card)] rounded-xl p-3 border border-[var(--theme-border)]">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                 <TrendingUp size={14} className="text-blue-500" />
                                 <span className="text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wide">Rank</span>
                              </div>
                              <p className="text-base font-bold tabular-nums text-[var(--theme-text-primary)]">#{currentUserPoints.rank || '-'}</p>
                           </div>
                           <div className="col-span-2 bg-[var(--theme-bg-card)] rounded-xl p-3 border border-[var(--theme-border)] flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                 <div className="w-6 h-6 rounded-full bg-[var(--theme-primary)] text-[var(--theme-primary-text)] flex items-center justify-center">
                                    <Zap size={12} fill="currentColor" />
                                 </div>
                                 <div>
                                    <p className="text-[9px] font-bold text-[var(--theme-text-secondary)] uppercase leading-none">Level {currentUserPoints.level || 1}</p>
                                    <p className="text-[10px] font-black text-[var(--theme-text-primary)] leading-tight">{currentUserPoints.levelTitle || 'Rookie'}</p>
                                 </div>
                              </div>
                              <Crown size={14} className="text-amber-500 opacity-60" />
                           </div>
                        </div>
                     )}

                     {/* Today's Completed Jobs Card */}
                     {todayJobsTotal > 0 && (
                        <div className="mt-3 bg-blue-500/10 rounded-2xl p-3.5 border border-blue-500/20">
                           <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                 <ClipboardList size={14} className="text-blue-500" />
                                 <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Today’s completed jobs</span>
                              </div>
                                 <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/15 px-2 py-1 rounded-lg border border-blue-500/20">
                                 {todayJobsTotal}
                              </span>
                           </div>
                           <div className="flex flex-wrap gap-1.5">
                              {todayJobs.map(j => {
                                 const icon = j.type === 'PUTAWAY' ? <Archive size={10} /> :
                                    j.type === 'PICK' ? <PackageCheck size={10} /> :
                                       j.type === 'RECEIVE' ? <Truck size={10} /> :
                                          <BoxIcon size={10} />;
                                 const color = j.type === 'PUTAWAY' ? 'text-blue-500 bg-blue-500/15 border-blue-500/20' :
                                    j.type === 'PICK' ? 'text-purple-500 bg-purple-500/15 border-purple-500/20' :
                                       j.type === 'RECEIVE' ? 'text-emerald-500 bg-emerald-500/15 border-emerald-500/20' :
                                          'text-[var(--theme-text-secondary)] bg-[var(--theme-bg-card)] border-[var(--theme-border)]';
                                 return (
                                    <div key={j.type} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${color}`}>
                                       {icon}
                                       <span>{j.count}</span>
                                       <span className="opacity-70">{j.type.charAt(0) + j.type.slice(1).toLowerCase()}</span>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     )}
                  </div>


                  <div className="p-2">
                     <button
                        onClick={() => { navigate('/profile'); setIsUserMenuOpen(false); }}
                        className="w-full min-h-12 flex items-center gap-3 px-3.5 py-3 text-sm font-semibold text-[var(--theme-accent)] bg-[var(--theme-accent)]/10 hover:bg-[var(--theme-accent)]/15 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                     >
                        <User size={16} />
                        <span>My Profile</span>
                     </button>

                     {user.role === 'group_ceo' && (
                        <button
                           onClick={() => { navigate('/location-select'); setIsUserMenuOpen(false); }}
                           className="w-full min-h-12 flex items-center gap-3 px-3.5 py-3 text-sm font-medium text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                        >
                           <MapPin size={16} />
                           <span>Switch Location</span>
                        </button>
                     )}

                     {/* Market Instance Switcher (CEO Dual Market vs Staff Locked) */}
                     <div
                        className="mt-3 px-1 py-3 border-t border-[var(--theme-border)]"
                        onClick={(e) => e.stopPropagation()}
                     >
                        <div className="flex items-center justify-between mb-1.5">
                           <p className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest">
                              Market Instance
                           </p>
                           {isCeoUser ? (
                              isSwitchingMarket ? (
                                 <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 flex items-center gap-1 animate-pulse">
                                    <RefreshCw size={9} className="animate-spin" /> Reloading...
                                 </span>
                              ) : (
                                 <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                                    <ShieldCheck size={9} /> CEO Control
                                 </span>
                              )
                           ) : (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)] bg-[var(--theme-bg-card)] px-1.5 py-0.5 rounded border border-[var(--theme-border)] flex items-center gap-1">
                                 <Lock size={8} /> Branch Locked
                              </span>
                           )}
                        </div>

                        {isCeoUser ? (
                           <div className="grid grid-cols-2 gap-2 p-1.5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] max-h-40 overflow-y-auto custom-scrollbar">
                              {getRegisteredCountries().map((prof) => (
                                 <button
                                    key={prof.code}
                                    type="button"
                                    disabled={isSwitchingMarket}
                                    onClick={() => handleSwitchMarket(prof.code)}
                                    className={`flex min-h-11 items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                                       currentMarket === prof.code
                                          ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs border border-[var(--theme-border)]'
                                          : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                    } ${isSwitchingMarket ? 'opacity-50 cursor-wait' : ''}`}
                                    title={prof.name}
                                 >
                                    <span className="text-[10px] font-mono font-bold px-1 py-0.5 rounded bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)]">{prof.code}</span>
                                    <span className="truncate">{prof.name.split(' ')[0]}</span>
                                 </button>
                              ))}
                           </div>
                        ) : (
                           <div className="flex items-center justify-between bg-[var(--theme-bg-subtle)] rounded-lg px-2.5 py-1.5 border border-[var(--theme-border)]">
                              <span className="text-xs font-bold text-[var(--theme-text-primary)] flex items-center gap-1.5">
                                 <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] text-[var(--theme-text-primary)]">{currentMarketProfile.code}</span>
                                 <span className="truncate max-w-[150px]">{currentMarketProfile.name}</span>
                              </span>
                              <span className="text-[10px] font-mono text-[var(--theme-text-secondary)] font-semibold">
                                 {currentMarketProfile.currencySymbol}
                              </span>
                           </div>
                        )}
                     </div>

                     {/* Language Switcher */}
                     <div
                        className="mt-3 px-1 py-3 border-t border-[var(--theme-border)]"
                        onClick={(e) => e.stopPropagation()}
                     >
                        <div className="flex items-center justify-between mb-2">
                           <p className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest">Display Language</p>
                           <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-primary)]">
                              {currentMarketProfile.code}
                           </span>
                        </div>
                        {availableLanguages.length <= 1 ? (
                           <div className="flex items-center justify-between bg-[var(--theme-bg-subtle)] rounded-lg px-2.5 py-2 border border-[var(--theme-border)]">
                              <span className="text-xs font-bold text-[var(--theme-text-primary)] flex items-center gap-1.5">
                                 <Globe size={13} className="text-[var(--theme-text-muted)]" /> {currentMarketProfile.supportedLanguages[0]?.label || 'English'}
                              </span>
                              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                 Locked
                              </span>
                           </div>
                        ) : (
                           <div className="flex min-h-12 items-center gap-2.5 bg-[var(--theme-bg-subtle)] rounded-xl px-3 py-2 border border-[var(--theme-border)] hover:border-[var(--theme-border-focus)] transition-all">
                              <Globe size={16} className="text-[var(--theme-text-muted)]" />
                              <select
                                 value={language}
                                 onChange={(e) => setLanguage(e.target.value as any)}
                                 className="min-h-10 bg-transparent text-[var(--theme-text-primary)] text-sm outline-none border-none flex-1 cursor-pointer font-semibold"
                                 title="Select Language"
                              >
                                 {availableLanguages.map(lang => (
                                    <option key={lang.code} value={lang.code} className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">
                                       {lang.label} ({lang.nativeLabel})
                                    </option>
                                 ))}
                              </select>
                           </div>
                        )}
                     </div>
                      {/* Theme and Refresh shortcuts */}
                      <div className="mt-2 pt-2 border-t border-[var(--theme-border)] space-y-1">
                         <ThemeSelector variant="menu" className="w-full" />

                         {onRefresh && (
                            <button
                               type="button"
                               onClick={onRefresh}
                               className="w-full min-h-12 flex items-center gap-3 px-3.5 py-3 text-sm font-medium text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                            >
                               <RefreshCw size={16} />
                               <span>Reload Data</span>
                            </button>
                         )}
                      </div>
                   </div>

                  <div className="p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] border-t border-[var(--theme-border)] sm:pb-3">
                     <button
                        onClick={() => { logout(); setIsUserMenuOpen(false); }}
                        className="w-full min-h-12 flex items-center gap-3 px-3.5 py-3 text-sm font-semibold text-red-500 dark:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                     >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                     </button>
                  </div>
               </div>
         )}
      </div>
   );
}
