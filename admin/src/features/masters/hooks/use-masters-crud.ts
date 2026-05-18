import { useEffect, useState } from 'react';

import {
  createAdminMaster,
  deleteAdminMaster,
  getAdminMaster,
  listAdminMasters,
  listServiceOptions,
  updateAdminMaster,
} from '../api/masters.api';
import type {
  AdminMasterDetail,
  AdminMasterListItem,
  MasterFormState,
  ServiceOption,
} from '../types/master';

export const useMastersCrud = (token: string) => {
  const [masters, setMasters] = useState<AdminMasterListItem[]>([]);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [selectedMaster, setSelectedMaster] = useState<AdminMasterDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMasters = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [mastersResponse, servicesResponse] = await Promise.all([
        listAdminMasters(token),
        listServiceOptions(),
      ]);

      setMasters(mastersResponse);
      setServiceOptions(servicesResponse);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load masters');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMasters();
  }, [token]);

  const selectMaster = async (masterId: string) => {
    setError(null);

    try {
      const master = await getAdminMaster(token, masterId);
      setSelectedMaster(master);
    } catch (selectError) {
      setError(selectError instanceof Error ? selectError.message : 'Failed to load master');
    }
  };

  const clearSelection = () => {
    setSelectedMaster(null);
    setError(null);
  };

  const saveMaster = async (form: MasterFormState, masterId?: string) => {
    setIsSaving(true);
    setError(null);

    try {
      const savedMaster = masterId
        ? await updateAdminMaster(token, masterId, form)
        : await createAdminMaster(token, form);

      setSelectedMaster(savedMaster);
      await loadMasters();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save master');
      throw saveError;
    } finally {
      setIsSaving(false);
    }
  };

  const removeMaster = async (masterId: string) => {
    setIsSaving(true);
    setError(null);

    try {
      await deleteAdminMaster(token, masterId);
      if (selectedMaster?.id === masterId) {
        setSelectedMaster(null);
      }
      await loadMasters();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete master');
      throw deleteError;
    } finally {
      setIsSaving(false);
    }
  };

  return {
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
    reload: loadMasters,
  };
};
