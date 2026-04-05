import React from 'react';
import { Camera, XCircle, CheckCircle } from 'lucide-react';
import { formatDateTime } from '../../utils/formatting';

interface PhotoApprovalListProps {
   photoRequests: any[];
   onApprove: (req: any) => void;
   onReject: (req: any) => void;
}

export default function PhotoApprovalList({ photoRequests, onApprove, onReject }: PhotoApprovalListProps) {
   if (photoRequests.length === 0) return null;

   return (
      <div className="bg-cyber-gray border border-yellow-500/30 rounded-2xl p-6 mb-6 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500/50"></div>
         <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Camera className="text-yellow-400" size={20} />
            Pending Photo Approvals
            <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full border border-yellow-500/30">
               {photoRequests.length}
            </span>
         </h3>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photoRequests.map((req) => (
               <div key={req.id} className="bg-black/40 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                  <div className="relative group">
                     <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-yellow-500/50">
                        <img src={req.newUrl} alt="New" className="w-full h-full object-cover" />
                     </div>
                     <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full pointer-events-none">
                        <span className="text-xs text-white font-bold">New</span>
                     </div>
                  </div>

                  <div className="flex-1 min-w-0">
                     <p className="text-white font-bold truncate">{req.userName}</p>
                     <p className="text-xs text-gray-400">Requested {formatDateTime(req.timestamp)}</p>
                  </div>

                  <div className="flex gap-2">
                     <button
                        onClick={() => onReject(req)}
                        className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                        title="Reject"
                     >
                        <XCircle size={20} />
                     </button>
                     <button
                        onClick={() => onApprove(req)}
                        className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 hover:text-green-300 rounded-lg transition-colors border border-green-500/20 hover:border-green-500/40"
                        title="Approve"
                     >
                        <CheckCircle size={20} />
                     </button>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
}
