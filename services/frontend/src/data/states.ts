/* Thin wrapper around country-state-city for state/province data. */

import { State as CSCState } from "country-state-city";

export interface StateProvince {
    code: string;
    name: string;
}

/** Get states/provinces for a given ISO country code. Returns empty array if none. */
export function getStatesForCountry(countryCode: string): StateProvince[] {
    return CSCState.getStatesOfCountry(countryCode).map((s) => ({
        code: s.isoCode,
        name: s.name,
    }));
}
