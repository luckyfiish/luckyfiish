import { CalendarCheck2, Check } from 'lucide-react';
import { MainTab } from '../types/character';

interface NavbarProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  clovers: number;
  checkedInToday: boolean;
  onCheckIn: () => void;
}

const NAV_ITEMS: Array<{ id: MainTab; label: string }> = [
  { id: 'nhan-vat', label: 'Nhân Vật' },
  { id: 'vong-quay', label: 'Vòng Quay' },
  { id: 'thu-vien', label: 'Thư Viện' },
  { id: 'fiish', label: 'Fiish' },
];

export function Navbar({
  activeTab,
  onSelectTab,
  clovers,
  checkedInToday,
  onCheckIn,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/80 bg-white/55 backdrop-blur-xl shadow-[0_4px_24px_rgba(14,116,144,0.08)]">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <button
          type="button"
          onClick={() => onSelectTab('nhan-vat')}
          className="font-display text-2xl font-bold tracking-tight text-[#0A2A43] hover:text-[#0284C7] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0284C7] rounded"
        >
          luckyfiish
        </button>

        <nav
          aria-label="Điều hướng chính"
          className="hidden md:flex items-center gap-7 text-sm font-semibold"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'text-[#0284C7] underline underline-offset-8 decoration-2'
                    : 'text-[#285270] hover:text-[#0A2A43] hover:underline underline-offset-8'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="glass-btn px-3.5 py-1.5 text-xs sm:text-sm font-bold tabular-nums whitespace-nowrap shrink-0">
            {clovers} 🍀
          </div>
          <button
            type="button"
            onClick={onCheckIn}
            disabled={checkedInToday}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 ${
              checkedInToday
                ? 'glass-btn opacity-80 cursor-default'
                : 'glass-btn-lucky cursor-pointer'
            }`}
          >
            {checkedInToday ? (
              <>
                <Check className="w-4 h-4 text-[#15803D]" />
                <span>Đã điểm danh</span>
              </>
            ) : (
              <>
                <CalendarCheck2 className="w-4 h-4 text-[#15803D]" />
                <span>Điểm danh +2 🍀</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Compact mobile tab switcher */}
      <nav
        aria-label="Điều hướng di động"
        className="md:hidden flex items-center gap-2 px-4 pb-2.5 overflow-x-auto"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive ? 'glass-btn-lucky' : 'glass-btn text-[#285270]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
