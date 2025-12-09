import React, { useEffect, useRef, useState } from 'react';
import { Employee, UserRole } from '../types';
import QRCode from 'qrcode';
import { X, Printer, Shield, MapPin, Building, CreditCard } from 'lucide-react';
import Logo from './Logo';

interface EmployeeIDCardProps {
    employee: Employee;
    siteCode?: string;
    onClose: () => void;
}

const ROLE_COLORS: Record<UserRole, string> = {
    super_admin: '#FACC15', // yellow-400
    admin: '#C084FC',       // purple-400
    hr: '#F472B6',          // pink-400
    finance_manager: '#34D399', // emerald-400
    procurement_manager: '#818CF8', // indigo-400
    manager: '#60A5FA',     // blue-400
    it_support: '#22D3EE',  // cyan-400
    cs_manager: '#38BDF8',  // sky-400
    store_supervisor: '#93C5FD', // blue-300
    inventory_specialist: '#FBBF24', // amber-400
    pos: '#4ADE80',         // green-400
    picker: '#FB923C',      // orange-400
    driver: '#2DD4BF',      // teal-400
    warehouse_manager: '#A78BFA', // violet-400
    dispatcher: '#E879F9',  // fuchsia-400
    auditor: '#FB7185',     // rose-400
};

export default function EmployeeIDCard({ employee, siteCode, onClose }: EmployeeIDCardProps) {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Generate QR Code
        const generateQR = async () => {
            try {
                const url = await QRCode.toDataURL(JSON.stringify({
                    id: employee.id,
                    name: employee.name,
                    role: employee.role,
                    site: employee.siteId
                }), {
                    width: 120,
                    margin: 1,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });
                setQrCodeUrl(url);
            } catch (err) {
                console.error('Error generating QR code', err);
            }
        };
        generateQR();
    }, [employee]);

    const handlePrint = () => {
        const printContent = cardRef.current;
        if (!printContent) return;

        const windowUrl = 'about:blank';
        const uniqueName = new Date().getTime();
        const windowName = 'Print' + uniqueName;
        const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

        if (printWindow) {
            printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print ID Card - ${employee.name}</title>
            <style>
              @page { size: auto; margin: 0mm; }
              body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #fff; -webkit-print-color-adjust: exact; }
              .card-container { transform: scale(1); transform-origin: top left; }
            </style>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
               /* Custom styles to mimic the React component's look exactly */
               .bg-cyber-black { background-color: #000000; }
               .bg-cyber-dark { background-color: #111111; }
               .border-white-10 { border-color: rgba(255, 255, 255, 0.1); }
               .text-cyber-primary { color: #00ff9d; }
            </style>
          </head>
          <body>
            <div class="card-container">
              ${printContent.innerHTML}
            </div>
          </body>
        </html>
      `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };

    const roleColor = ROLE_COLORS[employee.role] || '#00ff9d';

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-cyber-dark border border-white/10 rounded-2xl p-6 max-w-4xl w-full flex flex-col md:flex-row gap-8 items-center md:items-start relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                {/* Left Side: Controls & Info */}
                <div className="flex-1 space-y-6 w-full">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                            <CreditCard className="text-cyber-primary" />
                            Employee ID Generator
                        </h2>
                        <p className="text-gray-400">Generate and print official identification cards for staff members.</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Employee Name:</span>
                            <span className="text-white font-medium">{employee.name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Role:</span>
                            <span className="text-white font-medium capitalize">{employee.role.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Employee ID:</span>
                            <span className="text-cyan-400 font-mono text-xs font-bold">{employee.code || 'NOT ASSIGNED'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Site ID:</span>
                            <span className="text-white font-medium">{siteCode || 'Unknown'}</span>
                        </div>
                    </div>

                    <button
                        onClick={handlePrint}
                        className="w-full bg-cyber-primary text-black font-bold py-3 rounded-xl hover:bg-cyber-primary/90 transition-all flex items-center justify-center gap-2"
                    >
                        <Printer size={20} />
                        Print ID Card
                    </button>
                </div>

                {/* Right Side: The Card Preview */}
                <div className="flex-1 flex justify-center items-center bg-black/20 p-8 rounded-2xl border border-white/5 w-full">

                    {/* THE CARD ITSELF - CR80 Size (85.6mm x 54mm) -> Scaled up for display */}
                    {/* Aspect Ratio: 1.586 */}
                    <div
                        ref={cardRef}
                        className="relative w-[400px] h-[252px] bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
                        style={{
                            boxShadow: `0 0 40px ${roleColor}20`,
                            borderColor: `${roleColor}40`
                        }}
                    >
                        {/* Background Elements */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                        <div
                            className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/3"
                            style={{ backgroundColor: roleColor }}
                        ></div>
                        <div
                            className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-10 translate-y-1/3 -translate-x-1/3"
                            style={{ backgroundColor: roleColor }}
                        ></div>

                        {/* Header */}
                        <div className="relative z-10 flex justify-between items-start p-5 pb-2">
                            <div className="flex items-center gap-2">
                                <Logo size={28} />
                                <div>
                                    <h1 className="text-white font-bold text-lg leading-none tracking-wide">SIIFMART</h1>
                                    <p className="text-[8px] text-gray-400 tracking-widest uppercase">Official Staff ID</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: roleColor }}></div>
                                    <span className="text-[8px] font-bold uppercase tracking-wider text-white">Active</span>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="relative z-10 flex-1 flex px-5 gap-4 items-center">
                            {/* Photo */}
                            <div className="relative group">
                                <div
                                    className="absolute -inset-0.5 rounded-lg blur opacity-50"
                                    style={{ backgroundColor: roleColor }}
                                ></div>
                                <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-white/20 bg-gray-800">
                                    <img
                                        src={employee.avatar}
                                        alt={employee.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-bold text-white truncate leading-tight">{employee.name}</h2>
                                <p
                                    className="text-xs font-bold uppercase tracking-wider mb-2 truncate"
                                    style={{ color: roleColor }}
                                >
                                    {employee.role.replace(/_/g, ' ')}
                                </p>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-white">
                                        <Shield size={10} />
                                        <span className="text-[11px] font-mono leading-tight break-all font-bold">{employee.code || 'NO-CODE'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-400">
                                        <Building size={10} />
                                        <span className="text-[9px] truncate">{employee.department || 'Operations'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-400">
                                        <MapPin size={10} />
                                        <span className="text-[9px] truncate">Site: {siteCode || 'Unknown'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* QR Code */}
                            <div className="bg-white p-1 rounded-md shrink-0">
                                {qrCodeUrl && <img src={qrCodeUrl} alt="QR" className="w-14 h-14" />}
                            </div>
                        </div>

                        {/* Footer / Barcode Strip */}
                        <div className="relative z-10 mt-auto bg-white/5 backdrop-blur-sm border-t border-white/5 py-2 px-5 flex justify-between items-center">
                            <div className="text-[7px] text-gray-500 uppercase tracking-widest">
                                Authorized Personnel Only • Property of Siifmart
                            </div>
                            <div className="flex gap-1">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="w-0.5 h-3 bg-gray-600/50"></div>
                                ))}
                            </div>
                        </div>

                        {/* Holographic Overlay Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-30 pointer-events-none"></div>
                    </div>

                </div>
            </div>
        </div>
    );
}
