/**
 * @format
 */
import 'react-native-gesture-handler';
import App from 'reactium-core/bootstrap';
import { AppRegistry } from 'react-native';
import { name as appName } from '~/app.json';
import { StatusBar } from 'react-native';


StatusBar.setHidden(true);

AppRegistry.registerComponent(appName, () => App);
