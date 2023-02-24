import { z } from 'zod';

import { SponsoredCallSchema } from './schemas/sponsored-call.schema';

export type SponsoredCallDto = z.infer<typeof SponsoredCallSchema>;
