// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuditLPIncidentModal } from '../../components/regional-ops/AuditLPIncidentModal';
import { RegionalLPIncidentDeck } from '../../components/regional-ops/RegionalLPIncidentDeck';
import { tasksService } from '../../services/tasks.service';
import type { OverrideVelocityBreach } from '../../hooks/useRegionalOperationsData';

const mockBreach: OverrideVelocityBreach = {
  siteId: 'site-ada-str-01',
  siteName: 'Adama Central Supermarket',
  managerName: 'Teshome Negeri',
  totalOverrides: 1,
  totalTransactions: 30,
  velocityRate: 3.3,
  isBreached: true
};

const mockEmployees = [
  {
    id: 'emp-sec-lead',
    name: 'Sisay Lemma',
    role: 'regional_security_manager',
    siteId: 'site-ada-admin',
    regionCode: 'ADA',
    status: 'Active',
    email: 'sisay@siifmart.com'
  }
];

afterEach(cleanup);

describe('AuditLPIncidentModal & LP Incident Deck', () => {
  it('renders breach telemetry and SOP-MGT-020 policy details when open', () => {
    render(
      <AuditLPIncidentModal
        isOpen={true}
        onClose={vi.fn()}
        breach={mockBreach}
        regionCode="ADA"
        regionalShifts={[]}
        regionalEmployees={mockEmployees as any}
        currencySymbol="ETB"
      />
    );

    expect(screen.getByText('Loss Prevention Audit')).toBeTruthy();
    expect(screen.getByText('SOP-MGT-020 Breach')).toBeTruthy();
    expect(screen.getByText('3.3%')).toBeTruthy();
    expect(screen.getByText('Teshome Negeri')).toBeTruthy();
    expect(screen.getByText('Adama Central Supermarket • Managerial Override Velocity Breach Review')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Dispatch LP Investigation/i })).toBeTruthy();
  });

  it('dispatches an LP investigation task when submitted', async () => {
    const createSpy = vi.spyOn(tasksService, 'create').mockResolvedValueOnce({
      id: 'task-123',
      title: 'Audit Task',
      description: 'Audit Description',
      assignedTo: 'emp-sec-lead',
      priority: 'High',
      status: 'Pending',
      dueDate: '2026-11-05',
      regionCode: 'ADA',
      taskType: 'LP_INVESTIGATION',
      createdBy: 'Tester'
    });

    const onClose = vi.fn();
    const onAuditCompleted = vi.fn();

    render(
      <AuditLPIncidentModal
        isOpen={true}
        onClose={onClose}
        breach={mockBreach}
        regionCode="ADA"
        regionalShifts={[]}
        regionalEmployees={mockEmployees as any}
        currencySymbol="ETB"
        onAuditCompleted={onAuditCompleted}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Dispatch LP Investigation/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          taskType: 'LP_INVESTIGATION',
          siteId: 'site-ada-str-01',
          regionCode: 'ADA'
        })
      );
      expect(onClose).toHaveBeenCalled();
      expect(onAuditCompleted).toHaveBeenCalled();
    });
  });

  it('RegionalLPIncidentDeck provides interactive Audit Incident button for breaches', () => {
    const onAuditBreach = vi.fn();

    render(
      <RegionalLPIncidentDeck
        regionCode="ADA"
        regionalSites={[]}
        varianceShifts={[]}
        discrepancyTransfers={[]}
        currencySymbol="ETB"
        overrideVelocityBreaches={[mockBreach]}
        onAuditBreach={onAuditBreach}
      />
    );

    expect(screen.getByText('Active Managerial Override Velocity Breaches (SOP-MGT-020)')).toBeTruthy();
    expect(screen.getByText('Adama Central Supermarket')).toBeTruthy();
    expect(screen.getByText('3.3% Velocity')).toBeTruthy();

    const auditBtn = screen.getByRole('button', { name: /Audit Incident/i });
    expect(auditBtn).toBeTruthy();

    fireEvent.click(auditBtn);
    expect(onAuditBreach).toHaveBeenCalledWith(mockBreach);
  });
});
