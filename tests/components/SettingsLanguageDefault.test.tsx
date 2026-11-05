// @vitest-environment jsdom
import React from 'react';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {LanguageProvider,useLanguage} from '../../contexts/LanguageContext';
const data=vi.hoisted(()=>({country:'ET',language:'en'}));
vi.mock('../../contexts/DataContext',()=>({useData:()=>({effectiveCountry:data.country,settings:{country:data.country,language:data.language}})}));
function Content(){const {language,setLanguage}=useLanguage();return <><span data-testid="language">{language}</span><button onClick={()=>setLanguage('en')}>Choose English</button></>;}
function Page(){return <LanguageProvider><Content/></LanguageProvider>;}
beforeEach(()=>{localStorage.clear();data.country='ET';data.language='en';});afterEach(cleanup);
describe('saved market language defaults',()=>{
 it('applies a loaded default without accidentally saving a personal override',async()=>{const view=render(<Page/>);data.language='am';view.rerender(<Page/>);await waitFor(()=>expect(screen.getByTestId('language').textContent).toBe('am'));expect(localStorage.getItem('siifmart_language')).toBeNull();data.country='KE';data.language='en';view.rerender(<Page/>);await waitFor(()=>expect(screen.getByTestId('language').textContent).toBe('en'));expect(localStorage.getItem('siifmart_language')).toBeNull();});
 it('preserves an explicitly chosen personal language',async()=>{const view=render(<Page/>);fireEvent.click(screen.getByRole('button',{name:'Choose English'}));data.language='am';view.rerender(<Page/>);await waitFor(()=>expect(localStorage.getItem('siifmart_language')).toBe('en'));expect(screen.getByTestId('language').textContent).toBe('en');});
});
