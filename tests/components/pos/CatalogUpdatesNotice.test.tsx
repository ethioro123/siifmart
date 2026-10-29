// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { pos } from '../../../utils/translations/pos';
import { posCommand } from '../../../utils/translations/posCommand';
import type { POSPriceHistoryState } from '../../../components/pos/shared/ProductPriceHistoryPanel';
import type { ProductPriceHistoryEntry } from '../../../services/product-price-history.service';
const state = vi.hoisted(() => ({ products: [] as Array<Record<string,unknown>>, site:{id:'store-1',country:'ET',name:'Central Store'},user:{id:'reviewer'},notify:vi.fn() }));
vi.mock('../../../hooks/usePOSCatalogReads',()=>({usePOSCatalogReads:()=>({reads:[],unreadCount:state.products.length,isLoading:false,error:null,saving:false,retry:vi.fn(),markPageRead:vi.fn()}),unreadCatalogProducts:(updates:unknown[])=>updates.length}));
vi.mock('../../../contexts/DataContext',()=>({useData:()=>({products:state.products,activeSite:state.site,addNotification:state.notify})}));
vi.mock('../../../contexts/CentralStore',()=>({useStore:()=>({user:state.user})}));
vi.mock('../../../contexts/LanguageContext',()=>({useLanguage:()=>({t:(key:string,params:Record<string,unknown>={})=>{
 const [namespace,name]=key.split('.'); const dictionary=namespace==='pos'?pos:posCommand;
 const raw = dictionary[name]?.en || key;
 return Object.entries(params).reduce((text: string,[k,value])=>text.replaceAll('{'+k+'}',String(value)), String(raw));
}})}));
import { CatalogUpdatesNotice } from '../../../components/pos/shared/CatalogUpdatesNotice';
const historyState = (patch: Partial<POSPriceHistoryState> = {}): POSPriceHistoryState => ({entries:[],unreviewedCount:0,isLoading:false,isLoadingMore:false,hasMore:false,error:null,retry:vi.fn(),loadMore:vi.fn().mockResolvedValue(undefined),markReviewed:vi.fn().mockResolvedValue(undefined),...patch});
const entry = (id='history-1'): ProductPriceHistoryEntry => ({id,product_id:'p1',site_id:'store-1',country_code:'ET',product_name:'Coffee',sku:'ET-COF',old_regular_price:100,new_regular_price:150,old_sale_price:null,new_sale_price:null,old_is_on_sale:false,new_is_on_sale:false,old_effective_price:100,new_effective_price:150,actor_id:null,actor_name:null,changed_at:new Date().toISOString(),reviewed_by_me:false});
beforeEach(()=>{vi.clearAllMocks();state.site={id:'store-1',country:'ET',name:'Central Store'};state.user={id:'reviewer'};state.products=[{id:'p1',siteId:'store-1',name:'Coffee',sku:'ET-COF',price:150,isOnSale:true,salePrice:125,createdAt:new Date().toISOString()}];});
afterEach(cleanup);
describe('unified POS product update review',()=>{
 it.each(['pos','posCommand'] as const)('opens catalog and full price history in one dialog from %s', namespace=>{
  render(<CatalogUpdatesNotice namespace={namespace} history={historyState()}/>);
  expect(screen.getAllByRole('button')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button',{name:'Product updates · Unread product updates · 1'}));
  expect(screen.getByText('Coffee')).toBeTruthy();expect(screen.getByText('ETB 125')).toBeTruthy();
  expect(screen.getByText(/Central Store/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Price history'}));
  expect(screen.getByRole('status').textContent).toContain('No price changes have been recorded');
 });
 it('keeps older price history accessible with no recent catalog activity',()=>{
  state.products=[];render(<CatalogUpdatesNotice namespace="pos" history={historyState({entries:[entry()]})}/>);
  fireEvent.click(screen.getByRole('button',{name:'Product updates · Unread product updates · 0'}));
  fireEvent.click(screen.getByRole('button',{name:'Price history'}));expect(screen.getByText('Coffee')).toBeTruthy();
 });
 it('closes review when the identity changes',()=>{
  const history=historyState();const view=render(<CatalogUpdatesNotice namespace="pos" history={history}/>);
  fireEvent.click(screen.getByRole('button',{name:'Product updates · Unread product updates · 1'}));
  state.user={id:'another'};view.rerender(<CatalogUpdatesNotice namespace="pos" history={history}/>);expect(screen.queryByText('Coffee')).toBeNull();
 });
 it('paginates catalog evidence and synchronizes active languages',()=>{
  state.products=Array.from({length:30},(_,i)=>({id:String(i),siteId:'store-1',name:'Coffee '+i,sku:'ET-'+i,createdAt:new Date().toISOString()}));
  render(<CatalogUpdatesNotice namespace="pos" history={historyState()}/>);fireEvent.click(screen.getByRole('button',{name:'Product updates · Unread product updates · 30'}));
  expect(screen.getAllByRole('listitem')).toHaveLength(25);fireEvent.click(screen.getByRole('button',{name:'Next'}));expect(screen.getAllByRole('listitem')).toHaveLength(5);
  for(const key of ['catalogUpdates','catalogUpdatesCount','catalogWindow','catalogScopeNote','catalogUpdateFilters','catalogAll','catalogNew','catalogPrice','catalogOther','catalogEmpty','catalogPrevious','catalogNext','catalogPage','catalogCurrentPrice','updatesPriceHistory','updatesPriceReviews','updatesRecentProducts','updatesCheckingPrices','updatesPriceUnavailable','catalogReadUnavailable','catalogReadLoading','catalogReadRetry','catalogReadSaving','catalogMarkPageRead','catalogReadFailed','catalogRead','catalogUnread'])for(const language of ['en','am','or'] as const){expect(pos[key][language]).toBeTruthy();expect(posCommand[key][language]).toBeTruthy();}
  for(const key of ['priceReviewsSaved','priceReviewsFailed','retryPriceHistory','priceActorUnknown','unreviewedUntilAcknowledged'])for(const language of ['en','am','or'] as const)expect(pos[key][language]).toBeTruthy();
 });
 it.each(['pos','posCommand'] as const)('opens pending price review directly and saves exact history IDs from %s', async namespace=>{
  const history=historyState({entries:[entry()],unreviewedCount:1});
  render(<CatalogUpdatesNotice namespace={namespace} history={history}/>);
  fireEvent.click(screen.getByRole('button',{name:'Product updates · Price changes to review · 1'}));
  expect(screen.getByText(/100/)).toBeTruthy();expect(screen.getByText(/150/)).toBeTruthy();
  expect(history.markReviewed).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Mark this page reviewed'}));
  await waitFor(()=>expect(history.markReviewed).toHaveBeenCalledWith(['history-1']));
  await waitFor(()=>expect(state.notify).toHaveBeenCalledWith('success','Marked 1 price changes as reviewed'));
 });
 it('shows review failure without claiming success',async()=>{
  const history=historyState({entries:[entry()],unreviewedCount:1,markReviewed:vi.fn().mockRejectedValue(new Error('save failed'))});
  render(<CatalogUpdatesNotice namespace="pos" history={history}/>);fireEvent.click(screen.getByRole('button',{name:/Product updates/}));
  fireEvent.click(screen.getByRole('button',{name:'Mark this page reviewed'}));
  await waitFor(()=>expect(state.notify).toHaveBeenCalledWith('alert','Could not save the price review. Try again.'));
  expect(state.notify).not.toHaveBeenCalledWith('success',expect.anything());expect(screen.getByText('New')).toBeTruthy();
 });
 it('does not expose a stale price count on failure and supports retry',()=>{
  const history=historyState({unreviewedCount:99,error:'network failed'});
  render(<CatalogUpdatesNotice namespace="posCommand" history={history}/>);fireEvent.click(screen.getByRole('button',{name:'Product updates · Price history unavailable'}));
  expect(screen.getByRole('alert')).toBeTruthy();expect(screen.queryByText('99')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Retry loading price history'}));expect(history.retry).toHaveBeenCalledOnce();
  expect(screen.queryByText(/No price changes have been recorded/)).toBeNull();
 });
 it('acknowledges only the visible price-history page and can load older evidence',async()=>{
  const history=historyState({entries:Array.from({length:30},(_,i)=>entry('h'+i)),unreviewedCount:30,hasMore:true});
  render(<CatalogUpdatesNotice namespace="pos" history={history}/>);fireEvent.click(screen.getByRole('button',{name:/Product updates/}));
  expect(screen.getAllByRole('listitem')).toHaveLength(25);fireEvent.click(screen.getByRole('button',{name:'Next'}));
  fireEvent.click(screen.getByRole('button',{name:'Mark this page reviewed'}));
  await waitFor(()=>expect(history.markReviewed).toHaveBeenCalledWith(['h25','h26','h27','h28','h29']));
  await waitFor(()=>expect((screen.getByRole('button',{name:'Load older changes'}) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole('button',{name:'Load older changes'}));expect(history.loadMore).toHaveBeenCalledOnce();
 });
});
