import { Markup } from 'telegraf';

import { createBackButton, createMainMenuButton } from './button-builders';
import { buildInlineKeyboard } from './inline-keyboard.builder';

export const buildMastersListKeyboard = (
  masters: Array<{ id: string; fullName: string }>,
) => {
  const masterRows = masters.map((master) => [
    Markup.button.callback(master.fullName, `master:open:${master.id}`),
  ]);

  return buildInlineKeyboard([
    ...masterRows,
    [createBackButton(), createMainMenuButton()],
  ]);
};

export const buildMasterDetailKeyboard = () => {
  return buildInlineKeyboard([
    [
      Markup.button.callback('Back to Masters', 'master:list'),
      createMainMenuButton(),
    ],
  ]);
};
