import { createBackButton, createMainMenuButton } from './button-builders';
import { buildInlineKeyboard } from './inline-keyboard.builder';

interface BackKeyboardOptions {
  showMainMenuButton?: boolean;
}

export const buildBackKeyboard = ({
  showMainMenuButton = true,
}: BackKeyboardOptions = {}) => {
  return buildInlineKeyboard([
    showMainMenuButton
      ? [createBackButton(), createMainMenuButton()]
      : [createBackButton()],
  ]);
};
