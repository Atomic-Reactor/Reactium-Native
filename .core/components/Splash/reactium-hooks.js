import domain from './domain';
import Component from './index';
import Reactium from 'reactium-core/sdk';

(() => {
    Reactium.Component.register(
        domain.name,
        Component,
        Reactium.Enums.priority.highest,
    );
})();
