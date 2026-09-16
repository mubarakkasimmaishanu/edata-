import React from 'react';
import { Clock, Download, ArrowRight, X } from 'lucide-react';
import { AppVersionData } from '../types';
import { openStoreLink } from '../services/appUpdateService';

interface GracePeriodBannerProps {
  updateData: AppVersionData;
  onOpenModal?: () => void;
  onDismiss?: () => void;
}

export default function GracePeriodBanner({ updateData, onOpenModal, onDismiss }: GracePeriodBannerProps) {
  if (!updateData || updateData.update_type !== 'FLEXIBLE' || updateData.days_to_expire <= 0) {
    return null;
  }

  const handleUpdate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = updateData.market_url || updateData.play_store_url;
    openStoreLink(url);
  };

  return (
    <div className="w-full px-4 pt-2 pb-1 font-display">
      <div
        onClick={onOpenModal}
        className="w-full py-2.5 px-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/25 dark:border-amber-700/40 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 shadow-xs cursor-pointer hover:bg-amber-500/15 transition-all"
        role="alert"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300">
                {updateData.days_to_expire === 1 ? '1 Day Left' : `${updateData.days_to_expire} Days Left`}
              </span>
              <span className="text-xs font-bold truncate">Update Available</span>
            </div>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 truncate">
              Support for v{updateData.installed_version} expires soon. Tap to upgrade to v{updateData.latest_version}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleUpdate}
            className="py-1 px-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Update</span>
          </button>

          {onDismiss && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
