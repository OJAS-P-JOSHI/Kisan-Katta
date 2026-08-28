/** Farmer-facing Gram Sahakari representative discovery DTOs. */

export type RepresentativeMatchLevel = 'VILLAGE' | 'TALUKA' | 'DISTRICT';

export type RepresentativeContact = {
  name: string;
  phone: string;
  village: string;
  taluka: string;
  district: string;
  photoUrl: string | null;
};

export type RepresentativeDiscovery = {
  available: boolean;
  matchLevel: RepresentativeMatchLevel | null;
  representatives: RepresentativeContact[];
  profileComplete: boolean;
};
