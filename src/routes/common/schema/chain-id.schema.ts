import { z } from 'zod';

import { SupportedChainId } from '../../../config/constants';

export const ChainIdSchema = z.nativeEnum(SupportedChainId);
