import React from 'react';
import { usePOS } from '../POSContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import Modal from '../../Modal';
import { CURRENCY_SYMBOL } from '../../../constants';
import { Printer, Mail, CheckCircle } from 'lucide-react';

export const PrintReceiptModal: React.FC = () => {
    const { t } = useLanguage();
    const {
        isReceiptModalOpen,
        setIsReceiptModalOpen,
        lastSale,
        handlePrintReceipt,
        handleEmailReceipt,
    } = usePOS();

    return (
        <Modal
            isOpen={isReceiptModalOpen}
            onClose={() => setIsReceiptModalOpen(false)}
            title="Payment Success"
            size="md"
        >
            <div className="flex flex-col items-center py-8 animate-in zoom-in-95 duration-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-cyber-primary/10 via-transparent to-transparent pointer-events-none" />

                <div className="w-24 h-24 rounded-full bg-cyber-primary/10 border border-cyber-primary/30 text-cyber-primary flex items-center justify-center mb-8 relative group">
                    <div className="absolute inset-0 rounded-full bg-cyber-primary/20 animate-ping opacity-20" />
                    <div className="absolute inset-0 rounded-full bg-cyber-primary/40 blur-xl opacity-20" />
                    <CheckCircle size={40} className="relative z-10 animate-in zoom-in duration-500 delay-200" />
                </div>

                <h3 className="text-3xl font-black text-white tracking-tighter mb-2">{t('pos.paymentSuccess')}</h3>
                <p className="text-gray-500 text-sm font-medium mb-10 uppercase tracking-[0.2em]">{t('pos.transactionVerified')}</p>

                <div className="w-full space-y-4 mb-10 px-6">
                    <div className="flex justify-between items-center py-3 border-b border-white/5">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('pos.totalPaid')}</span>
                        <span className="text-xl font-black text-cyber-primary tabular-nums">{CURRENCY_SYMBOL} {(lastSale?.total || 0).toLocaleString()}</span>
                    </div>
                    {lastSale && lastSale.method === 'Cash' && (
                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('pos.changeDue')}</span>
                            <span className="text-xl font-black text-white tabular-nums">{CURRENCY_SYMBOL} {lastSale.change?.toLocaleString()}</span>
                        </div>
                    )}
                </div>

                <div className="w-full grid grid-cols-2 gap-4 px-6">
                    <button
                        onClick={() => {
                            handlePrintReceipt();
                            setIsReceiptModalOpen(false);
                        }}
                        className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 hover:bg-white/10 rounded-[2.5rem] border border-white/10 transition-all group active:scale-95"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-cyber-primary/10 flex items-center justify-center text-cyber-primary group-hover:bg-cyber-primary/20 transition-all">
                            <Printer size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('pos.printReceipt')}</span>
                    </button>
                    <button
                        onClick={handleEmailReceipt}
                        className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 hover:bg-white/10 rounded-[2.5rem] border border-white/10 transition-all group active:scale-95"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-all">
                            <Mail size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('pos.digitalCopy')}</span>
                    </button>
                </div>

                <button
                    onClick={() => setIsReceiptModalOpen(false)}
                    className="mt-10 p-4 w-full bg-cyber-primary text-black font-black uppercase tracking-[0.3em] text-xs rounded-[1.5rem] hover:bg-cyber-primary/90 transition-all active:scale-[0.98]"
                >
                    {t('pos.newOrder')}
                </button>
            </div>
        </Modal>
    );
};
