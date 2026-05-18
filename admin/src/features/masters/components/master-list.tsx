import type { AdminMasterListItem } from '../types/master';

interface MasterListProps {
  masters: AdminMasterListItem[];
  selectedMasterId?: string;
  onSelect: (masterId: string) => void;
  onCreateNew: () => void;
}

export const MasterList = ({
  masters,
  selectedMasterId,
  onSelect,
  onCreateNew,
}: MasterListProps) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Masters</h2>
          <p className="text-sm text-slate-500">Manage employee profiles, visibility, and specialties.</p>
        </div>
        <button
          type="button"
          onClick={onCreateNew}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          New Master
        </button>
      </div>

      <div className="space-y-3">
        {masters.map((master) => {
          const isSelected = selectedMasterId === master.id;

          return (
            <button
              key={master.id}
              type="button"
              onClick={() => onSelect(master.id)}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                isSelected
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{master.fullName}</div>
                  <div className={`text-sm ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                    {master.specializations.join(', ') || 'No specializations assigned'}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    master.isVisible
                      ? isSelected
                        ? 'bg-white/15 text-white'
                        : 'bg-emerald-100 text-emerald-700'
                      : isSelected
                        ? 'bg-white/15 text-white'
                        : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {master.isVisible ? 'Visible' : 'Hidden'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
