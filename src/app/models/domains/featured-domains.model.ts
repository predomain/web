import { DomainMetadataModel } from './domain-metadata.model';

export interface FeaturedDomainsModel {
  tags?: string[];
  order?: string[];
  items?: { [name: string]: string[] };
  featured?: { [tag: string]: DomainMetadataModel[] };
}
