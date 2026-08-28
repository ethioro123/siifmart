import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import { logger } from '../utils/logger';

export interface CapacitorState {
    isNative: boolean;
    isAndroid: boolean;
    isIos: boolean;
    platform: string;
    isConnected: boolean;
    connectionType: string;
}

export function useCapacitor() {
    const [state, setState] = useState<CapacitorState>({
        isNative: Capacitor.isNativePlatform(),
        isAndroid: Capacitor.getPlatform() === 'android',
        isIos: Capacitor.getPlatform() === 'ios',
        platform: Capacitor.getPlatform(),
        isConnected: true,
        connectionType: 'unknown'
    });

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        // 1. Configure Android / iOS Status Bar
        const setupStatusBar = async () => {
            try {
                await StatusBar.setStyle({ style: Style.Dark });
                if (Capacitor.getPlatform() === 'android') {
                    await StatusBar.setBackgroundColor({ color: '#151D18' });
                }
            } catch (err) {
                logger.warn('useCapacitor', 'Failed to configure status bar', { error: String(err) });
            }
        };
        setupStatusBar();

        // 2. Monitor Network Connectivity
        const initNetwork = async () => {
            try {
                const status = await Network.getStatus();
                setState(prev => ({
                    ...prev,
                    isConnected: status.connected,
                    connectionType: status.connectionType
                }));

                const listener = await Network.addListener('networkStatusChange', status => {
                    logger.info('useCapacitor', `Network status changed: connected=${status.connected}, type=${status.connectionType}`);
                    setState(prev => ({
                        ...prev,
                        isConnected: status.connected,
                        connectionType: status.connectionType
                    }));
                });

                return () => {
                    listener.remove();
                };
            } catch (err) {
                logger.warn('useCapacitor', 'Network listener initialization error', { error: String(err) });
            }
        };
        const cleanupNetwork = initNetwork();

        // 3. Android Hardware Back Button Handler
        let backListener: any = null;
        const setupBackButton = async () => {
            try {
                backListener = await App.addListener('backButton', ({ canGoBack }) => {
                    if (canGoBack) {
                        window.history.back();
                    } else {
                        // At root page: minimize app instead of abruptly exiting
                        App.minimizeApp();
                    }
                });
            } catch (err) {
                logger.warn('useCapacitor', 'Back button listener error', { error: String(err) });
            }
        };
        setupBackButton();

        return () => {
            cleanupNetwork.then(cleanup => cleanup && cleanup());
            if (backListener) backListener.remove();
        };
    }, []);

    // Haptic feedback for barcode scan success
    const triggerScanHaptic = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) return;
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch {
            // Silently ignore if haptics unavailable on device
        }
    }, []);

    // Haptic feedback for scan error / mismatch
    const triggerErrorHaptic = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) return;
        try {
            await Haptics.notification({ type: NotificationType.Error });
        } catch {
            // Silently ignore
        }
    }, []);

    return {
        ...state,
        triggerScanHaptic,
        triggerErrorHaptic
    };
}
