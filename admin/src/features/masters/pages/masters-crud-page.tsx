import { useMemo } from 'react';

import { MasterForm } from '../components/master-form';
import { MasterList } from '../components/master-list';
import { useMastersCrud } from '../hooks/use-masters-crud';
import {
  createEmptyMasterForm,
  mapMasterDetailToForm,
} from '../types/master';

interface MastersCrudPageProps {
  accessToken: string;
}

export const MastersCrudPage = ({ accessToken }: MastersCrudPageProps) => {
  const {
    masters,
    serviceOptions,
    selectedMaster,
    isLoading,
    isSaving,
    error,
    selectMaster,
    clearSelection,
    saveMaster,
    removeMaster,
  } = useMastersCrud(accessToken);

  const formValue = useMemo(
    () => (selectedMaster ? mapMasterDetailToForm(selectedMaster) : createEmptyMasterForm()),
    [selectedMaster],
  );

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <MasterList
          masters={masters}
          selectedMasterId={selectedMaster?.id}
          onSelect={(masterId) => void selectMaster(masterId)}
          onCreateNew={clearSelection}
        />

        <div className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
              Loading masters...
            </div>
          ) : (
            <MasterForm
              title={selectedMaster ? `Edit ${selectedMaster.fullName}` : 'Create Master'}
              initialValue={formValue}
              serviceOptions={serviceOptions}
              isSaving={isSaving}
              onSubmit={(value) => saveMaster(value, selectedMaster?.id)}
              onDelete={
                selectedMaster
                  ? async () => {
                      await removeMaster(selectedMaster.id);
                    }
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};
