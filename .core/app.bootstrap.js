/**
 * Reactium Native App Bootstrap
 *
 * @format
 * @flow strict-local
 */

import op from 'object-path';
import pkg from '~/package.json';
import manifest from '~/src/manifest';
import { MMKV } from 'react-native-mmkv';
import { NavigationContainer } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Reactium, {
    ComponentEvent,
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
    'sdk-init',
    'init',
    'dependencies',
    'plugin-dependencies',
    'plugin-ready',
    'routes',
    'data-sync',
    'app-ready',
];

const Stack = createNativeStackNavigator();

const App = () => {
    const state = useSyncState({
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
            Reactium.setAsyncStorage(new MMKV());
            Reactium.serverURL = serverURL;
            Reactium.initialize(appID);
        }
    }, []);

    const bootup = useCallback(async () => {
        actiniumINIT();
        Reactium.Cache.load();

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
        Reactium.Hook.runSync(hook);

        try {
            await Reactium.Hook.run(hook);
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

    useRegisterHandle('AppState', () => {
        Reactium.Hook.runSync('app-state-extend', state);
        return state;
    });

    useEffect(() => {
        if (prevStatus === status) return;
        switch (status) {
            case STATUS.STARTING:
                runHooks();
                break;

            case STATUS.BOOTUP:
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
        if (navigation !== null) {
            Reactium.Route.navigation = navigation;
        }
    }, [navigation]);

    return (
        <>
            <NavigationContainer ref={setNavigation}>
                {shouldRender() ? (
                    <Stack.Navigator
                        screenListeners={{ focus: onRouteChange }}
                        initialRouteName={state.get('route.current')}>
                        {Reactium.Route.list.map((route, i) => (
                            <Stack.Screen
                                {...route}
                                key={`route-${i}-${route.id}`}
                            />
                        ))}
                    </Stack.Navigator>
                ) : null}
            </NavigationContainer>
        </>
    );
};

export default App;
