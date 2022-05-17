import * as UI from 'react-native-ui-lib';
import { useRunHook } from './useRunHook';
import { useUserCan } from './useUserCan';
import { LocalStorage } from './localStorage';
import { useDispatcher } from './useDispatcher';

import SDK from '@atomic-reactor/reactium-native-sdk-core';

export * from './localStorage';
export * from './useDispatcher';
export * from './useRunHook';
export * from './useUserCan';
export * from '@atomic-reactor/reactium-native-sdk-core';

export const __ = str => str;

export default {
    ...SDK,
    __,
    UI,
    LocalStorage,
    useDispatcher,
    useRunHook,
    useUserCan,
};
