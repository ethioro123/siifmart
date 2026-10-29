// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { pos } from '../../../utils/translations/pos';
import { posCommand } from '../../../utils/translations/posCommand';
const state = vi.hoisted(() => ({ products: [] as Array<Record<string,unknown>>, site:{id:'store-1',country:'ET',name:'Central Store'},user:{id:'reviewer'} }));
vi.mock('../../../contexts/DataContext',()=>({useData:()=>({products:state.products,activeSite:state.site})}));
vi.mock('../../../contexts/CentralStore',()=>({useStore:()=>({user:state.user})}));
vi.mock('../../../contexts/LanguageContext',()=>({useLanguage:()=>({t:(key:string,params:Record<string,unknown>={})=>{
 const [namespace,name]=key.split('.'); const dictionary=namespace==='pos'?pos:posCommand;
 const raw = dictionary[name]?.en || key;
 return Object.entries(params).reduce((text: string,[k,value])=>text.replaceAll('{'+k+'}',String(value)), String(raw));
}})}));
import { CatalogUpdatesNotice } from '../../../components/pos/shared/CatalogUpdatesNotice';
beforeEach(()=>{state.site={id:'store-1',country:'ET',name:'Central Store'};state.user={id:'reviewer'};state.products=[{id:'p1',siteId:'store-1',name:'Coffee',sku:'ET-COF',price:150,isOnSale:true,salePrice:125,createdAt:new Date().toISOString()}];});
afterEach(cleanup);
describe('POS catalog update entry and review',()=>{
 it.each(['pos','posCommand'] as const)('opens a clear review from %s with classified products', namespace=>{
  render(<CatalogUpdatesNotice namespace={namespace}/>);
  fireEvent.click(screen.getByRole('button',{name:'Review product updates · 1'}));
  expect(screen.getByText('Coffee')).toBeTruthy();expect(screen.getByText('ETB 125')).toBeTruthy();expect(screen.getByText(/Central Store/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Price updated 0'}));
  expect(screen.getByRole('status').textContent).toContain('No recent updates');
 });
 it('hides the entry when there is no scoped activity',()=>{
  state.products=[];render(<CatalogUpdatesNotice namespace="pos"/>);expect(screen.queryByRole('button')).toBeNull();
 });
 it('closes review when the identity or site changes',()=>{
  const view=render(<CatalogUpdatesNotice namespace="pos"/>);fireEvent.click(screen.getByRole('button',{name:'Review product updates · 1'}));
  state.user={id:'another'};view.rerender(<CatalogUpdatesNotice namespace="pos"/>);expect(screen.queryByText('Coffee')).toBeNull();
 });
 it('paginates evidence and preserves translations across all active languages',()=>{
  state.products=Array.from({length:30},(_,i)=>({id:String(i),siteId:'store-1',name:'Coffee '+i,sku:'ET-'+i,createdAt:new Date().toISOString()}));
  render(<CatalogUpdatesNotice namespace="pos"/>);fireEvent.click(screen.getByRole('button',{name:'Review product updates · 30'}));
  expect(screen.getAllByRole('listitem')).toHaveLength(25);fireEvent.click(screen.getByRole('button',{name:'Next'}));expect(screen.getAllByRole('listitem')).toHaveLength(5);
  for(const key of ['catalogUpdates','catalogUpdatesCount','catalogWindow','catalogScopeNote','catalogUpdateFilters','catalogAll','catalogNew','catalogPrice','catalogOther','catalogEmpty','catalogPrevious','catalogNext','catalogPage','catalogCurrentPrice']){for(const language of ['en','am','or'] as const){expect(pos[key][language]).toBeTruthy();expect(posCommand[key][language]).toBeTruthy();}}
 });
});
