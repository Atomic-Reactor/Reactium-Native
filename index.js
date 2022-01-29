/**
 * @format
 */
import op from 'object-path';
import pkg from '~/package.json';
import 'react-native-gesture-handler';
import Reactium from 'reactium-core/sdk';
import App from 'reactium-core/bootstrap';
import { name as appName } from '~/app.json';
import { AppRegistry, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const actiniumINIT = async () => {
    const appID = op.get(pkg, 'actinium.appID');
    const serverURL = op.get(pkg, 'actinium.serverURL');

    if (!appID || !serverURL) return;

    Reactium.CoreManager.set('SERVER_URL', serverURL);
    Reactium.setAsyncStorage(AsyncStorage);
    return Reactium.initialize(appID);
};

(async () => {
    StatusBar.setHidden(true);

    await actiniumINIT();

    AppRegistry.registerComponent(appName, () => App);
})();
