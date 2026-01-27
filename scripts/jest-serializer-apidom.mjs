import { isElement } from '@speclynx/apidom-datamodel';
import { dehydrate } from '@speclynx/apidom-core';

export { isElement as test };

export const print = (val) => JSON.stringify(dehydrate(val), null, 2);
