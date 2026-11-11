import type { Api } from './Api';
import { HttpApi } from './httpApi';
import { MockApi } from './mockApi';

const useMock = import.meta.env.VITE_MOCK === '1';
export const api: Api = useMock ? new MockApi() : new HttpApi();
