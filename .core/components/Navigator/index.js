import _ from 'underscore';
import cc from 'camelcase';
import op from 'object-path';
import React, { forwardRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Reactium, {
    useEventEffect,
    useHandle,
    useHookComponent,
} from 'reactium-core/sdk';

const validateRoute = route => {
    const app = Reactium.Handle.get('app').current;
    const perms = op.get(route, 'permission');
    return !perms
        ? true
        : typeof perms === 'function'
        ? perms({ route, user: app.User })
        : app.User.can(perms);
};

Reactium.Route.filtered = () => Reactium.Route.list.filter(validateRoute).map(item => {
    item.name = cc(item.name);
    return item;
});

const Stack = createNativeStackNavigator();

let Navigator = ({ route = null }, ref) => {
    const app = useHandle('app');
    const Splash = useHookComponent('Splash');

    const [routes, setRoutes] = useState(Reactium.Route.filtered());

    useEventEffect(app, { change: () => setRoutes(Reactium.Route.filtered()) });

    return !route || !app.isInit() ? null : (
        <Splash>
            <NavigationContainer ref={ref}>
                <Stack.Navigator
                    initialRouteName={route}
                    screenListeners={{
                        focus: app.routeChanged,
                        beforeRemove: app.routeBlur,
                        blur: app.routeBlur,
                    }}>
                    {routes.map(r => (
                        <Stack.Screen {...r} key={r.id} />
                    ))}
                </Stack.Navigator>
            </NavigationContainer>
        </Splash>
    );
};

Navigator = forwardRef(Navigator);

export { Navigator, Navigator as default };
