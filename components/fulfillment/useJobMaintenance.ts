import { useCallback } from 'react';
import {
    WMSJob, JobItem, PurchaseOrder, Product, Site, User
} from '../../types';
import {
    wmsJobsService
} from '../../services/supabase.service';
import {fulfillmentMaintenanceService} from '../../services/fulfillment-maintenance.service';
import {useLanguage} from '../../contexts/LanguageContext';
import { QueryClient } from '@tanstack/react-query';
import { logger } from '../../utils/logger';

interface UseJobMaintenanceDeps {
    jobs: WMSJob[];
    orders: PurchaseOrder[];
    products: Product[];
    activeSite: Site | null;
    user: User | null;
    setJobs: React.Dispatch<React.SetStateAction<WMSJob[]>>;
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
    refreshJobs: () => void;
    queryClient: QueryClient;
}

export const useJobMaintenance = (deps: UseJobMaintenanceDeps) => {
 const {activeSite,setJobs,addNotification,refreshJobs}=deps;const {t,country}=useLanguage();
 const maintain=useCallback(async(action:'reset'|'cancel'|'reconcile',id?:string)=>{
  try{
   const count=await fulfillmentMaintenanceService.run(activeSite?.id||'',country,action,id);
   refreshJobs();
   addNotification('success',t(action==='reconcile'?'warehouse.maintenanceSaved':action==='reset'?'warehouse.maintenanceResetSaved':'warehouse.maintenanceCancelled',{count}));
  }catch(error){logger.error('useJobMaintenance','Maintenance failed',error);addNotification('alert',t('warehouse.maintenanceFailed'));throw error;}
 },[activeSite?.id,country,refreshJobs,addNotification,t]);
 const resetJob=useCallback((id:string)=>maintain('reset',id),[maintain]);
 const deleteJob=useCallback((id:string)=>maintain('cancel',id),[maintain]);
 const fixBrokenJobs=useCallback(()=>maintain('reconcile'),[maintain]);
    const createPutawayJob = useCallback(async (product: Product, quantity: number, user: string, source: string = 'Inventory') => {
        try {
            if (quantity <= 0) {
                logger.debug('useJobMaintenance', '📦 Skipping putaway job - no stock to put away');
                return undefined;
            }

            const targetSiteId = product.siteId || product.site_id || activeSite?.id;
            if (!targetSiteId) {
                logger.error('useJobMaintenance', '❌ Cannot create putaway job - no site ID', new Error('No site ID'));
                throw new Error('Facility required');
            }

            const lineItem = {
                productId: product.id,
                name: product.name,
                sku: product.sku || 'UNKNOWN',
                image: product.image || '',
                expectedQty: quantity,
                pickedQty: 0,
                status: 'Pending' as JobItem['status']
            };

            logger.info('useJobMaintenance', 'Creating PUTAWAY job for Inventory product', {
                productName: product.name,
                quantity,
                siteId: targetSiteId,
                source
            });

            try {
                const createdJob = await wmsJobsService.create({
                    siteId: targetSiteId,
                    site_id: targetSiteId,
                    type: 'PUTAWAY',
                    priority: 'Normal',
                    status: 'Pending',
                    items: 1,
                    lineItems: [lineItem],
                    location: product.location || 'Receiving Dock',
                    orderRef: `INV-${product.id}`,
                    createdAt: new Date().toISOString(),
                    requestedBy: user
                });
                logger.debug('useJobMaintenance', `✅ Inventory PUTAWAY job created: ${createdJob.id}`);
                setJobs(prev => [createdJob, ...prev]);
                return createdJob;
            } catch (error) {
                logger.error('useJobMaintenance', 'Putaway creation failed', error);
                throw error;
            }
        } catch (error) {
            logger.error('useJobMaintenance', 'Putaway creation failed', error);
            throw error;
        }
    }, [activeSite, setJobs]);


 return {resetJob,deleteJob,fixBrokenJobs,createPutawayJob};
};
