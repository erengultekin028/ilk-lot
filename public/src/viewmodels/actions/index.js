// Tüm eylem gruplarını tek nesnede birleştirir ve tıklama olaylarını eylemlere yönlendirir.

import { flowActions } from './flow-actions.js';
import { freePlayActions } from './free-play-actions.js';
import { marketActions } from './market-actions.js';
import { uiActions } from './ui-actions.js';
import { ADMIN_ACTIONS, adminSelfTestActions } from '../../admin/admin-actions.js';

export const actions = Object.assign(
  {},
  flowActions,
  marketActions,
  freePlayActions,
  uiActions,
  adminSelfTestActions
);

for (const _k in ADMIN_ACTIONS) actions[_k] = ADMIN_ACTIONS[_k];
