// @vitest-environment jsdom
import {act,renderHook} from '@testing-library/react';
import {describe,expect,it} from 'vitest';
import {useSettingsDraft} from '../../hooks/useSettingsDraft';
describe('settings drafts',()=>{
 it('keeps local edits through a background refresh',()=>{const {result,rerender}=renderHook(({source})=>useSettingsDraft(source),{initialProps:{source:'saved'}});act(()=>result.current.setValue('draft'));rerender({source:'server refresh'});expect(result.current.value).toBe('draft');expect(result.current.dirty).toBe(true);});
 it('updates clean forms and accepts confirmed normalization',()=>{const {result,rerender}=renderHook(({source})=>useSettingsDraft(source),{initialProps:{source:'saved'}});rerender({source:'remote change'});expect(result.current.value).toBe('remote change');act(()=>result.current.setValue(' trimmed '));act(()=>result.current.acknowledge(' trimmed ','trimmed'));expect(result.current.value).toBe('trimmed');expect(result.current.dirty).toBe(false);});
 it('does not clear newer edits after an earlier request finishes',()=>{const {result}=renderHook(()=>useSettingsDraft('saved'));act(()=>result.current.setValue('first'));act(()=>result.current.setValue('newer'));act(()=>result.current.acknowledge('first'));expect(result.current.value).toBe('newer');expect(result.current.dirty).toBe(true);});
});
