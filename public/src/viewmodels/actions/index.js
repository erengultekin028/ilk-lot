// Tüm katılımcı eylem gruplarını tek nesnede birleştirir. Tıklama olayları event-bindings.js içinde bu nesneye yönlendirilir.

import { flowActions } from './flow-actions.js';
import { freePlayActions } from './free-play-actions.js';
import { marketActions } from './market-actions.js';
import { uiActions } from './ui-actions.js';

export const actions = Object.assign({}, flowActions, marketActions, freePlayActions, uiActions);
