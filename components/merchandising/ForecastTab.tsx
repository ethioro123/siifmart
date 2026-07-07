import React from 'react';
import { BrainCircuit, Leaf, ShoppingCart, Zap, Package } from 'lucide-react';
import {
   ComposedChart, Line, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { useMerchandising } from './MerchandisingContext';

const DEMAND_DATA = [
   { period: 'Week 1', actual: 120, predicted: 125, confidence: 115 },
   { period: 'Week 2', actual: 135, predicted: 130, confidence: 120 },
   { period: 'Week 3', actual: 145, predicted: 140, confidence: 130 },
   { period: 'Week 4', actual: 150, predicted: 155, confidence: 145 },
   { period: 'Week 5', actual: null, predicted: 170, confidence: 160 },
   { period: 'Week 6', actual: null, predicted: 190, confidence: 180 },
   { period: 'Week 7', actual: null, predicted: 210, confidence: 200 },
   { period: 'Week 8', actual: null, predicted: 180, confidence: 170 },
];

export const ForecastTab: React.FC = () => {
   const { products, addNotification } = useMerchandising();

   return (
      <div className="space-y-6 animate-in fade-in">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-panel p-6">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-[#1E3F27] dark:text-white flex items-center gap-2">
                     <BrainCircuit size={18} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> AI Demand Prediction
                  </h3>
                  <div className="flex items-center gap-2 text-xs bg-stone-100 dark:bg-black/30 border border-[#E2DCCE] dark:border-emerald-950/20 px-3 py-1.5 rounded-xl text-stone-600 dark:text-stone-400">
                     <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span> Historical
                     <span className="w-2.5 h-2.5 bg-purple-500 rounded-full ml-2"></span> AI Forecast
                  </div>
               </div>
               <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                     <ComposedChart data={DEMAND_DATA}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                        <XAxis dataKey="period" stroke="currentColor" className="text-stone-400 dark:text-stone-600" fontSize={12} />
                        <YAxis stroke="currentColor" className="text-stone-400 dark:text-stone-600" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }} />
                        <Line type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} name="Actual Sales" />
                        <Line type="monotone" dataKey="predicted" stroke="#9333ea" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Forecast" />
                        <Area type="monotone" dataKey="confidence" stroke="none" fill="#9333ea" fillOpacity={0.08} />
                     </ComposedChart>
                  </ResponsiveContainer>
               </div>
            </div>

            <div className="glass-panel p-6 flex flex-col">
               <h3 className="font-bold text-[#1E3F27] dark:text-white mb-4 flex items-center gap-2">
                  <Leaf size={18} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> Seasonality Insights
               </h3>
               <div className="space-y-4 flex-1">
                  <div className="p-4 bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/20 dark:border-blue-500/10 rounded-2xl">
                     <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase mb-1">Upcoming Pattern</p>
                     <p className="text-[#1E3F27] dark:text-white font-bold">Winter Peak Season</p>
                     <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Historical data indicates a 25% surge in 'Beverages' demand starting next week.</p>
                  </div>
                  <div className="p-4 bg-purple-500/10 dark:bg-purple-500/5 border border-purple-500/20 dark:border-purple-500/10 rounded-2xl">
                     <p className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase mb-1">Category Trend</p>
                     <p className="text-[#1E3F27] dark:text-white font-bold">Electronics Dip</p>
                     <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Post-holiday slump expected. Reduce inventory depth by 15%.</p>
                  </div>
               </div>
            </div>
         </div>

         <div className="glass-panel p-6">
            <h3 className="font-bold text-[#1E3F27] dark:text-white mb-6 flex items-center gap-2">
               <ShoppingCart size={18} className="text-yellow-600 dark:text-yellow-400" /> Recommended Buy Orders
            </h3>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5 border-b border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] text-stone-600 dark:text-stone-400 text-xs uppercase font-bold">
                     <tr>
                        <th className="p-3 rounded-l-xl">Product</th>
                        <th className="p-3 text-center">Current Stock</th>
                        <th className="p-3 text-center">Predicted Demand (30d)</th>
                        <th className="p-3 text-center">Suggested Buy</th>
                        <th className="p-3">AI Reasoning</th>
                        <th className="p-3 rounded-r-xl text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2DCCE]/40 dark:divide-[#A9CBA2]/[0.04]">
                     {products.filter(p => p.stock < 100).slice(0, 5).map((p, idx) => {
                        const predictedDemand = Math.floor(p.stock * 1.5 + 50);
                        const suggestedBuy = predictedDemand - p.stock;
                        return (
                           <tr key={p.id} className="hover:bg-stone-50/50 dark:hover:bg-white/[0.02] transition-colors">
                              <td className="p-4 flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-black/30 border border-[#E2DCCE] dark:border-emerald-950/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {p.image && !p.image.includes('placeholder.com') ? (
                                       <img
                                          src={p.image}
                                          className="w-full h-full object-cover"
                                          alt=""
                                          onError={(e) => {
                                             e.currentTarget.style.display = 'none';
                                             (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-stone-400"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                          }}
                                       />
                                    ) : (
                                       <Package size={14} className="text-stone-400" />
                                    )}
                                 </div>
                                 <span className="font-bold text-[#1E3F27] dark:text-white">{p.name}</span>
                              </td>
                              <td className="p-4 text-center text-stone-500 dark:text-stone-400">{p.stock}</td>
                              <td className="p-4 text-center text-[#1E3F27] dark:text-white font-semibold">{predictedDemand}</td>
                              <td className="p-4 text-center">
                                 <span className="bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 dark:border-green-500/10 px-3 py-1 rounded-xl font-bold">
                                    +{suggestedBuy}
                                 </span>
                              </td>
                              <td className="p-4 text-sm text-stone-500 dark:text-stone-400 flex items-center gap-2">
                                 <Zap size={14} className="text-yellow-600 dark:text-yellow-400" /> {idx % 2 === 0 ? 'High Velocity detected' : 'Seasonal Low Stock'}
                              </td>
                              <td className="p-4 text-right">
                                 <button
                                    onClick={() => addNotification('success', `PO Draft created for ${p.name}`)}
                                    className="woody-btn-primary text-xs py-2 px-3 rounded-xl"
                                 >
                                    Create PO
                                 </button>
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
};
