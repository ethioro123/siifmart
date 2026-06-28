import React from 'react';
import { ChevronDown, Trophy, TrendingUp, Zap, Crown, ClipboardList, Archive, PackageCheck, Truck, BoxIcon, User, MapPin, Globe, LogOut } from 'lucide-react';
import { formatRole } from '../../utils/formatting';

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
   dropdownRef
}: UserMenuProps) {
   if (!user) return null;

   return (
      <div className="relative" ref={dropdownRef}>
         <div
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={`flex items-center gap-1.5 sm:gap-2 md:gap-3 px-1.5 sm:px-2 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full border transition-all duration-300 cursor-pointer ${isUserMenuOpen
               ? 'bg-[#2C5E3B]/10 dark:bg-white/10 border-[#2C5E3B]/40 dark:border-[#A9CBA2]/30'
               : 'bg-white/60 dark:bg-white/5 border-[#E2DCCE] dark:border-white/10 hover:border-[#2C5E3B]/40 dark:hover:border-[#A9CBA2]/30'
            }`}
         >
            <div className="relative">
               <div className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-[#2C5E3B] to-[#4A855A] dark:from-[#A9CBA2] dark:to-[#4A855A] flex items-center justify-center text-white dark:text-[#1E3B24] font-black text-xs md:text-sm shadow-lg transition-transform overflow-hidden border border-white/20">
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
               <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 border-2 border-white dark:border-[#1E2822] rounded-full animate-pulse"></div>
            </div>

            <div className="hidden md:flex flex-col">
               <span className="text-sm font-bold text-[#1E3F27] dark:text-white leading-none">{user.name}</span>
               <span className="text-[10px] font-mono text-stone-500 dark:text-gray-400 uppercase tracking-wider mt-0.5 leading-none">{formatRole(user.role)}</span>
            </div>

            <ChevronDown size={14} className={`hidden md:block text-stone-400 dark:text-gray-500 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
         </div>

         {/* Dropdown Menu */}
         {isUserMenuOpen && (
            <div
               className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1E2822] border border-[#E2DCCE] dark:border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[150] animate-in fade-in slide-in-from-top-2 overflow-hidden backdrop-blur-xl"
               onClick={() => setIsUserMenuOpen(false)}
            >
                  <div className="p-4 border-b border-[#E2DCCE] dark:border-white/5 bg-stone-50/60 dark:bg-black/20" onClick={(e) => e.stopPropagation()}>
                     <p className="text-xs font-bold text-stone-400 dark:text-gray-400 uppercase tracking-wider mb-1">Signed in as</p>
                     <p className="text-sm font-bold text-[#1E3F27] dark:text-white truncate">{user.name}</p>
                     <p className="text-[10px] font-mono text-[#2C5E3B] dark:text-[#A9CBA2] uppercase mb-1">{formatRole(user.role)}</p>
                     
                     {user.loginLocation && (
                        <div className="flex items-center gap-1.5 mb-3 text-[9px] font-medium text-stone-500 dark:text-gray-400/80 bg-stone-100/50 dark:bg-white/5 px-2 py-1 rounded-md border border-[#E2DCCE]/50 dark:border-white/5 w-fit">
                           <MapPin size={9} className="text-[#2C5E3B] dark:text-[#A9CBA2] shrink-0" />
                           <span className="truncate max-w-[200px]" title={user.loginLocation}>{user.loginLocation}</span>
                        </div>
                     )}

                     {/* Performance Highlights */}
                     {currentUserPoints && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                           <div className="bg-stone-100/60 dark:bg-white/5 rounded-lg p-2 border border-[#E2DCCE] dark:border-white/5">
                              <div className="flex items-center gap-1.5 mb-1">
                                 <Trophy size={10} className="text-yellow-500 dark:text-yellow-400" />
                                 <span className="text-[9px] font-bold text-stone-500 dark:text-gray-400 uppercase">Points</span>
                              </div>
                              <p className="text-sm font-black text-[#1E3F27] dark:text-white">{currentUserPoints.totalPoints?.toLocaleString() || 0}</p>
                           </div>
                           <div className="bg-stone-100/60 dark:bg-white/5 rounded-lg p-2 border border-[#E2DCCE] dark:border-white/5">
                              <div className="flex items-center gap-1.5 mb-1">
                                 <TrendingUp size={10} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                 <span className="text-[9px] font-bold text-stone-500 dark:text-gray-400 uppercase">Rank</span>
                              </div>
                              <p className="text-sm font-black text-[#1E3F27] dark:text-white">#{currentUserPoints.rank || '-'}</p>
                           </div>
                           <div className="col-span-2 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/5 rounded-lg p-2 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                 <div className="w-6 h-6 rounded-full bg-[#2C5E3B]/20 dark:bg-[#A9CBA2]/10 flex items-center justify-center text-[#2C5E3B] dark:text-[#A9CBA2]">
                                    <Zap size={12} fill="currentColor" />
                                 </div>
                                 <div>
                                    <p className="text-[9px] font-bold text-[#2C5E3B] dark:text-[#A9CBA2] uppercase leading-none">Level {currentUserPoints.level || 1}</p>
                                    <p className="text-[10px] font-black text-[#1E3F27] dark:text-white leading-tight">{currentUserPoints.levelTitle || 'Rookie'}</p>
                                 </div>
                              </div>
                              <Crown size={14} className="text-yellow-500 dark:text-yellow-400 opacity-50" />
                           </div>
                        </div>
                     )}

                     {/* Today's Completed Jobs Card */}
                     {todayJobsTotal > 0 && (
                        <div className="mt-3 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent rounded-xl p-3 border border-blue-500/15">
                           <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                 <ClipboardList size={11} className="text-blue-400" />
                                 <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Today's Missions</span>
                              </div>
                              <span className="text-[10px] font-mono font-black text-blue-900 dark:text-white bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/20">
                                 {todayJobsTotal}
                              </span>
                           </div>
                           <div className="flex flex-wrap gap-1.5">
                              {todayJobs.map(j => {
                                 const icon = j.type === 'PUTAWAY' ? <Archive size={10} /> :
                                    j.type === 'PICK' ? <PackageCheck size={10} /> :
                                       j.type === 'RECEIVE' ? <Truck size={10} /> :
                                          <BoxIcon size={10} />;
                                 const color = j.type === 'PUTAWAY' ? 'text-blue-700 dark:text-blue-300 bg-blue-500/15 border-blue-500/20' :
                                    j.type === 'PICK' ? 'text-purple-700 dark:text-purple-300 bg-purple-500/15 border-purple-500/20' :
                                       j.type === 'RECEIVE' ? 'text-green-700 dark:text-green-300 bg-green-500/15 border-green-500/20' :
                                          'text-stone-600 dark:text-gray-300 bg-white/5 border-white/10';
                                 return (
                                    <div key={j.type} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold ${color}`}>
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
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-stone-600 dark:text-gray-300 hover:text-[#2C5E3B] dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                     >
                        <User size={16} />
                        <span>My Profile</span>
                     </button>

                     {user.role === 'super_admin' && (
                        <button
                           onClick={() => { navigate('/location-select'); setIsUserMenuOpen(false); }}
                           className="w-full flex items-center gap-3 px-3 py-2 text-sm text-stone-600 dark:text-gray-300 hover:text-[#2C5E3B] dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                        >
                           <MapPin size={16} />
                           <span>Switch Location</span>
                        </button>
                     )}

                     {/* Language Switcher */}
                     <div
                        className="mt-2 px-3 py-2 border-t border-[#E2DCCE] dark:border-white/5"
                        onClick={(e) => e.stopPropagation()}
                     >
                        <p className="text-[10px] font-bold text-stone-400 dark:text-gray-500 uppercase tracking-widest mb-2">Display Language</p>
                        <div className="flex items-center gap-2 bg-stone-100/60 dark:bg-white/5 rounded-lg p-1.5 border border-[#E2DCCE] dark:border-white/5 hover:border-[#2C5E3B]/30 dark:hover:border-[#A9CBA2]/30 transition-all">
                           <Globe size={14} className="text-stone-400 dark:text-gray-400" />
                           <select
                              value={language}
                              onChange={(e) => setLanguage(e.target.value as any)}
                              className="bg-transparent text-[#1E3F27] dark:text-white text-xs outline-none border-none flex-1 cursor-pointer font-bold"
                              title="Select Language"
                           >
                              <option value="en" className="bg-white dark:bg-gray-800">English</option>
                              <option value="am" className="bg-white dark:bg-gray-800">Amharic (አማርኛ)</option>
                              <option value="or" className="bg-white dark:bg-gray-800">Oromo (Afaan Oromoo)</option>
                           </select>
                        </div>
                     </div>
                  </div>

                  <div className="p-2 border-t border-[#E2DCCE] dark:border-white/5">
                     <button
                        onClick={() => { logout(); setIsUserMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
