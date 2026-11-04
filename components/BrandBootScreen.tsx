import React from 'react';
import Logo from './Logo';
import { useLanguage } from '../contexts/LanguageContext';

export default function BrandBootScreen({ error }: { error?: string | null }) {
    const { t } = useLanguage();
    return (
        <main className="brand-boot" aria-busy={!error}>
            <div className="brand-boot__aura" aria-hidden="true" />
            <div className="brand-boot__content">
                <div className="brand-boot__identity">
                    <Logo variant="stacked" size={52} showTagline={false} />
                </div>
                <div className="brand-boot__loading" role="status">
                    <div className="brand-boot__track" aria-hidden="true"><span /></div>
                    <span className="brand-boot__caption">{t('common.loading')}</span>
                </div>
                {error && (
                    <div className="brand-boot__error" role="alert">
                        <p>{error}</p>
                        <button type="button" onClick={() => window.location.reload()}>
                            {t('common.retry')}
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
