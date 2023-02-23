import { z } from 'zod';

import { SponsoredCallSchema } from './schema/sponsored-call.schema';

export type SponsoredCallDto = z.infer<typeof SponsoredCallSchema>;
