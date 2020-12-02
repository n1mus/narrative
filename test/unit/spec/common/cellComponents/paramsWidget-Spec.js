/*global describe, it, expect*/
/*global beforeEach, beforeAll, afterALl*/
/*jslint white: true*/

define([
    'common/cellComponents/paramsWidget',
    'common/runtime',
    'common/props',
    'common/spec',
    'json!../../../../../data/testAppObj.json'
], function(
    ParamsWidget,
    Runtime,
    Props,
    Spec,
    TestAppObject
) {
    'use strict';

    describe('The Parameter module', function() {
        it('loads', function() {
            expect(ParamsWidget).not.toBe(null);
        });

        it('has expected functions', function() {
            expect(ParamsWidget.make).toBeDefined();
        });
    });

    describe('The Parameter instance', function() {
        beforeAll(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken'
            };
        });

        afterAll(() => {
            Jupyter.narrative = null;
        });

        beforeEach(async function () {
            const bus = Runtime.make().bus();
            const node = document.createElement('div');
            document.getElementsByTagName('body')[0].appendChild(node);

            const model = Props.make({
                data: TestAppObject,
                onUpdate: (props) => { }
            });

            let spec = Spec.make({
                appSpec: model.getItem('app.spec')
            });

            const workspaceId = 54745;

            const mockParamsWidget = ParamsWidget.make({
                bus: bus,
                workspaceId: workspaceId,
                initialParams: model.getItem('params')
            });

            await mockParamsWidget.start({
                node: node,
                appSpec: spec,
                parameters: spec.getSpec().parameters
            });
        });

        it('should do something interesting', () => {
            
        });


    });
});
