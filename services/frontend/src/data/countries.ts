/* Thin wrapper around country-state-city.
   Re-exports a flat array with US first, matching our Country interface. */

import { Country as CSCCountry } from "country-state-city";

export interface Country {
    code: string;   // ISO 3166-1 alpha-2
    name: string;
    flag: string;   // emoji flag
    dial: string;   // e.g. "+1"
}

function toCountry(c: { isoCode: string; name: string; flag: string; phonecode: string }): Country {
    return {
        code: c.isoCode,
        name: c.name,
        flag: c.flag,
        dial: c.phonecode.startsWith("+") ? c.phonecode : `+${c.phonecode}`,
    };
}

const raw = CSCCountry.getAllCountries();
const us = raw.find((c) => c.isoCode === "US");
const rest = raw.filter((c) => c.isoCode !== "US").sort((a, b) => a.name.localeCompare(b.name));

const ALL: Country[] = [
    ...(us ? [toCountry(us)] : []),
    ...rest.map(toCountry),
];

export default ALL;
