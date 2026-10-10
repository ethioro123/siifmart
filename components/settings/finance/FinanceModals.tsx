import React from 'react';
import { Globe, Landmark, MapPin, Layers, Percent } from 'lucide-react';
import Modal from '../../Modal';
import Button from '../../shared/Button';
import { InputGroup, RadioCard, ToggleRow } from './FinanceInputControls';
import type { TaxRule } from '../../../types';

interface FinanceModalsProps {
    isAddingZone: boolean;
    setIsAddingZone: (val: boolean) => void;
    handleAddZone: () => void;
    newZone: { name: string; type: 'National' | 'Region' };
    setNewZone: React.Dispatch<React.SetStateAction<{ name: string; type: 'National' | 'Region' }>>;

    activeZoneId: string | null;
    setActiveZoneId: (val: string | null) => void;
    handleAddRule: () => void;
    newRule: TaxRule;
    setNewRule: React.Dispatch<React.SetStateAction<TaxRule>>;
}

export const FinanceModals: React.FC<FinanceModalsProps> = ({
    isAddingZone,
    setIsAddingZone,
    handleAddZone,
    newZone,
    setNewZone,

    activeZoneId,
    setActiveZoneId,
    handleAddRule,
    newRule,
    setNewRule,
}) => {
    return (
        <>
            <Modal
                isOpen={isAddingZone}
                onClose={() => setIsAddingZone(false)}
                title="Add New Jurisdiction"
                footer={(
                    <div className="flex gap-3 justify-end">
                        <Button variant="ghost" onClick={() => setIsAddingZone(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleAddZone} disabled={!newZone.name.trim()}>Add Jurisdiction</Button>
                    </div>
                )}
            >
                <div className="space-y-4">
                    <InputGroup
                        label="Jurisdiction Name"
                        placeholder="e.g. Oromia Region or Nairobi County"
                        value={newZone.name}
                        onChange={(e) => setNewZone(prev => ({ ...prev, name: e.target.value }))}
                        icon={Globe}
                    />
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">Type</label>
                        <RadioCard<'National' | 'Region'>
                            value={newZone.type}
                            onChange={(val) => setNewZone(prev => ({ ...prev, type: val }))}
                            options={[
                                { value: 'National', label: 'National', icon: Landmark },
                                { value: 'Region', label: 'Region', icon: MapPin },
                            ]}
                        />
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={activeZoneId !== null}
                onClose={() => setActiveZoneId(null)}
                title="Add Tax Rule"
                footer={(
                    <div className="flex gap-3 justify-end">
                        <Button variant="ghost" onClick={() => setActiveZoneId(null)}>Cancel</Button>
                        <Button variant="primary" onClick={handleAddRule} disabled={!newRule.name.trim()}>Add Rule</Button>
                    </div>
                )}
            >
                <div className="space-y-4">
                    <InputGroup
                        label="Rule Name"
                        placeholder="e.g. Sales Tax, Excise, Local Levy"
                        value={newRule.name}
                        onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                        icon={Layers}
                    />
                    <InputGroup
                        label="Tax Rate (%)"
                        type="number"
                        value={newRule.rate}
                        onChange={(e) => setNewRule(prev => ({ ...prev, rate: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) }))}
                        icon={Percent}
                        prefix="%"
                    />
                    <ToggleRow
                        label="Compound Tax"
                        sub="Apply this tax on top of previous taxes"
                        checked={newRule.compound}
                        onChange={() => setNewRule(prev => ({ ...prev, compound: !prev.compound }))}
                    />
                </div>
            </Modal>
        </>
    );
};
export default FinanceModals;
