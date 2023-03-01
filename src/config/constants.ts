import { VersioningOptions, VersioningType } from '@nestjs/common';

export enum SupportedChainId {
  GOERLI = '5',
  GNOSIS_CHAIN = '100',
}

export const API_VERSIONING: VersioningOptions = {
  type: VersioningType.URI,
  prefix: 'api/v',
};
