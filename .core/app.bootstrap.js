/**
 * Reactium Native App Bootstrap
 *
 * @format
 * @flow strict-local
 */

import op from 'object-path';
import pkg from '~/package.json';
import manifest from '~/src/manifest';
import React, { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Reactium, {
    ComponentEvent,
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
        hasActinium: false,
        route: {
            init: false,
            previous: null,
            current: 'home',
            updated: Date.now(),
        },
    });

    const [prevStatus, setPrevStatus] = useState();
    const [status, setStatus] = useState(STATUS.STARTING);
    const [navigation, updateNavigation] = useState(null);

    const actiniumINIT = useCallback(() => {
        const { appID, serverURL } = op.get(pkg, 'actinium', {
            appID: null,
            serverURL: null,
        });

        if (typeof serverURL === 'string' && typeof appID === 'string') {
            Reactium.CoreManager.set('SERVER_URL', serverURL);
            Reactium.setAsyncStorage(AsyncStorage);
            Reactium.initialize(appID);

            return true;
        }

        return false;
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

    const runHook = useCallback(async hook => {
        const startTime = performance.now();

        console.log(`Starting '${hook}' hook...`);

        try {
            Reactium.Hook.runSync(hook, state);
        } catch (err) {
            console.log(err);
        }

        try {
            await Reactium.Hook.run(hook, state);
        } catch (err) {
            console.log(err);
        }

        const endTime = performance.now();
        const diff = endTime - startTime;
        const elapsed = Math.round((diff + Number.EPSILON) * 100) / 100;

        console.log(`Finished '${hook}' after ${elapsed} ms`);
        console.log('');
    });

    const runHooks = useCallback(async () => {
        for (let hook of manifest.hook) {
            try {
                await hook();
            } catch (err) {
                console.log('Error running hook:', hook);
            }
        }

        setStatus(STATUS.BOOTUP);
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

    useEffect(() => {
        if (prevStatus === status) return;
        switch (status) {
            case STATUS.STARTING:
                runHooks();
                break;

            case STATUS.BOOTUP:
                state.set('hasActinium', actiniumINIT());
                bootup();
                break;

            case STATUS.READY:
                done();
                break;
        }
    }, [status]);

    useEffect(() => {
        if (prevStatus !== status) setPrevStatus(status);
    }, [status]);

    useEffect(() => {
        Reactium.Navigator = navigation;
    }, [navigation]);

    // External Interface: Extensions
    state.extend('rerender', () => state.set('updated', Date.now()));
    state.extend('routeChanged', onRouteChange);
    state.extend('runHook', runHook);
    state.extend('shouldRender', shouldRender);

    // External Interface: register handle 'AppState'
    useRegisterHandle('AppState', () => state);

    // Renderer
    return <Navigator ref={setNavigation} isLoaded={shouldRender()} />;
};

export default App;
