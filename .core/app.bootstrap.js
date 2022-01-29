/**
 * Reactium Native App Bootstrap
 *
 * @format
 * @flow strict-local
 */

import _ from 'underscore';
import op from 'object-path';
import pkg from '~/package.json';
import manifest from '~/src/manifest';
import { AppState } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Reactium, {
    ComponentEvent,
    useEventEffect,
    useHookComponent,
    useRegisterHandle,
    useSyncState,
} from 'reactium-core/sdk';

const STATUS = {
    STARTING: 1,
    BOOTUP: 2,
    READY: 3,
    DONE: 4,
};

const BOOT_HOOKS = [
    'init',
    'sdk-init',
    'dependencies',
    'plugin-dependencies',
    'plugin-ready',
    'routes',
    'data-sync',
    'app-ready',
];

const App = () => {
    const Navigator = useHookComponent('Navigator');

    const state = useSyncState({
        actinium: false,
        appstate: 'active',
        route: {
            init: false,
            previous: null,
            current: 'home',
            updated: Date.now(),
        },
        user: null,
    });

    const dispatch = Reactium.useDispatcher({ state });

    const [prevStatus, setPrevStatus] = useState();
    const [status, setStatus] = useState(STATUS.STARTING);
    const [navigation, updateNavigation] = useState(null);

    const actiniumINIT = useCallback(() => {
        const appID = op.get(pkg, 'actinium.appID');
        const serverURL = op.get(pkg, 'actinium.serverURL');

        if (!state.get('actinium') || !appID || !serverURL) return;

        Reactium.CoreManager.set('SERVER_URL', serverURL);
        Reactium.setAsyncStorage(AsyncStorage);
        Reactium.initialize(appID);
    });

    const bootup = useCallback(async () => {
        console.log('');
        for (let hook of BOOT_HOOKS) {
            await runHook(hook);
        }

        setStatus(STATUS.READY);
    });

    const done = useCallback(async () => {
        await runHook('ready');
        setStatus(STATUS.DONE);
    });

    const isStatus = useCallback(s => Boolean(s === status));

    const loadHooks = useCallback(async () => {
        for (let hook of manifest.hook) {
            try {
                await hook();
            } catch (err) {
                console.log('Error running hook:', hook);
            }
        }

        setStatus(STATUS.BOOTUP);
    });

    const onAppState = useCallback(current => {
        const isActive = current === 'active';

        current = !isActive ? 'inactive' : current;

        const previous = state.get('appstate', 'active');

        if (previous === current) return;

        state.set('appstate', current);

        if (!isActive) {
            Reactium.LocalStorage.set('state', state.get());
        }

        dispatch(`appstate-${current}`);
        dispatch('appstate', { current, previous });
    });

    const onRouteChange = useCallback(({ type, ...e }) => {
        if (!navigation) return;

        const { name, params = {} } = navigation.getCurrentRoute() || {
            name: state.get('route.current'),
        };

        if (!name) return;

        switch (type) {
            case 'focus':
                const current = name;
                const route = state.get('route');
                const routeInit = op.get(route, 'init');
                const previous = op.get(route, 'current');
                const newRoute = { current, previous, params, init: true };

                state.set('route', newRoute);

                if (routeInit === true) {
                    const evt = new ComponentEvent('route-change', newRoute);
                    const _onRouteChange = async e => {
                        await Reactium.Hook.run('route-change', e);
                        Reactium.Hook.runSync('route-change', e);
                    };
                    state.addEventListener('route-change', _onRouteChange);
                    state.dispatchEvent(evt);
                    state.removeEventListener('route-change', _onRouteChange);
                }
                break;
        }
    });

    const onStateChange = useCallback(({ path: key, value, ...event }) => {
        key = key === 'undefiend' || !key ? event.__path : key;
        if (key === 'undefined' || !key) return;
        dispatch('change', { key, value });
    }, []);

    const perm = ({ role, level, id }) => {};

    const runHook = useCallback(async (hook, options) => {
        const defaultOptions = {
            event: true,
            synchronous: true,
            asynchronous: true,
        };

        options = _.isObject(options)
            ? { ...defaultOptions, ...options }
            : defaultOptions;

        const startTime = performance.now();

        console.log(`Starting '${hook}' hook...`);

        const includeHooks = BOOT_HOOKS.includes(hook);

        if (options.event === true) {
            dispatch(hook, {
                BOOT_HOOKS: includeHooks ? BOOT_HOOKS : undefined,
            });
        }

        if (options.synchronous === true) {
            try {
                Reactium.Hook.runSync(
                    hook,
                    state,
                    includeHooks ? BOOT_HOOKS : null,
                );
            } catch (err) {
                console.log(err);
            }
        }

        if (options.asynchronous === true) {
            try {
                await Reactium.Hook.run(
                    hook,
                    state,
                    includeHooks ? BOOT_HOOKS : null,
                );
            } catch (err) {
                console.log(err);
            }
        }

        if (hook === 'init') actiniumINIT();

        if (hook === 'sdk-init') {
            if (!state.get('actinium')) return;
            const user = await Reactium.User.currentAsync();
            state.set('user', user ? user.id : false);
        }

        const endTime = performance.now();
        const diff = endTime - startTime;
        const elapsed = Math.round((diff + Number.EPSILON) * 100) / 100;

        console.log(`Finished '${hook}' after ${elapsed} ms`);
        console.log('');
    });

    const setNavigation = useCallback(value => {
        if (navigation || !value) return;
        updateNavigation(value);
    });

    const shouldRender = useCallback(() => {
        if (navigation === null) {
            return false;
        }

        if (!isStatus(STATUS.DONE)) {
            return false;
        }

        if (Reactium.Route.list.length < 1) {
            return false;
        }

        return true;
    });

    // Status change
    useEffect(() => {
        if (prevStatus === status) return;
        switch (status) {
            case STATUS.STARTING:
                loadHooks();
                break;

            case STATUS.BOOTUP:
                bootup();
                break;

            case STATUS.READY:
                done();
                break;
        }

        setPrevStatus(status);
    }, [status]);

    // Navigation created
    useEffect(() => {
        Reactium.Navigator = navigation;
    }, [navigation]);

    // AppState change
    useEffect(() => {
        const subscription = AppState.addEventListener('change', onAppState);

        return () => {
            subscription.remove();
        };
    }, []);

    // state change
    useEventEffect(state, { set: onStateChange });

    // External Interface: Extensions
    state.extend('rerender', () => state.set('updated', Date.now()));
    state.extend('routeChanged', onRouteChange);
    state.extend('runHook', runHook);
    state.extend('shouldRender', shouldRender);

    // External Interface: register handle 'AppState'
    useRegisterHandle('app', () => state);

    // Renderer
    return (
        <Navigator
            ref={setNavigation}
            isLoaded={shouldRender()}
            route={state.get('route.current')}
        />
    );
};

export default App;
