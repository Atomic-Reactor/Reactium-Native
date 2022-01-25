import Reactium from 'reactium-core/sdk';

(() => {
    Reactium.Component.register(
        'ReactiumUI',
        Reactium.UI,
        Reactium.Enums.priority.highest,
    );
    Object.entries(Reactium.UI).forEach(([key, sdk]) => {
        const name = `ReactiumUI/${key}`;
        Reactium.Component.register(name, sdk, Reactium.Enums.priority.highest);
    });
})();
